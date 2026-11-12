"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import {
  RequestNotificationEmail,
  FacultyInvitationEmail,
  InstitutionDeliveryEmail,
  StudentRejectionEmail,
  RequestRejectionEmail,
  SendApprovalEmail,
} from "@/components/letter-request-email-templates";
import { randomBytes, createHash, randomUUID } from "crypto";
import { z } from "zod";
import {
  authorizeRequestAccess,
  hashToken,
  isClosedStatus,
  requestLinkToken,
  requestLinkUrl,
} from "@/lib/request-access";
import type { RecommenderForm } from "@/lib/faculty-profile";
import { sanitizeLetterHtml, validateLexicalJson } from "@/lib/sanitize";
import { ensureFreeGrants, hasFreeRequests, refundCredit, spendCredit, type StudentRow } from "@/lib/credit-wallet";
import {
  listFacultyFinalizedLetters,
  listFacultyRequests,
  type FacultyFinalizedLetter,
  type FacultyLetterRequest,
} from "@/lib/faculty-data";

const resend = new Resend(process.env.RESEND_API_KEY);

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
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
  student_preview_enabled: boolean;
};

export type StudentLetterPreview = {
  html: string | null;
  recommenderSnapshot: RecommenderForm | null;
  logoSignedUrl: string | null;
  signatureSignedUrl: string | null;
  finalizedAt: string | null;
};

// ─── Actions ─────────────────────────────────────────────────────────────────

/**
 * Upsert a draft letter for a given request (one letter per request).
 * Access is by faculty session, or by the emailed link token.
 * The first save marks the request as answered (stops the reminder and expiry).
 */
export async function saveDraft(
  requestId: string,
  payload: DraftPayload,
  token?: string,
): Promise<{ success: boolean; letterId?: string; error?: string }> {
  const access = await authorizeRequestAccess(requestId, token);
  if (!access)
    return { success: false, error: "Request not found or access denied." };
  if (isClosedStatus(access.status))
    return { success: false, error: "This request is closed." };

  const { data: existing } = await supabaseAdmin
    .from("letters")
    .select("is_draft")
    .eq("request_id", requestId)
    .maybeSingle();
  if (existing && !existing.is_draft)
    return { success: false, error: "This letter has already been finalized." };

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

  const { data: upserted, error } = await supabaseAdmin
    .from("letters")
    .upsert(
      {
        request_id: requestId,
        faculty_id: access.facultyId,
        student_id: access.studentId,
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
    )
    .select("id")
    .single();

  if (error) return { success: false, error: error.message };

  if (!access.respondedAt) {
    await supabaseAdmin
      .from("letter_requests")
      .update({ responded_at: new Date().toISOString() })
      .eq("id", requestId)
      .is("responded_at", null);
  }

  return { success: true, letterId: upserted.id as string };
}

/**
 * Load an existing draft for a request.
 * Returns null if no draft exists or access is denied.
 */
export async function loadDraft(
  requestId: string,
  token?: string,
): Promise<DraftRow | null> {
  const access = await authorizeRequestAccess(requestId, token);
  if (!access) return null;

  const { data, error } = await supabaseAdmin
    .from("letters")
    .select(
      "id, recommender_snapshot, letter_body_html, letter_plain_text, letter_body_json, letterhead_logo_storage_path, signature_image_storage_path, student_preview_enabled",
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
    student_preview_enabled: (data.student_preview_enabled as boolean) ?? false,
  };
}

/**
 * Seals a draft letter: sets is_draft = false, status = 'finalized', and
 * finalized_at = now(). Also advances letter_requests.status to 'in_progress'
 * so the student knows the letter is ready for delivery.
 *
 * Returns an error if the letter is already finalized or doesn't belong to the
 * calling faculty member.
 */
export async function finalizeLetter(
  requestId: string,
): Promise<{ success: boolean; letterId?: string; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated." };

  const { data: facultyRow } = await supabaseAdmin
    .from("faculty")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!facultyRow)
    return { success: false, error: "Faculty record not found." };

  const { data: letter } = await supabaseAdmin
    .from("letters")
    .select("id, is_draft")
    .eq("request_id", requestId)
    .eq("faculty_id", facultyRow.id)
    .maybeSingle();

  if (!letter)
    return { success: false, error: "Letter not found or access denied." };
  if (!letter.is_draft)
    return { success: false, error: "This letter has already been finalized." };

  const now = new Date().toISOString();

  const { error: updateError } = await supabaseAdmin
    .from("letters")
    .update({ is_draft: false, status: "final", finalized_at: now })
    .eq("id", letter.id);

  if (updateError) return { success: false, error: updateError.message };

  // Advance request status so the student can send the letter to schools.
  await supabaseAdmin
    .from("letter_requests")
    .update({ status: "in_progress" })
    .eq("id", requestId);

  return { success: true, letterId: letter.id as string };
}

