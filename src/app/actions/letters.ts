"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import {
  RequestNotificationEmail,
  FacultyInvitationEmail,
  InstitutionDeliveryEmail,
  StudentRejectionEmail,
} from "@/components/letter-request-email-templates";
import { randomBytes, createHash } from "crypto";
import { stripe } from "@/lib/stripe";
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
  // Primary: match by email stored on the faculty row (set since registration fix).
  // Fallback: some faculty registered before email was saved — look them up via
  //   auth.users by email, then join to the faculty row by user_id.
  type FacultyLookup = {
    id: string;
    first_name: string | null;
    email: string | null;
  };
  let facultyRow: FacultyLookup | null = null;

  const { data: directMatch } = await supabaseAdmin
    .from("faculty")
    .select("id, first_name, email")
    .ilike("email", payload.professorEmail.trim())
    .maybeSingle();

  if (directMatch) {
    facultyRow = directMatch as unknown as FacultyLookup;
  } else {
    // Fallback: find auth user by email, then look up faculty row by user_id
    const { data: authUserList } = await supabaseAdmin.auth.admin.listUsers({
      perPage: 1000,
    });
    const matchedAuthUser = authUserList?.users?.find(
      (u) =>
        u.email?.toLowerCase() === payload.professorEmail.trim().toLowerCase(),
    );
    if (matchedAuthUser) {
      const { data: facultyByUserId } = await supabaseAdmin
        .from("faculty")
        .select("id, first_name, email")
        .eq("user_id", matchedAuthUser.id)
        .maybeSingle();
      if (facultyByUserId) {
        facultyRow = facultyByUserId as unknown as FacultyLookup;
        // Backfill the email column so future lookups are fast
        await supabaseAdmin
          .from("faculty")
          .update({ email: matchedAuthUser.email })
          .eq("id", facultyByUserId.id);
      }
    }
  }

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
    from: "ReadMyStudent <notification@readmystudent.com>",
    to: payload.professorEmail.trim(),
    subject: `${studentFullName} needs your recommendation — it only takes 2 minutes`,
    html: FacultyInvitationEmail({
      studentFullName,
      studentUniversity,
      courseContext: payload.courseContext,
      studentNote: payload.studentNote,
      signupUrl: `${siteUrl}/signup?role=FACULTY`,
    }),
  });

  if (inviteError) {
    return { status: "error", error: `Email failed: ${inviteError.message}` };
  }

  return { status: "invited" };
}

// ─── Student dashboard queries ────────────────────────────────────────────────

export type FinishedLetter = {
  letterId: string;
  requestId: string;
  facultyName: string;
  finalizedAt: string;
};

export type PendingRequest = {
  requestId: string;
  facultyEmail: string;
  createdAt: string;
  status: string;
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
      "id, request_id, finalized_at, faculty:faculty_id(first_name, last_name)",
    )
    .eq("student_id", studentRow.id)
    .eq("is_draft", false)
    .order("finalized_at", { ascending: false });

  if (error || !data) return [];

  return data.map((row) => {
    const fRaw = row.faculty as unknown as
      | { first_name: string | null; last_name: string | null }[]
      | { first_name: string | null; last_name: string | null }
      | null;
    const f = Array.isArray(fRaw) ? (fRaw[0] ?? null) : fRaw;
    const facultyName =
      [f?.first_name, f?.last_name].filter(Boolean).join(" ") || "Professor";
    return {
      letterId: row.id as string,
      requestId: row.request_id as string,
      facultyName,
      finalizedAt: row.finalized_at as string,
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
    .select("id, status, created_at, faculty:faculty_id(email)")
    .eq("student_id", studentRow.id)
    .in("status", ["requested", "in_progress"])
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data.map((row) => {
    const fRaw = row.faculty as unknown as
      | { email: string | null }[]
      | { email: string | null }
      | null;
    const f = Array.isArray(fRaw) ? (fRaw[0] ?? null) : fRaw;
    return {
      requestId: row.id as string,
      facultyEmail: f?.email ?? "Unknown",
      createdAt: row.created_at as string,
      status: row.status as string,
    };
  });
}

// ─── Faculty delivery-approval queries ────────────────────────────────────────

export type PendingDelivery = {
  deliveryLinkId: string;
  letterId: string;
  studentFullName: string;
  schoolName: string;
  paidAt: string;
};

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
      "id, letter_id, school_name, student_user_id, created_at, letters!inner(faculty_id)",
    )
    .eq("payment_status", "pending_approval")
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
      paidAt: row.created_at as string,
    });
  }
  return results;
}

