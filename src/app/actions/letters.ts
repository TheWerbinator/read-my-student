"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import {
  RequestNotificationEmail,
  FacultyInvitationEmail,
} from "@/components/letter-request-email-templates";
import type { RecommenderForm } from "@/lib/faculty-profile";
import { sanitizeLetterHtml, validateLexicalJson } from "@/lib/sanitize";

const resend = new Resend(process.env.RESEND_API_KEY);

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

// ─── Types ───────────────────────────────────────────────────────────────────

export type DraftPayload = {
  recommenderForm: RecommenderForm;
  letterHtml: string;
  letterPlainText: string;
  /** Serialised Lexical editor state string */
  letterEditorState: string | null;
  /** Storage path of the logo used on this letter (may differ from profile) */
  logoStoragePath?: string | null;
  /** Storage path of the signature PNG used on this letter */
  signatureStoragePath?: string | null;
};

export type DraftRow = {
  id: string;
  recommender_snapshot: RecommenderForm | null;
  letter_body_html: string | null;
  letter_plain_text: string | null;
  /** Lexical state re-serialised back to string for the editor */
  letter_editor_state: string | null;
  letterhead_logo_storage_path: string | null;
  signature_image_storage_path: string | null;
};

// ─── Actions ─────────────────────────────────────────────────────────────────

/**
 * Upsert a draft letter for a given request.
 * Requires a UNIQUE constraint on letters(request_id) — add it if missing:
 *   ALTER TABLE letters ADD CONSTRAINT letters_request_id_unique UNIQUE (request_id);
 *
 * Also requires these columns (run migration if not present):
 *   ALTER TABLE letters
 *     ADD COLUMN IF NOT EXISTS recommender_snapshot         jsonb,
 *     ADD COLUMN IF NOT EXISTS letterhead_logo_storage_path text,
 *     ADD COLUMN IF NOT EXISTS signature_image_storage_path text,
 *     ADD COLUMN IF NOT EXISTS letter_plain_text            text;
 */
export async function saveDraft(
  requestId: string,
  payload: DraftPayload,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated." };

  // Resolve faculty row
  const { data: facultyRow } = await supabase
    .from("faculty")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (!facultyRow)
    return { success: false, error: "Faculty record not found." };

  // Resolve request (gives us student_id + ownership check via RLS)
  const { data: requestRow } = await supabase
    .from("letter_requests")
    .select("student_id")
    .eq("id", requestId)
    .single();
  if (!requestRow) return { success: false, error: "Request not found." };

  // Parse and validate the Lexical editor state string → jsonb
  let editorJson: object | null = null;
  if (payload.letterEditorState) {
    try {
      const parsed = JSON.parse(payload.letterEditorState) as unknown;
      if (validateLexicalJson(parsed)) {
        editorJson = parsed;
      } else {
        return { success: false, error: "Invalid editor state structure." };
      }
    } catch {
      // not valid JSON — store null rather than crashing
    }
  }

  // Sanitize the HTML produced by $generateHtmlFromNodes
  const safeHtml = payload.letterHtml
    ? sanitizeLetterHtml(payload.letterHtml)
    : null;

  const { error } = await supabase.from("letters").upsert(
    {
      request_id: requestId,
      faculty_id: facultyRow.id,
      student_id: requestRow.student_id,
      is_draft: true,
      status: "draft",
      recommender_snapshot: payload.recommenderForm,
      letter_body_html: safeHtml,
      letter_plain_text: payload.letterPlainText || null,
      letter_body_json: editorJson,
      letterhead_logo_storage_path: payload.logoStoragePath ?? null,
      signature_image_storage_path: payload.signatureStoragePath ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "request_id" },
  );

  if (error) return { success: false, error: error.message };
  return { success: true };
}

/**
 * Load an existing draft for a request.
 * Returns null if no draft exists or the user is not authenticated.
 */