// ─── Send Letter Request ─────────────────────────────────────────────────────

export type SendRequestPayload = {
  professorEmail: string;
  courseContext?: string;
  studentNote?: string;
};

export type SendRequestResult =
  | { status: "requested"; requestId: string }
  | { status: "error"; error: string };

/**
 * Creates a letter request and emails the professor a link to answer it.
 * The link (/r/<token>) works without an account. A professor who has no
 * account gets a faculty row keyed by email, which signup later attaches to.
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

  const professorEmail = payload.professorEmail.trim().toLowerCase();
  if (professorEmail === user.email?.toLowerCase()) {
    return {
      status: "error",
      error: "You cannot request a letter from your own email address.",
    };
  }

  const studentFullName =
    [user.user_metadata?.firstName, user.user_metadata?.lastName]
      .filter(Boolean)
      .join(" ") || "A student";

  // Get student row for university info (use admin client to bypass any RLS gaps)
  const { data: studentRow } = await supabaseAdmin
    .from("students")
    .select("id, university, stage, study_year, year_started_on, free_requests_until")
    .eq("user_id", user.id)
    .maybeSingle();

  const studentUniversity = studentRow?.university || "their university";
  const studentId = studentRow?.id ?? null;
  if (!studentId) {
    return {
      status: "error",
      error: "Your student profile could not be found. Please contact support.",
    };
  }
  if (!studentRow?.stage) {
    return {
      status: "error",
      error: "Requests need your year in school, which is not set on your account. Contact support.",
    };
  }
  // A student who just started a new year gets that year's free credits before spending.
  await ensureFreeGrants(supabaseAdmin, studentRow as StudentRow, new Date());

  // ── Look up a registered professor via auth.users ────────────────────────
  // Registered faculty rows have no email or name columns; those live in
  // auth.users. Find the auth user by email, then their faculty row by user_id.
  type FacultyLookup = {
    id: string;
    first_name: string | null;
    email: string | null;
  };
  let facultyRow: FacultyLookup | null = null;

  const { data: authUserList } = await supabaseAdmin.auth.admin.listUsers({
    perPage: 1000,
  });
  const matchedAuthUser = authUserList?.users?.find(
    (u) => u.email?.toLowerCase() === professorEmail,
  );
  if (matchedAuthUser) {
    const { data: facultyByUserId } = await supabaseAdmin
      .from("faculty")
      .select("id")
      .eq("user_id", matchedAuthUser.id)
      .maybeSingle();
    if (facultyByUserId) {
      facultyRow = {
        id: facultyByUserId.id as string,
        first_name:
          (matchedAuthUser.user_metadata?.firstName as string | null) ?? null,
        email: matchedAuthUser.email ?? null,
      };
    }
  }

  // ── Professor without an account: reuse or create their faculty row ──────
  const facultyId = facultyRow?.id ?? (await facultyIdForEmail(professorEmail));
  if (!facultyId) {
    return { status: "error", error: "Failed to create request." };
  }

  // The id is chosen here so the link token (derived from it) goes in the same insert.
  const requestId = randomUUID();
  const { error: insertError } = await supabaseAdmin
    .from("letter_requests")
    .insert({
      id: requestId,
      student_id: studentId,
      faculty_id: facultyId,
      professor_email: professorEmail,
      course_context: payload.courseContext || null,
      student_note: payload.studentNote || null,
      status: "requested",
      access_token_hash: hashToken(requestLinkToken(requestId)),
    });
  if (insertError) {
    return { status: "error", error: insertError.message };
  }

  // One credit per request, spent before the email goes out (plan Phase 1).
  // consume_credit needs the request row, so the spend comes after the insert.
  let spent: "consumed" | "already" | "no_credits" | "failed" | "free";
  try {
    // A faculty dependent spends nothing. Refunds then find no consume row and do nothing.
    spent = hasFreeRequests(studentRow as StudentRow, new Date())
      ? "free"
      : await spendCredit(supabaseAdmin, studentId, requestId, new Date());
  } catch (e) {
    console.error("[sendLetterRequest] spend failed:", requestId, e);
    spent = "failed";
  }
  if (spent === "no_credits" || spent === "failed") {
    // A spend that threw may still have written its consume row.
    if (spent === "failed") await refundCredit(supabaseAdmin, requestId);
    await supabaseAdmin.from("letter_requests").delete().eq("id", requestId);
    return {
      status: "error",
      error:
        spent === "no_credits"
          ? "You have no credits left. Buy credits to send a request."
          : "The request could not be sent. Try again.",
    };
  }

  const requestUrl = requestLinkUrl(requestId);
  const { error: emailError } = await resend.emails.send({
    from: "ReadMyStudent <notification@readmystudent.com>",
    to: professorEmail,
    subject: `${studentFullName} asked you for a letter of recommendation`,
    html: facultyRow
      ? RequestNotificationEmail({
          facultyFirstName: facultyRow.first_name ?? "Professor",
          studentFullName,
          studentUniversity,
          courseContext: payload.courseContext,
          studentNote: payload.studentNote,
          requestUrl,
        })
      : FacultyInvitationEmail({
          studentFullName,
          studentUniversity,
          courseContext: payload.courseContext,
          studentNote: payload.studentNote,
          requestUrl,
        }),
  });

  if (emailError) {
    // The professor never got the link, so the request must not exist.
    // Refund first: the delete clears request_id on the ledger rows.
    await refundCredit(supabaseAdmin, requestId);
    await supabaseAdmin.from("letter_requests").delete().eq("id", requestId);
    return { status: "error", error: `Email failed: ${emailError.message}` };
  }

  return { status: "requested", requestId };
}

/** Faculty row for a professor without an account, created on first request. */
async function facultyIdForEmail(email: string): Promise<string | null> {
  const find = () =>
    supabaseAdmin
      .from("faculty")
      .select("id")
      .is("user_id", null)
      .eq("email", email)
      .maybeSingle();

  const { data: existing } = await find();
  if (existing) return existing.id as string;

  const { data: created, error } = await supabaseAdmin
    .from("faculty")
    .insert({ email })
    .select("id")
    .single();
  if (created) return created.id as string;

  // Two requests to the same new professor at once: the unique index lets one insert win.
  if (error?.code === "23505") {
    const { data: winner } = await find();
    return (winner?.id as string | undefined) ?? null;
  }
  return null;
}

