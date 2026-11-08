/**
 * Access to one letter request, by faculty session or by the emailed link token.
 * Server-only: imports the secret key client.
 */

import { createHash, createHmac } from "crypto";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

// Built per call, so importing this module never needs the env (tests, build).
const adminClient = () =>
  createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

/**
 * The link token is derived from the request id, so the reminder job can
 * rebuild the same link. It shares PDF_SIGNING_SECRET under its own prefix
 * (like the /view cookie); rotating that secret breaks open request links.
 */
export function requestLinkToken(requestId: string): string {
  const secret = process.env.PDF_SIGNING_SECRET;
  if (!secret) throw new Error("PDF_SIGNING_SECRET is not set.");
  return createHmac("sha256", secret)
    .update(`letter-request-link:v1:${requestId}`)
    .digest("base64url");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function requestLinkUrl(requestId: string): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.readmystudent.com";
  return `${siteUrl}/r/${requestLinkToken(requestId)}`;
}

/** Declined and expired requests accept no more changes. */
export function isClosedStatus(status: string): boolean {
  return status === "rejected" || status === "expired";
}

export type RequestAccess = {
  requestId: string;
  facultyId: string;
  studentId: string;
  status: string;
  professorEmail: string | null;
  respondedAt: string | null;
  viaToken: boolean;
};

type RequestRow = {
  id: string;
  faculty_id: string | null;
  student_id: string;
  status: string;
  professor_email: string | null;
  responded_at: string | null;
};

const REQUEST_COLUMNS =
  "id, faculty_id, student_id, status, professor_email, responded_at";

function toAccess(row: RequestRow, viaToken: boolean): RequestAccess | null {
  if (!row.faculty_id) return null;
  return {
    requestId: row.id,
    facultyId: row.faculty_id,
    studentId: row.student_id,
    status: row.status,
    professorEmail: row.professor_email,
    respondedAt: row.responded_at,
    viaToken,
  };
}

/**
 * With a token: the request whose hash matches (and, if requestId is given,
 * only when it is that request). Without one: the request must belong to the
 * logged-in faculty member. Returns null when access is denied.
 */
export async function authorizeRequestAccess(
  requestId: string | null,
  token?: string | null,
): Promise<RequestAccess | null> {
  const admin = adminClient();
  if (token) {
    const { data } = await admin
      .from("letter_requests")
      .select(REQUEST_COLUMNS)
      .eq("access_token_hash", hashToken(token))
      .maybeSingle();
    if (!data || (requestId && data.id !== requestId)) return null;
    return toAccess(data as RequestRow, true);
  }

  if (!requestId) return null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: faculty } = await admin
    .from("faculty")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!faculty) return null;

  const { data } = await admin
    .from("letter_requests")
    .select(REQUEST_COLUMNS)
    .eq("id", requestId)
    .eq("faculty_id", faculty.id)
    .maybeSingle();
  return data ? toAccess(data as RequestRow, false) : null;
}
