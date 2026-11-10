/**
 * POST /api/webhooks/stripe
 *
 * Receives signed events from Stripe. This is the ONLY place where
 * fulfillment logic runs — never trust the success redirect URL alone.
 *
 * Security: every request is verified with stripe.webhooks.constructEvent()
 * using the webhook signing secret (STRIPE_WEBHOOK_SECRET). If the signature
 * is wrong or missing, we return 400 immediately without processing anything.
 *
 * Handled events:
 *   checkout.session.completed — student paid $5 delivery fee:
 *     1. SHA-256 hash recipient email — plaintext is never stored in the DB.
 *        The plaintext is retrieved from Stripe session metadata at approval time.
 *     2. NO delivery token is generated here — token is created only when faculty approves.
 *     3. Set payment_status = 'pending'.
 *     4. Email faculty asking them to APPROVE or REJECT the delivery.
 *   Memberships and credit purchases (metadata purpose "credits"), handled in
 *   src/lib/stripe-billing.ts: checkout.session.completed and
 *   checkout.session.async_payment_succeeded (one-time credits), invoice.paid
 *   (a membership year), invoice.upcoming (move to next year's price or end),
 *   customer.subscription.created/updated/deleted (mirror), charge.refunded
 *   (remove unused credits).
 *
 * Idempotency: Stripe can send one event more than once and retries failed
 * deliveries. processStripeEventOnce() skips events already in stripe_events
 * as processed. A failure answers 500 so Stripe retries, and every step below
 * is safe to repeat: the delivery link is keyed on the checkout session, the
 * payment event on the Stripe event id, and the email on a Resend idempotency key.
 * Bad metadata or a missing letter answers 200, because a retry cannot fix it.
 *
 * Required delivery_links columns (run once in Supabase SQL editor if missing):
 *   ALTER TABLE delivery_links ADD COLUMN IF NOT EXISTS school_name text;
 *   ALTER TABLE delivery_links ADD COLUMN IF NOT EXISTS student_user_id uuid;
 *
 * IMPORTANT for Next.js App Router:
 *   We must call req.text() (not req.json()) so Stripe receives the exact raw
 *   bytes it used to compute the signature. Parsing the body as JSON first will
 *   change whitespace/key order and break signature verification.
 */

import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { processStripeEventOnce } from "@/lib/stripe-events";
import { handleBillingEvent } from "@/lib/stripe-billing";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { SendApprovalEmail } from "@/components/letter-request-email-templates";