// ─── Student dashboard queries ────────────────────────────────────────────────

export type FinishedLetter = {
  letterId: string;
  requestId: string;
  facultyName: string;
  finalizedAt: string;
  studentPreviewEnabled: boolean;
  /** Schools that were issued a link (the professor approved the delivery). */
  sentCount: number;
};

export type PendingRequest = {
  requestId: string;
  facultyEmail: string;
  createdAt: string;
  status: string;
  /** The professor opened the emailed link (client-side, so scanners do not count). */
  openedAt: string | null;
  /** The day-3 reminder went out. */
  reminderSentAt: string | null;
  /** The professor saved a first draft. */
  respondedAt: string | null;
};

/**
 * Returns finalized (non-draft) letters that belong to the current student.
 */
export async function getFinishedLetters(): Promise<FinishedLetter[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: studentRow } = await supabase
    .from("students")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!studentRow) return [];

  const { data, error } = await supabase
    .from("letters")
    .select(
      "id, request_id, finalized_at, student_preview_enabled, recommender_snapshot",
    )
    .eq("student_id", studentRow.id)
    .eq("is_draft", false)
    .order("finalized_at", { ascending: false });

  if (error || !data) return [];

  // Students have no RLS read on delivery_links; these letter ids are already
  // scoped to this student by the query above.
  const sent = new Map<string, number>();
  if (data.length) {
    const { data: links } = await supabaseAdmin
      .from("delivery_links")
      .select("letter_id")
      .in("letter_id", data.map((r) => r.id as string))
      .not("expires_at", "is", null);
    for (const l of links ?? []) {
      const id = l.letter_id as string;
      sent.set(id, (sent.get(id) ?? 0) + 1);
    }
  }

  return data.map((row) => {
    const snapshot = row.recommender_snapshot as {
      firstName?: string;
      lastName?: string;
    } | null;
    const facultyName =
      [snapshot?.firstName, snapshot?.lastName].filter(Boolean).join(" ") ||
      "Professor";
    return {
      letterId: row.id as string,
      requestId: row.request_id as string,
      facultyName,
      finalizedAt: row.finalized_at as string,
      studentPreviewEnabled: (row.student_preview_enabled as boolean) ?? false,
      sentCount: sent.get(row.id as string) ?? 0,
    };
  });
}