export async function loadDraft(requestId: string): Promise<DraftRow | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("letters")
    .select(
      "id, recommender_snapshot, letter_body_html, letter_plain_text, letter_body_json, letterhead_logo_storage_path, signature_image_storage_path",
    )
    .eq("request_id", requestId)
    .eq("is_draft", true)
    .maybeSingle();

  if (error || !data) return null;

  // Re-serialise jsonb → string so the Lexical editor can consume it
  const editorState =
    data.letter_body_json != null
      ? JSON.stringify(data.letter_body_json)
      : null;

  return {
    id: data.id as string,
    recommender_snapshot: data.recommender_snapshot as RecommenderForm | null,
    letter_body_html: data.letter_body_html as string | null,
    letter_plain_text: data.letter_plain_text as string | null,
    letter_editor_state: editorState,
    letterhead_logo_storage_path: data.letterhead_logo_storage_path as
      | string
      | null,
    signature_image_storage_path: data.signature_image_storage_path as
      | string
      | null,
  };
}

// ─── Send Letter Request ─────────────────────────────────────────────────────

export type SendRequestPayload = {
  professorEmail: string;
  courseContext?: string;
  studentNote?: string;
};

export type SendRequestResult =
  | { status: "requested"; requestId: string }
  | { status: "invited" }
  | { status: "error"; error: string };

/**
 * Creates a letter request and sends the appropriate email:
 * - If the professor email matches a faculty row in the DB, creates a
 *   letter_request and sends a "new request" notification.
 * - If the professor is not registered, sends a persuasive invitation email.
 */
export async function sendLetterRequest(
  payload: SendRequestPayload,
): Promise<SendRequestResult> {
  const supabase = await createClient();

  // ── Authenticate student ──────────────────────────────────────────────────
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "error", error: "Not authenticated." };

  const studentFullName =
    [user.user_metadata?.firstName, user.user_metadata?.lastName]
      .filter(Boolean)
      .join(" ") || "A student";

  // Get student row for university info
  const { data: studentRow } = await supabase
    .from("students")
    .select("id, university")
    .eq("user_id", user.id)
    .maybeSingle();

  const studentUniversity = studentRow?.university || "their university";
  const studentId = studentRow?.id ?? null;

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://readmystudent.com";

  // ── Look up professor in faculty table ────────────────────────────────────
  const { data: facultyRow } = await supabaseAdmin
    .from("faculty")
    .select("id, first_name, email")
    .ilike("email", payload.professorEmail.trim())
    .maybeSingle();

  // ── Case A: Professor is a registered faculty member ─────────────────────
  if (facultyRow) {
    if (!studentId) {
      return {
        status: "error",
        error:
          "Your student profile is incomplete. Please sign out and sign back up to finish setting up your account, or contact support.",
      };
    }

    const { data: requestRow, error: insertError } = await supabaseAdmin
      .from("letter_requests")
      .insert({
        student_id: studentId,
        faculty_id: facultyRow.id,
        course_context: payload.courseContext || null,
        student_note: payload.studentNote || null,
        status: "requested",
      })
      .select("id")
      .single();

    if (insertError || !requestRow) {
      return {
        status: "error",
        error: insertError?.message ?? "Failed to create request.",
      };
    }

    const { error: emailError } = await resend.emails.send({
      from: "ReadMyStudent <onboarding@resend.dev>",
      to: facultyRow.email ?? payload.professorEmail,
      subject: `${studentFullName} has requested a letter of recommendation`,
      html: RequestNotificationEmail({
        facultyFirstName: facultyRow.first_name ?? "Professor",
        studentFullName,
        studentUniversity,
        courseContext: payload.courseContext,
        studentNote: payload.studentNote,
        dashboardUrl: `${siteUrl}/dashboard`,
      }),
    });

    if (emailError) {
      // Request was created — roll it back then surface the error
      await supabaseAdmin
        .from("letter_requests")
        .delete()
        .eq("id", requestRow.id);
      return { status: "error", error: `Email failed: ${emailError.message}` };
    }

    return { status: "requested", requestId: requestRow.id as string };
  }

  // ── Case B: Professor not registered — send invitation ────────────────────
  const { error: inviteError } = await resend.emails.send({
    from: "ReadMyStudent <onboarding@resend.dev>",
    to: payload.professorEmail.trim(),
    subject: `${studentFullName} needs your recommendation — it only takes 2 minutes`,
    html: FacultyInvitationEmail({
      studentFullName,
      studentUniversity,
      courseContext: payload.courseContext,
      studentNote: payload.studentNote,
      signupUrl: `${siteUrl}/signup`,
    }),
  });

  if (inviteError) {
    return { status: "error", error: `Email failed: ${inviteError.message}` };
  }

  return { status: "invited" };
}
