/**
 * GET /api/letters/[id]/verify
 *
 * Public integrity-verification endpoint. No authentication required — this is
 * intentionally callable by anyone (institutions, students, third-party auditors)
 * to confirm that a letter has not been tampered with after finalization.
 *
 * Steps:
 *   1. Load the finalized letter row and its letter_signatures record.
 *   2. Download the PDF from Supabase Storage.
 *   3. SHA-256 hash the downloaded bytes and compare against the stored pdf_sha256.
 *   4. Recompute HMAC-SHA256(pdf_sha256, PDF_SIGNING_SECRET) and compare against
 *      the stored signature (timing-safe comparison).
 *   5. Return a structured result with pass/fail status for each check.
 *
 * The response intentionally omits the raw signature value and the signing
 * secret — it only reports whether the checks passed.
 */

import { createHash, createHmac, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

// ─── Admin client ─────────────────────────────────────────────────────────────

const adminSupabase = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

// ─── Types ────────────────────────────────────────────────────────────────────

type VerifyResult = {
  verified: boolean;
  letterId: string;
  signedAt: string | null;
  signingKeyId: string | null;
  signatureAlg: string | null;
  checks: {
    /** Does the live PDF hash match the hash recorded at signing time? */
    pdfIntegrity: boolean;
    /** Does the recomputed HMAC match the stored signature? */
    hmacValid: boolean;
  };
  /** Human-readable summary */
  message: string;
};

// ─── Route handler ────────────────────────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: letterId } = await params;

  // ── 1. Load the finalized letter ─────────────────────────────────────────────
  const { data: letter, error: letterError } = await adminSupabase
    .from("letters")
    .select("id, is_draft, storage_path")
    .eq("id", letterId)
    .maybeSingle();

  if (letterError || !letter) {
    return NextResponse.json({ error: "Letter not found." }, { status: 404 });
  }

  if (letter.is_draft || !letter.storage_path) {
    return NextResponse.json(
      { error: "Letter has not been finalized yet." },
      { status: 409 },
    );
  }

  // ── 2. Load the signature record ─────────────────────────────────────────────
  const { data: sigRow, error: sigError } = await adminSupabase
    .from("letter_signatures")
    .select("pdf_sha256, signature, signature_alg, signed_at, signing_key_id")
    .eq("letter_id", letterId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (sigError || !sigRow) {
    return NextResponse.json(
      { error: "No signature record found for this letter." },
      { status: 404 },
    );
  }

  // ── 3. Download PDF from storage ─────────────────────────────────────────────
  const { data: fileData, error: downloadError } = await adminSupabase.storage
    .from("letters")
    .download(letter.storage_path as string);

  if (downloadError || !fileData) {
    return NextResponse.json(
      { error: "Failed to retrieve PDF from storage." },
      { status: 500 },
    );
  }

  const pdfBytes = Buffer.from(await fileData.arrayBuffer());

  // ── 4. Recompute SHA-256 of the live PDF ─────────────────────────────────────
  const liveSha256 = createHash("sha256").update(pdfBytes).digest("hex");
  const pdfIntegrity = liveSha256 === (sigRow.pdf_sha256 as string);

  // ── 5. Recompute and validate HMAC ───────────────────────────────────────────
  const signingSecret = process.env.PDF_SIGNING_SECRET ?? "";
  let hmacValid = false;

  if (signingSecret) {
    const expectedHmac = createHmac("sha256", signingSecret)
      .update(sigRow.pdf_sha256 as string)
      .digest("hex");

    // Use timing-safe comparison to prevent timing oracle attacks
    try {
      hmacValid = timingSafeEqual(
        Buffer.from(expectedHmac, "hex"),
        Buffer.from(sigRow.signature as string, "hex"),
      );
    } catch {
      // Buffers of different lengths — comparison fails safely
      hmacValid = false;
    }
  }

  // ── 6. Build response ─────────────────────────────────────────────────────────
  const verified = pdfIntegrity && hmacValid;

  const result: VerifyResult = {
    verified,
    letterId,
    signedAt: sigRow.signed_at as string | null,
    signingKeyId: sigRow.signing_key_id as string | null,
    signatureAlg: sigRow.signature_alg as string | null,
    checks: {
      pdfIntegrity,
      hmacValid,
    },
    message: verified
      ? "This letter is authentic. The PDF has not been modified since it was signed."
      : !pdfIntegrity
        ? "Integrity check failed: the PDF has been modified after signing."
        : "Signature check failed: the HMAC could not be validated.",
  };

  return NextResponse.json(result, { status: verified ? 200 : 422 });
}