/**
 * Returns letter requests that are still pending (no finalized letter yet).
 */
export async function getPendingRequests(): Promise<PendingRequest[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: studentRow } = await supabase
    .from("students")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!studentRow) return [];

  const { data, error } = await supabase
    .from("letter_requests")
    .select("id, status, created_at, professor_email, opened_at, reminder_sent_at, responded_at")
    .eq("student_id", studentRow.id)
    .in("status", ["requested", "in_progress", "invited", "rejected", "expired"])
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data.map((row) => ({
    requestId: row.id as string,
    facultyEmail: (row.professor_email as string | null) ?? "Unknown",
    createdAt: row.created_at as string,
    status: row.status as string,
    openedAt: (row.opened_at as string | null) ?? null,
    reminderSentAt: (row.reminder_sent_at as string | null) ?? null,
    respondedAt: (row.responded_at as string | null) ?? null,
  }));
}

// ─── Faculty delivery-approval queries ────────────────────────────────────────

export type PendingDelivery = {
  deliveryLinkId: string;
  letterId: string;
  studentFullName: string;
  schoolName: string;
  /** Shown so the professor can spot an address that is not the school's. */
  schoolEmail: string | null;
  requestedAt: string;
};

/**
 * Records the first time the professor opens the emailed link, for the
 * student's Opened stop. Called from the page's client code, not on GET,
 * so email link scanners do not count as an open. Set once.
 */
export async function markRequestOpened(token: string): Promise<void> {
  const access = await authorizeRequestAccess(null, token);
  if (!access) return;
  await supabaseAdmin
    .from("letter_requests")
    .update({ opened_at: new Date().toISOString() })
    .eq("id", access.requestId)
    .is("opened_at", null);
}

// ─── Reject letter request ───────────────────────────────────────────────────

/**
 * Faculty declines to write a recommendation for a student.
 * Returns the student's credit, sets the status to 'rejected', and emails the student.
 */
