/**
 * GET /api/extension/letters/[id]/pdf
 *
 * The PDF of one of the professor's sealed letters. Auth: the extension Bearer
 * token. Another professor's letter answers 404. The file is sent directly, so
 * it never has a shareable URL.
 */

import { NextResponse } from "next/server";
import { adminDb } from "@/lib/admin";
import { bearerToken, extensionProfessor } from "@/lib/extension-auth";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = bearerToken(req);
  const db = adminDb();
  const professor = token ? await extensionProfessor(db, token) : null;
  if (!professor) return NextResponse.json({ error: "Not connected." }, { status: 401 });

  const { data: letter } = await db
    .from("letters")
    .select("storage_path, finalized_at")
    .eq("id", id)
    .eq("faculty_id", professor.facultyId)
    .eq("is_draft", false)
    .maybeSingle();
  if (!letter?.storage_path) return NextResponse.json({ error: "Letter not found." }, { status: 404 });

  const { data: file, error } = await db.storage.from("letters").download(letter.storage_path as string);
  if (error || !file) {
    console.error("[extension/pdf] download failed:", id, error);
    return NextResponse.json({ error: "The PDF is not available." }, { status: 500 });
  }
  const day = String(letter.finalized_at ?? "").slice(0, 10);
  return new Response(file, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="recommendation-letter${day ? `-${day}` : ""}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
