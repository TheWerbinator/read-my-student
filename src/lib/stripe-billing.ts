// Webhook handlers for memberships and credit purchases. The route runs them
// inside processStripeEventOnce(), so a processed event is never handled twice,
// and each grant is also keyed on its Stripe invoice or Checkout Session.
// Objects that carry state (subscriptions) are re-read from Stripe, because
// "Stripe doesn't guarantee the delivery of events in the order that they're
// generated" (https://docs.stripe.com/webhooks.md).

import type { SupabaseClient } from "@supabase/supabase-js";
import type Stripe from "stripe";
import { grantForPurchase, offerFromMetadata, priceFor, renewalRow } from "@/lib/billing";
import { CATALOG_COLUMNS, type CatalogRow } from "@/lib/catalog";
import { grantPurchasedCredits, removeUnusedCredits, studentYear, type StudentRow } from "@/lib/credit-wallet";

/** Metadata `purpose` on Checkout Sessions and Subscriptions created by /api/billing/checkout. */
export const BILLING_PURPOSE = "credits";

const idOf = (ref: string | { id: string } | null | undefined) =>
  typeof ref === "string" ? ref : (ref?.id ?? null);

async function loadStudent(db: SupabaseClient, studentId: string | undefined): Promise<StudentRow | null> {
  if (!studentId) return null;
  const { data, error } = await db
    .from("students")
    .select("id, stage, study_year, year_started_on")
    .eq("id", studentId)
    .maybeSingle();
  if (error) throw error;
  return data as StudentRow | null;
}

async function offerForPrice(stripe: Stripe, price: string | Stripe.Price | null | undefined) {
  const id = idOf(price);
  if (!id) return null;
  const full = typeof price === "object" && price ? price : await stripe.prices.retrieve(id);
  return offerFromMetadata(full.metadata);
}

export async function handleBillingEvent(db: SupabaseClient, stripe: Stripe, event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded":
      return grantCheckout(db, stripe, event.data.object);
    case "invoice.paid":
      return grantInvoice(db, stripe, event.data.object);
    case "invoice.upcoming":
      return prepareRenewal(db, stripe, event.data.object);
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      return mirrorSubscription(db, await stripe.subscriptions.retrieve(event.data.object.id));
    case "charge.refunded": {
      const paymentIntent = idOf(event.data.object.payment_intent);
      if (paymentIntent) await removeUnusedCredits(db, paymentIntent, `Stripe refund ${event.data.object.id}`);
      return;
    }
  }
}

/** One-time purchases (extra credits, bundles). UPI can settle after the session completes, hence the async event too. */
async function grantCheckout(db: SupabaseClient, stripe: Stripe, session: Stripe.Checkout.Session) {
  if (session.metadata?.purpose !== BILLING_PURPOSE || session.mode !== "payment") return;
  if (session.payment_status !== "paid") return;

  const student = await loadStudent(db, session.metadata.student_id);
  if (!student) {
    console.error(`[billing] Checkout ${session.id}: student ${session.metadata.student_id} not found.`);
    return;
  }
  const line = (await stripe.checkout.sessions.listLineItems(session.id, { limit: 1 })).data[0];
  const offer = await offerForPrice(stripe, line?.price);
  if (!line || !offer) throw new Error(`Checkout ${session.id}: no catalog offer on the purchased Price.`);

  const grant = grantForPurchase(offer, line.quantity ?? 1, studentYear(student), new Date());
  await grantPurchasedCredits(db, {
    studentId: student.id,
    catalogId: offer.id,
    source: offer.kind === "bundle" ? "bundle" : "credits",
    quantity: grant.quantity,
    expiresAt: grant.expiresAt,
    sourceRef: `checkout:${session.id}`,
    paymentIntent: idOf(session.payment_intent),
  });
}