export async function rejectLetterRequest(
  requestId: string,
  reason?: string,
  token?: string,
): Promise<{ error: string | null }> {
  const access = await authorizeRequestAccess(requestId, token);
  if (!access) return { error: "Request not found or access denied." };
  if (access.status !== "requested")
    return { error: "Request is no longer in a rejectable state." };

  // Refund before closing: if the close fails, a retry finds the refund done
  // ("already"). The other order would lose the credit on a failed refund.
  const refund = await refundCredit(supabaseAdmin, requestId);

  const { error: updateError } = await supabaseAdmin
    .from("letter_requests")
    .update({ status: "rejected" })
    .eq("id", requestId);
  if (updateError) return { error: updateError.message };

  // Name for the student email: account holders from auth, link users by email.
  let facultyName = access.professorEmail ?? "Your professor";
  if (!access.viaToken) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const fmeta = user?.user_metadata ?? {};
    facultyName =
      [fmeta.firstName, fmeta.lastName].filter(Boolean).join(" ") ||
      user?.email ||
      facultyName;
  }

  // Resolve student email and name from auth
  const { data: studentRow } = await supabaseAdmin
    .from("students")
    .select("user_id")
    .eq("id", access.studentId)
    .maybeSingle();

  if (studentRow?.user_id) {
    const { data: studentAuth } = await supabaseAdmin.auth.admin.getUserById(
      studentRow.user_id as string,
    );
    const studentUser = studentAuth?.user;
    if (studentUser?.email) {
      const smeta = studentUser.user_metadata ?? {};
      const studentFirstName = (smeta.firstName as string | null) ?? "there";

      const siteUrl =
        process.env.NEXT_PUBLIC_SITE_URL ?? "https://readmystudent.com";

      await resend.emails.send({
        from: "ReadMyStudent <notification@readmystudent.com>",
        to: studentUser.email,
        subject: `${facultyName} has declined your recommendation request`,
        html: RequestRejectionEmail({
          studentFirstName,
          facultyName,
          reason: reason?.trim() || undefined,
          supportUrl: `${siteUrl}/contact`,
          creditReturned: refund !== "not_spent",
        }),
      });
    }
  }

  return { error: null };
}

// ─── Faculty incoming requests ────────────────────────────────────────────────

export type { FacultyLetterRequest, FacultyFinalizedLetter };

/**
 * Returns letter_requests rows assigned to the current faculty member that
 * still need a letter written (status = 'requested').
 */
export async function getFacultyRequests(): Promise<FacultyLetterRequest[]> {
  const facultyId = await currentFacultyId();
  return facultyId ? listFacultyRequests(supabaseAdmin, facultyId) : [];
}

// ─── Faculty finalized letters list ───────────────────────────────────────────

/**
 * Returns all finalized (non-draft) letters belonging to the current faculty.
 */
export async function getFacultyFinalizedLetters(): Promise<
  FacultyFinalizedLetter[]
> {
  const facultyId = await currentFacultyId();
  return facultyId ? listFacultyFinalizedLetters(supabaseAdmin, facultyId) : [];
}

async function currentFacultyId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: facultyRow } = await supabaseAdmin
    .from("faculty")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  return (facultyRow?.id as string | undefined) ?? null;
}

/**
 * Returns delivery_links that are awaiting faculty approval for the current
 * faculty member. Uses the admin client + explicit faculty_id guard so this
 * works regardless of the RLS policy on delivery_links.
 *
 * Required delivery_links columns (run in Supabase SQL editor if missing):
 *   ALTER TABLE delivery_links ADD COLUMN IF NOT EXISTS school_name text;
 *   ALTER TABLE delivery_links ADD COLUMN IF NOT EXISTS student_user_id uuid;
 */
export async function getPendingDeliveries(): Promise<PendingDelivery[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  // Resolve faculty row for this user
  const { data: facultyRow } = await supabaseAdmin
    .from("faculty")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!facultyRow) return [];

  // delivery_links → letters (to enforce faculty ownership)
  const { data, error } = await supabaseAdmin
    .from("delivery_links")
    .select(
      "id, letter_id, school_name, recipient_email, student_user_id, created_at, letters!inner(faculty_id)",
    )
    .eq("payment_status", "pending")
    .eq("letters.faculty_id", facultyRow.id)
    .order("created_at", { ascending: true });

  if (error || !data) return [];

  // Fetch student display names from Auth metadata in a single batch
  const results: PendingDelivery[] = [];
  for (const row of data) {
    const studentUserId = row.student_user_id as string | null;
    let studentFullName = "Student";
    if (studentUserId) {
      const { data: authUser } =
        await supabaseAdmin.auth.admin.getUserById(studentUserId);
      const meta = authUser?.user?.user_metadata ?? {};
      studentFullName =
        [meta.firstName, meta.lastName].filter(Boolean).join(" ") || "Student";
    }
    results.push({
      deliveryLinkId: row.id as string,
      letterId: row.letter_id as string,
      studentFullName,
      schoolName: (row.school_name as string | null) ?? "Unknown school",
      schoolEmail: (row.recipient_email as string | null) ?? null,
      requestedAt: row.created_at as string,
    });
  }
  return results;
}