const adminSupabase = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const resend = new Resend(process.env.RESEND_API_KEY);

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // ── 1. Read raw body ────────────────────────────────────────────────────────
  // Must be text, not JSON — Stripe validates the exact byte sequence.
  const rawBody = await req.text();

  // ── 2. Verify Stripe signature ──────────────────────────────────────────────
  const sig = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return NextResponse.json(
      { error: "Missing signature or webhook secret." },
      { status: 400 },
    );
  }

  let event: Stripe.Event;
  try {
    // constructEvent throws if the signature doesn't match
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[webhook] Signature verification failed:", message);
    return NextResponse.json(
      { error: `Signature verification failed: ${message}` },
      { status: 400 },
    );
  }

  // ── 3. Route by event type, once per event id ───────────────────────────────
  try {
    await processStripeEventOnce(adminSupabase, event, async (e) => {
      if (e.type === "checkout.session.completed" && e.data.object.metadata?.letter_id) {
        await handleCheckoutCompleted(e); // the $5 school delivery, removed in Phase 3
      } else {
        await handleBillingEvent(adminSupabase, stripe, e);
      }
    });
  } catch (err) {
    // Non-2xx makes Stripe retry the delivery later.
    console.error(`[webhook] Failed to process ${event.type} ${event.id}:`, err);
    return NextResponse.json({ error: "Processing failed." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

// ─── Fulfillment ──────────────────────────────────────────────────────────────

async function handleCheckoutCompleted(event: Stripe.CheckoutSessionCompletedEvent) {
  const session = event.data.object;
  const meta = session.metadata;

  if (
    !meta?.letter_id ||
    !meta?.school_name ||
    !meta?.school_email ||
    !meta?.student_user_id
  ) {
    console.error(
      "[webhook] checkout.session.completed missing metadata:",
      meta,
    );
    return;
  }

  const { letter_id, school_name, school_email } = meta;

  // ── a. Load the letter to get faculty details ─────────────────────────────
  const { data: letter, error: letterError } = await adminSupabase
    .from("letters")
    .select("id, faculty_id, student_id")
    .eq("id", letter_id)
    .maybeSingle();

  if (letterError) throw letterError;
  if (!letter) {
    console.error("[webhook] Letter not found:", letter_id);
    return;
  }

  // ── b. Load faculty contact info for the notification email ───────────────
  const { data: facultyRow, error: facultyError } = await adminSupabase
    .from("faculty")
    .select("user_id")
    .eq("id", letter.faculty_id as string)
    .maybeSingle();
  if (facultyError) throw facultyError;

  let faculty: { first_name: string | null; email: string | null } | null =
    null;
  if (facultyRow?.user_id) {
    const { data: facultyAuthUser, error: facultyAuthError } =
      await adminSupabase.auth.admin.getUserById(facultyRow.user_id as string);
    if (facultyAuthError) throw facultyAuthError;
    if (facultyAuthUser?.user) {
      faculty = {
        first_name:
          (facultyAuthUser.user.user_metadata?.firstName as string | null) ??
          null,
        email: facultyAuthUser.user.email ?? null,
      };
    }
  }

  // ── c. Load student name for the notification email ───────────────────────
  const { data: studentAuthUser, error: studentAuthError } =
    await adminSupabase.auth.admin.getUserById(meta.student_user_id);
  if (studentAuthError) throw studentAuthError;
  const studentMeta = studentAuthUser?.user?.user_metadata ?? {};
  const studentFullName =
    [studentMeta.firstName, studentMeta.lastName].filter(Boolean).join(" ") ||
    "Your student";

  // ── d. Hash the recipient email — plaintext is never stored ─────────────
  // The hash is used for email-gate verification on the /view/[token] page.
  // The plaintext is retrieved from Stripe session metadata at approval time.
  const normalizedSchoolEmail = school_email.toLowerCase().trim();
  const recipientEmailHash = createHash("sha256")
    .update(normalizedSchoolEmail)
    .digest("hex");

  // NOTE: No delivery token is generated here.
  // The token is created only when faculty approves, so we can include it in
  // the institution email at that moment.

  // ── e. Insert delivery_links row (pending approval) ──────────────────────
  // A retry after a partial failure reuses the row. An upsert would reset
  // payment_status on a link the professor already approved.
  const { data: existingLink, error: findLinkError } = await adminSupabase
    .from("delivery_links")
    .select("id")
    .eq("stripe_checkout_session_id", session.id)
    .maybeSingle();
  if (findLinkError) throw findLinkError;

  let linkId = existingLink?.id as string | undefined;
  if (!linkId) {
    const { data: linkRow, error: linkError } = await adminSupabase
      .from("delivery_links")
      .insert({
        letter_id,
        recipient_email_hash: recipientEmailHash,
        school_name,
        student_user_id: meta.student_user_id,
        payment_status: "pending",
        stripe_checkout_session_id: session.id,
      })
      .select("id")
      .single();
    if (linkError) throw linkError;
    linkId = linkRow.id as string;
  }

  // ── f. Record payment event ───────────────────────────────────────────────
  const { error: paymentEventError } = await adminSupabase
    .from("payment_events")
    .upsert(
      {
        letter_id,
        delivery_link_id: linkId,
        stripe_event_id: event.id,
        stripe_event_type: event.type,
        amount_cents: session.amount_total ?? 500,
        currency: session.currency ?? "usd",
        status: "paid",
      },
      { onConflict: "stripe_event_id", ignoreDuplicates: true },
    );
  if (paymentEventError) throw paymentEventError;

  // ── g. Email faculty: action required — approve or reject the delivery ───
  if (faculty?.email) {
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ?? "https://readmystudent.com";

    // The key stops a second email when two copies of the event arrive together.
    // Resend keeps keys for 24 hours; stripe_events covers later retries.
    const { error: emailError } = await resend.emails.send(
      {
        from: "ReadMyStudent <notification@readmystudent.com>",
        to: faculty.email,
        subject: `Action required: approve delivery of your letter for ${studentFullName}`,
        html: SendApprovalEmail({
          facultyFirstName: faculty.first_name ?? "Professor",
          studentFullName,
          schoolName: school_name,
          dashboardUrl: `${siteUrl}/dashboard`,
        }),
      },
      { idempotencyKey: `delivery-approval/${session.id}` },
    );
    if (emailError) throw new Error(`Resend: ${emailError.message}`);
  }
}
