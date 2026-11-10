/**
 * GET /api/extension/summary
 *
 * Everything the extension side panel shows: the professor's profile fields for
 * copying into school portals, open requests (with the emailed link to write
 * the letter), and sealed letters. Auth: the extension Bearer token.
 */

import { NextResponse } from "next/server";
import { adminDb } from "@/lib/admin";
import { bearerToken, extensionProfessor } from "@/lib/extension-auth";
import { dbRowToProfile, type FacultyProfileRow } from "@/lib/faculty-profile";
import { listFacultyFinalizedLetters, listFacultyRequests } from "@/lib/faculty-data";
import { requestLinkUrl } from "@/lib/request-access";

export async function GET(req: Request) {
  const token = bearerToken(req);
  const db = adminDb();
  const professor = token ? await extensionProfessor(db, token) : null;
  if (!professor) return NextResponse.json({ error: "Not connected." }, { status: 401 });

  const [{ data: row }, { data: auth }, requests, letters] = await Promise.all([
    db.from("faculty").select("*").eq("id", professor.facultyId).single(),
    db.auth.admin.getUserById(professor.userId),
    listFacultyRequests(db, professor.facultyId),
    listFacultyFinalizedLetters(db, professor.facultyId),
  ]);
  const meta = auth?.user?.user_metadata ?? {};
  const p = dbRowToProfile(
    row as FacultyProfileRow,
    auth?.user?.email,
    meta.firstName as string | undefined,
    meta.lastName as string | undefined,
  );

  return NextResponse.json({
    profile: {
      name: [p.prefix, p.firstName, p.lastName].filter(Boolean).join(" "),
      title: p.title,
      department: p.department,
      institution: p.organization,
      email: p.email,
      address: [p.street, p.city, [p.state, p.postalCode].filter(Boolean).join(" "), p.country]
        .filter(Boolean)
        .join(", "),
    },
    requests: requests.map((r) => ({
      requestId: r.requestId,
      studentName: r.studentName,
      courseContext: r.courseContext,
      createdAt: r.createdAt,
      writeUrl: requestLinkUrl(r.requestId),
    })),
    letters: letters.map((l) => ({
      letterId: l.letterId,
      studentName: l.studentName,
      finalizedAt: l.finalizedAt,
    })),
  });
}