const deliverySchema = z.object({
  schoolName: z.string().trim().min(1).max(200),
  schoolEmail: z.string().trim().toLowerCase().pipe(z.email()),
});

/**
 * A student asks to send a finalized letter to a school. Free since Phase 3.
 * Nothing reaches the school until the professor approves, from the request
 * link (/r/<token>), which works with or without an account.
 */
export async function requestDelivery(
  letterId: string,
  input: { schoolName: string; schoolEmail: string },
): Promise<{ error: string | null }> {
  const parsed = deliverySchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Enter the school's name and its full admissions email address." };
  }
  const { schoolName, schoolEmail } = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { data: student } = await supabaseAdmin
    .from("students")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  const { data: letter } = student
    ? await supabaseAdmin
        .from("letters")
        .select("id, is_draft, request_id, faculty_id")
        .eq("id", letterId)
        .eq("student_id", student.id)
        .maybeSingle()
    : { data: null };
  if (!letter) return { error: "Letter not found." };
  if (letter.is_draft) return { error: "This letter is not finalized yet." };

  const emailHash = createHash("sha256").update(schoolEmail).digest("hex");
  const { count } = await supabaseAdmin
    .from("delivery_links")
    .select("id", { count: "exact", head: true })
    .eq("letter_id", letterId)
    .eq("recipient_email_hash", emailHash)
    .in("payment_status", ["pending", "paid", "used"]);
  if (count) {
    return { error: "This letter is already sent, or waiting for approval, for that address." };
  }

  const { data: request } = await supabaseAdmin
    .from("letter_requests")
    .select("id, professor_email")
    .eq("id", letter.request_id as string)
    .maybeSingle();
  if (!request?.professor_email) {
    return { error: "We could not find your professor's email for this letter. Contact support." };
  }

  // Professors with an account have a first name; link-only professors do not.
  let facultyFirstName = "Professor";
  const { data: faculty } = await supabaseAdmin
    .from("faculty")
    .select("user_id")
    .eq("id", letter.faculty_id as string)
    .maybeSingle();
  if (faculty?.user_id) {
    const { data } = await supabaseAdmin.auth.admin.getUserById(faculty.user_id as string);
    facultyFirstName = (data.user?.user_metadata?.firstName as string | undefined) ?? facultyFirstName;
  }

  const { data: link, error: insertError } = await supabaseAdmin
    .from("delivery_links")
    .insert({
      letter_id: letterId,
      recipient_email_hash: emailHash,
      // Kept only until the professor answers (owner, 2026-11-09).
      recipient_email: schoolEmail,
      school_name: schoolName,
      student_user_id: user.id,
      payment_status: "pending",
    })
    .select("id")
    .single();
  if (insertError) return { error: insertError.message };

  const studentFullName =
    [user.user_metadata?.firstName, user.user_metadata?.lastName].filter(Boolean).join(" ") ||
    "Your student";
  const { error: emailError } = await resend.emails.send({
    from: "ReadMyStudent <notification@readmystudent.com>",
    to: request.professor_email as string,
    subject: `Action required: approve delivery of your letter for ${studentFullName}`,
    html: SendApprovalEmail({
      facultyFirstName,
      studentFullName,
      schoolName,
      schoolEmail,
      reviewUrl: requestLinkUrl(request.id as string),
    }),
  });
  if (emailError) {
    // The professor never heard about it, so the delivery must not exist.
    await supabaseAdmin.from("delivery_links").delete().eq("id", link.id);
    return { error: `Email failed: ${emailError.message}` };
  }
  return { error: null };
}

type DeliveryRow = {
  id: string;
  payment_status: string;
  school_name: string | null;
  recipient_email: string | null;
  student_user_id: string | null;
};