/** A membership year was paid: the first year (subscription_create) or a renewal (subscription_cycle). */
async function grantInvoice(db: SupabaseClient, stripe: Stripe, invoice: Stripe.Invoice) {
  if (invoice.billing_reason !== "subscription_create" && invoice.billing_reason !== "subscription_cycle") return;
  const subscriptionId = idOf(invoice.parent?.subscription_details?.subscription);
  if (!subscriptionId || !invoice.id) return;

  const sub = await stripe.subscriptions.retrieve(subscriptionId);
  if (sub.metadata.purpose !== BILLING_PURPOSE) return;
  // "retrieve the associated subscription and confirm that its status is active
  // before extending the customer's access" (https://docs.stripe.com/billing/subscriptions/webhooks.md)
  if (sub.status !== "active") throw new Error(`Subscription ${sub.id} is ${sub.status}, not active.`);

  const student = await loadStudent(db, sub.metadata.student_id);
  if (!student) {
    console.error(`[billing] Invoice ${invoice.id}: student ${sub.metadata.student_id} not found.`);
    return;
  }
  const line = invoice.lines.data.find((l) => l.pricing?.price_details?.price);
  const offer = await offerForPrice(stripe, line?.pricing?.price_details?.price);
  if (!line || !offer) throw new Error(`Invoice ${invoice.id}: no catalog offer on the invoiced Price.`);

  const payments = await stripe.invoicePayments.list({ invoice: invoice.id, status: "paid", limit: 1 });
  const grant = grantForPurchase(offer, line.quantity ?? 1, studentYear(student), new Date());
  await grantPurchasedCredits(db, {
    studentId: student.id,
    catalogId: offer.id,
    source: "membership",
    quantity: grant.quantity,
    expiresAt: grant.expiresAt,
    sourceRef: `invoice:${invoice.id}`,
    paymentIntent: idOf(payments.data[0]?.payment.payment_intent),
  });
  await mirrorSubscription(db, sub);
}

/**
 * A few days before renewal: move the subscription to the catalog membership
 * for the student's year on the renewal date, at today's catalog price (owner,
 * 2026-11-09). With no proration, "customers are billed the full amount at the
 * new price when the next invoice is generated"
 * (https://docs.stripe.com/billing/subscriptions/prorations.md). After the last
 * membership year (UG Year 5, Master's Year 2), it keeps renewing at that year's
 * price (owner, 2026-11-10). A stage with no membership for the year ends the
 * subscription.
 */
async function prepareRenewal(db: SupabaseClient, stripe: Stripe, invoice: Stripe.Invoice) {
  const subscriptionId = idOf(invoice.parent?.subscription_details?.subscription);
  if (!subscriptionId) return;
  const sub = await stripe.subscriptions.retrieve(subscriptionId);
  if (sub.metadata.purpose !== BILLING_PURPOSE || sub.status === "canceled") return;

  const student = await loadStudent(db, sub.metadata.student_id);
  const item = sub.items.data[0];
  if (!student?.stage || !item) return;

  const { data: rows, error } = await db
    .from("plan_catalog")
    .select(CATALOG_COLUMNS)
    .eq("kind", "membership")
    .eq("stage", student.stage);
  if (error) throw error;

  const target = renewalRow((rows ?? []) as CatalogRow[], studentYear(student), new Date(item.current_period_end * 1000));
  if (!target) {
    if (!sub.cancel_at_period_end) await stripe.subscriptions.update(sub.id, { cancel_at_period_end: true });
    return;
  }

  const priceId = priceFor(target, sub.currency === "inr" ? "inr" : "usd");
  if (!priceId) {
    // An INR subscription cannot switch currency, so it renews at its current Price until an admin sets one.
    console.error(`[billing] Renewal of ${sub.id}: catalog row ${target.id} has no ${sub.currency} Price.`);
    return;
  }
  if (item.price.id === priceId) return;

  await stripe.subscriptions.update(sub.id, {
    items: [{ id: item.id, price: priceId }],
    proration_behavior: "none",
    metadata: { ...sub.metadata, catalog_id: target.id },
  });
}

async function mirrorSubscription(db: SupabaseClient, sub: Stripe.Subscription) {
  if (sub.metadata.purpose !== BILLING_PURPOSE) return;
  const { student_id, renewal_consent_at, catalog_id } = sub.metadata;
  if (!student_id || !renewal_consent_at) {
    console.error(`[billing] Subscription ${sub.id} is missing student or consent metadata.`);
    return;
  }
  const periodEnd = sub.items.data[0]?.current_period_end;
  const { error } = await db.from("subscriptions").upsert(
    {
      student_id,
      stripe_subscription_id: sub.id,
      catalog_id: catalog_id || null,
      status: sub.status,
      currency: sub.currency,
      current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      cancel_at_period_end: sub.cancel_at_period_end,
      renewal_consent_at,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "stripe_subscription_id" },
  );
  if (error) throw error;
}