/**
 * Faculty approves a pending delivery.
 * Sets payment_status = 'paid' and starts the 48-hour expiry window NOW.
 */
export async function approveDelivery(
  deliveryLinkId: string,
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { data: facultyRow } = await supabaseAdmin
    .from("faculty")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!facultyRow) return { error: "Faculty record not found." };

  // Verify the delivery_link belongs to a letter authored by this faculty
  const { data: link } = await supabaseAdmin
    .from("delivery_links")
    .select(
      "id, payment_status, school_name, student_user_id, stripe_checkout_session_id, letters!inner(faculty_id)",
    )
    .eq("id", deliveryLinkId)
    .eq("letters.faculty_id", facultyRow.id)
    .maybeSingle();

  if (!link) return { error: "Delivery not found or access denied." };
  if ((link.payment_status as string) !== "pending_approval")
    return { error: "This delivery is not awaiting approval." };

  // Generate the delivery token now — this is the moment the link becomes live.
  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

  const { error: updateError } = await supabaseAdmin
    .from("delivery_links")
    .update({
      payment_status: "paid",
      expires_at: expiresAt,
      token_hash: tokenHash,
    })
    .eq("id", deliveryLinkId);

  if (updateError) return { error: updateError.message };

  const fullLink = link as unknown as {
    school_name: string | null;
    student_user_id: string | null;
    stripe_checkout_session_id: string | null;
  };

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

  // Retrieve the school email from Stripe session metadata — never stored in DB
  let recipientEmail: string | null = null;
  if (fullLink.stripe_checkout_session_id) {
    try {
      const session = await stripe.checkout.sessions.retrieve(
        fullLink.stripe_checkout_session_id,
      );
      recipientEmail = session.metadata?.school_email ?? null;
    } catch (err) {
      console.error(
        "[approveDelivery] Failed to retrieve Stripe session:",
        err,
      );
    }
  }

  if (recipientEmail) {
    await resend.emails.send({
      from: "ReadMyStudent <onboarding@resend.dev>",
      to: recipientEmail,
      subject: `Recommendation letter available for ${studentFullName}`,
      html: InstitutionDeliveryEmail({
        schoolName: fullLink.school_name ?? "your institution",
        studentFullName,
        viewUrl,
        expiresAt,
      }),
    });
  }

  return { error: null };
}

/**
 * Faculty rejects a pending delivery.
 * Sets payment_status = 'rejected'; student will need to request a refund.
 */
export async function rejectDelivery(
  deliveryLinkId: string,
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { data: facultyRow } = await supabaseAdmin
    .from("faculty")
    .select("id, first_name, last_name")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!facultyRow) return { error: "Faculty record not found." };

  const { data: link } = await supabaseAdmin
    .from("delivery_links")
    .select(
      "id, payment_status, school_name, student_user_id, letters!inner(faculty_id)",
    )
    .eq("id", deliveryLinkId)
    .eq("letters.faculty_id", facultyRow.id)
    .maybeSingle();

  if (!link) return { error: "Delivery not found or access denied." };
  if ((link.payment_status as string) !== "pending_approval")
    return { error: "This delivery is not awaiting approval." };

  const { error: updateError } = await supabaseAdmin
    .from("delivery_links")
    .update({ payment_status: "rejected" })
    .eq("id", deliveryLinkId);

  if (updateError) return { error: updateError.message };

  // Email the student to let them know the delivery was rejected.
  const rejLink = link as unknown as {
    school_name: string | null;
    student_user_id: string | null;
  };

  if (rejLink.student_user_id) {
    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(
      rejLink.student_user_id,
    );
    const studentEmail = authUser?.user?.email;
    const meta = authUser?.user?.user_metadata ?? {};
    const studentFirstName = (meta.firstName as string | undefined) ?? "there";
    const facultyName =
      [facultyRow.first_name, facultyRow.last_name].filter(Boolean).join(" ") ||
      "Your professor";

    if (studentEmail) {
      const siteUrl =
        process.env.NEXT_PUBLIC_SITE_URL ?? "https://readmystudent.com";
      await resend.emails.send({
        from: "ReadMyStudent <onboarding@resend.dev>",
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
