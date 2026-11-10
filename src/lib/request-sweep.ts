/**
 * Daily sweep of letter requests the professor has not answered:
 * a reminder on day 3, and the request closes as 'expired' on day 7 and its
 * credit goes back to the student.
 * "Answered" means the professor saved a draft (responded_at) or declined.
 * Server-only: uses the secret key client. Called from /api/cron/cleanup.
 */

import { createClient as createAdminClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import {
  RequestExpiredEmail,
  RequestReminderEmail,
} from "@/components/letter-request-email-templates";
import { requestLinkUrl } from "@/lib/request-access";
import { refundCredit } from "@/lib/credit-wallet";

// shortcut: fixed day counts; move them to the admin settings screen when it exists.
export const REMINDER_AFTER_DAYS = 3;
export const EXPIRE_AFTER_DAYS = 7;

const DAY_MS = 24 * 60 * 60 * 1000;

/** Requests created at or before these instants are due. */
export function sweepCutoffs(now: Date): { remindBefore: string; expireBefore: string } {
  return {
    remindBefore: new Date(now.getTime() - REMINDER_AFTER_DAYS * DAY_MS).toISOString(),
    expireBefore: new Date(now.getTime() - EXPIRE_AFTER_DAYS * DAY_MS).toISOString(),
  };
}

const FROM = "ReadMyStudent <notification@readmystudent.com>";

export async function sweepUnansweredRequests(now = new Date()): Promise<{
  requests_expired: number;
  reminders_sent: number;
}> {
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { remindBefore, expireBefore } = sweepCutoffs(now);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.readmystudent.com";

  async function student(studentId: string) {
    const { data: row } = await admin
      .from("students")
      .select("user_id")
      .eq("id", studentId)
      .maybeSingle();
    if (!row?.user_id) return null;
    const { data } = await admin.auth.admin.getUserById(row.user_id as string);
    const meta = data.user?.user_metadata ?? {};
    return {
      email: data.user?.email ?? null,
      firstName: (meta.firstName as string | undefined) ?? "there",
      fullName:
        [meta.firstName, meta.lastName].filter(Boolean).join(" ") || "A student",
    };
  }

  // Expire first, so a request past both cutoffs gets no reminder.
  // The status filter in the update makes a second run a no-op.
  const { data: expired, error: expireErr } = await admin
    .from("letter_requests")
    .update({ status: "expired" })
    .eq("status", "requested")
    .is("responded_at", null)
    .lte("created_at", expireBefore)
    .select("id, student_id, professor_email");
  if (expireErr) console.error("[request-sweep] expire error:", expireErr);

  for (const req of expired ?? []) {
    // shortcut: a refund that fails here is only logged, and the next run will
    // not retry it (the request is no longer 'requested'). Add a catch-up query
    // for expired requests with a consume and no refund if the log shows any.
    let refund: Awaited<ReturnType<typeof refundCredit>> | "failed";
    try {
      refund = await refundCredit(admin, req.id as string);
    } catch (e) {
      console.error("[request-sweep] refund error:", req.id, e);
      refund = "failed";
    }

    const s = await student(req.student_id as string);
    if (!s?.email) continue;
    const { error } = await resend.emails.send({
      from: FROM,
      to: s.email,
      subject: "Your letter request closed without an answer",
      html: RequestExpiredEmail({
        studentFirstName: s.firstName,
        professorEmail: (req.professor_email as string | null) ?? "Your professor",
        dashboardUrl: `${siteUrl}/dashboard`,
        creditReturned: refund === "refunded" || refund === "already",
      }),
    });
    if (error) console.error("[request-sweep] expiry email error:", req.id, error);
  }

  const { data: due, error: dueErr } = await admin
    .from("letter_requests")
    .select("id, student_id, professor_email")
    .eq("status", "requested")
    .is("responded_at", null)
    .is("reminder_sent_at", null)
    .lte("created_at", remindBefore);
  if (dueErr) console.error("[request-sweep] reminder query error:", dueErr);

  let remindersSent = 0;
  for (const req of due ?? []) {
    if (!req.professor_email) continue;
    // Claim before sending, so two overlapping runs cannot both send.
    const { data: claimed } = await admin
      .from("letter_requests")
      .update({ reminder_sent_at: now.toISOString() })
      .eq("id", req.id)
      .is("reminder_sent_at", null)
      .select("id");
    if (!claimed?.length) continue;

    const s = await student(req.student_id as string);
    const { error } = await resend.emails.send({
      from: FROM,
      to: req.professor_email as string,
      subject: `Reminder: ${s?.fullName ?? "A student"} asked you for a letter of recommendation`,
      html: RequestReminderEmail({
        studentFullName: s?.fullName ?? "A student",
        requestUrl: requestLinkUrl(req.id as string),
      }),
    });
    if (error) console.error("[request-sweep] reminder email error:", req.id, error);
    else remindersSent++;
  }

  return { requests_expired: expired?.length ?? 0, reminders_sent: remindersSent };
}
