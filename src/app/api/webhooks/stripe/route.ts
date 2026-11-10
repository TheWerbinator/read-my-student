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
 * Handled events: memberships and credit purchases (metadata purpose
 *   "credits"), in src/lib/stripe-billing.ts: checkout.session.completed and
 *   checkout.session.async_payment_succeeded (one-time credits), invoice.paid
 *   (a membership year), invoice.upcoming (move to next year's price or end),
 *   customer.subscription.created/updated/deleted (mirror), charge.refunded
 *   (remove unused credits). Sending a letter to a school is free since
 *   Phase 3, so the old $5 delivery events are ignored.
 *
 * Idempotency: Stripe can send one event more than once and retries failed
 * deliveries. processStripeEventOnce() skips events already in stripe_events
 * as processed. A failure answers 500 so Stripe retries, and each grant is
 * keyed on its Stripe invoice or Checkout Session.
 *
 * IMPORTANT for Next.js App Router:
 *   We must call req.text() (not req.json()) so Stripe receives the exact raw
 *   bytes it used to compute the signature. Parsing the body as JSON first will
 *   change whitespace/key order and break signature verification.
 */

import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { processStripeEventOnce } from "@/lib/stripe-events";
import { handleBillingEvent } from "@/lib/stripe-billing";
import { createClient as createAdminClient } from "@supabase/supabase-js";

const adminSupabase = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

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
    await processStripeEventOnce(adminSupabase, event, (e) =>
      handleBillingEvent(adminSupabase, stripe, e),
    );
  } catch (err) {
    // Non-2xx makes Stripe retry the delivery later.
    console.error(`[webhook] Failed to process ${event.type} ${event.id}:`, err);
    return NextResponse.json({ error: "Processing failed." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