/**
 * A delivery the caller may approve or decline: the letter's professor by
 * session, or anyone holding the request link (professors without an account).
 * Also returns the professor's name for the student's email.
 */
async function deliveryForProfessor(
  deliveryLinkId: string,
  token?: string,
): Promise<{ link: DeliveryRow; professorName: string } | null> {
  let query = supabaseAdmin
    .from("delivery_links")
    .select(
      "id, payment_status, school_name, recipient_email, student_user_id, letters!inner(faculty_id, request_id)",
    )
    .eq("id", deliveryLinkId);

  let professorName: string;
  if (token) {
    const access = await authorizeRequestAccess(null, token);
    if (!access) return null;
    query = query.eq("letters.request_id", access.requestId);
    professorName = access.professorEmail ?? "Your professor";
  } else {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;
    const { data: facultyRow } = await supabaseAdmin
      .from("faculty")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!facultyRow) return null;
    query = query.eq("letters.faculty_id", facultyRow.id);
    const m = user.user_metadata ?? {};
    professorName =
      [m.firstName, m.lastName].filter(Boolean).join(" ") || user.email || "Your professor";
  }

  const { data: link } = await query.maybeSingle();
  return link ? { link: link as unknown as DeliveryRow, professorName } : null;
}

/**
 * The professor approves a pending delivery: the school gets a view link that
 * expires 48 hours from now, and the stored school address is cleared.
 */
export async function approveDelivery(
  deliveryLinkId: string,
  token?: string,
): Promise<{ error: string | null }> {
  const found = await deliveryForProfessor(deliveryLinkId, token);
  if (!found) return { error: "Delivery not found or access denied." };
  const fullLink = found.link;
  if (fullLink.payment_status !== "pending")
    return { error: "This delivery is not awaiting approval." };
  if (!fullLink.recipient_email) {
    // Deliveries paid for before Phase 3 kept the address in Stripe only.
    return { error: "This delivery has no school address. Ask the student to send it again." };
  }

  // Generate the delivery token now: this is the moment the link becomes live.
  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

  // The status filter makes the claim atomic, so two approvals cannot both send.
  const { data: claimed, error: updateError } = await supabaseAdmin
    .from("delivery_links")
    .update({
      payment_status: "paid",
      expires_at: expiresAt,
      token_hash: tokenHash,
    })
    .eq("id", deliveryLinkId)
    .eq("payment_status", "pending")
    .select("id");

  if (updateError) return { error: updateError.message };
  if (!claimed?.length) return { error: "This delivery is not awaiting approval." };

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://readmystudent.com";
  const viewUrl = `${siteUrl}/view/${rawToken}`;

  // Look up student name for the email subject line.
  let studentFullName = "Applicant";
  if (fullLink.student_user_id) {
    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(
      fullLink.student_user_id,
    );
    const meta = authUser?.user?.user_metadata ?? {};
    studentFullName =
      [meta.firstName, meta.lastName].filter(Boolean).join(" ") || "Applicant";
  }

  const { error: emailError } = await resend.emails.send({
    from: "ReadMyStudent <notification@readmystudent.com>",
    to: fullLink.recipient_email,
    subject: `Recommendation letter available for ${studentFullName}`,
    html: InstitutionDeliveryEmail({
      schoolName: fullLink.school_name ?? "your institution",
      studentFullName,
      viewUrl,
      expiresAt,
    }),
  });
  if (emailError) {
    console.error("[approveDelivery] Resend failed:", emailError);
    // Put it back, so the professor can try again.
    await supabaseAdmin
      .from("delivery_links")
      .update({ payment_status: "pending", expires_at: null, token_hash: null })
      .eq("id", deliveryLinkId);
    return { error: `The school email could not be sent: ${emailError.message}. Try again.` };
  }

  // The school has its link, so the address is no longer needed (owner, 2026-11-09).
  await supabaseAdmin
    .from("delivery_links")
    .update({ recipient_email: null })
    .eq("id", deliveryLinkId);

  return { error: null };
}

/**
 * The professor declines a pending delivery. The school gets nothing, the
 * stored address is cleared, and the student is told.
 */
export async function rejectDelivery(
  deliveryLinkId: string,
  token?: string,
): Promise<{ error: string | null }> {
  const found = await deliveryForProfessor(deliveryLinkId, token);
  if (!found) return { error: "Delivery not found or access denied." };
  if (found.link.payment_status !== "pending")
    return { error: "This delivery is not awaiting approval." };

  const { data: claimed, error: updateError } = await supabaseAdmin
    .from("delivery_links")
    .update({ payment_status: "rejected", recipient_email: null })
    .eq("id", deliveryLinkId)
    .eq("payment_status", "pending")
    .select("id");

  if (updateError) return { error: updateError.message };
  if (!claimed?.length) return { error: "This delivery is not awaiting approval." };

  // Email the student to let them know the delivery was rejected.
  const rejLink = found.link;

  if (rejLink.student_user_id) {
    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(
      rejLink.student_user_id,
    );
    const studentEmail = authUser?.user?.email;
    const meta = authUser?.user?.user_metadata ?? {};
    const studentFirstName = (meta.firstName as string | undefined) ?? "there";
    const facultyName = found.professorName;

    if (studentEmail) {
      const siteUrl =
        process.env.NEXT_PUBLIC_SITE_URL ?? "https://readmystudent.com";
      await resend.emails.send({
        from: "ReadMyStudent <notification@readmystudent.com>",
        to: studentEmail,
        subject: `Your delivery request to ${rejLink.school_name ?? "the institution"} was declined`,
        html: StudentRejectionEmail({
          studentFirstName,
          facultyName,
          schoolName: rejLink.school_name ?? "the institution",
          supportUrl: `${siteUrl}/contact`,
        }),
      });
    }
  }

  return { error: null };
}

// ─── Student preview toggle (faculty action) ──────────────────────────────────

/**
 * Faculty toggles whether the student can see a watermarked preview of their
 * finalized (or draft) letter in the student dashboard.
 */
export async function setStudentPreviewEnabled(
  letterId: string,
  enabled: boolean,
  token?: string,
): Promise<{ error: string | null }> {
  const { data: letter } = await supabaseAdmin
    .from("letters")
    .select("request_id, faculty_id")
    .eq("id", letterId)
    .maybeSingle();
  if (!letter) return { error: "Letter not found." };

  const access = await authorizeRequestAccess(letter.request_id as string, token);
  if (!access || access.facultyId !== letter.faculty_id)
    return { error: "Letter not found or access denied." };

  const { error } = await supabaseAdmin
    .from("letters")
    .update({ student_preview_enabled: enabled })
    .eq("id", letterId);

  return { error: error?.message ?? null };
}

// ─── Student letter preview (student action) ──────────────────────────────────

/**
 * Returns the HTML content (and asset signed URLs) of a finalized letter for a
 * student preview. Returns null if:
 *   - the user is not authenticated
 *   - the letter does not belong to the student
 *   - the letter is still a draft
 *   - student_preview_enabled is false
 */
export async function getStudentLetterPreview(
  letterId: string,
): Promise<StudentLetterPreview | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: studentRow } = await supabase
    .from("students")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!studentRow) return null;

  const { data: letter } = await supabaseAdmin
    .from("letters")
    .select(
      "student_id, is_draft, student_preview_enabled, letter_body_html, recommender_snapshot, letterhead_logo_storage_path, signature_image_storage_path, finalized_at",
    )
    .eq("id", letterId)
    .maybeSingle();

  if (!letter) return null;
  if ((letter.student_id as string) !== studentRow.id) return null;
  if (letter.is_draft === true) return null;
  if (!letter.student_preview_enabled) return null;

  // Signature and logo assets are intentionally withheld from student previews
  // to protect the professor's signature from being extracted.
  return {
    html: letter.letter_body_html as string | null,
    recommenderSnapshot: letter.recommender_snapshot as RecommenderForm | null,
    logoSignedUrl: null,
    signatureSignedUrl: null,
    finalizedAt: letter.finalized_at as string | null,
  };
}
