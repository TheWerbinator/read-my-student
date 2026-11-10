/**
 * POST /api/billing/checkout
 *
 * Starts an embedded Stripe Checkout for a catalog item: a yearly membership
 * (subscription mode) or extra credits and bundles (payment mode). Credits are
 * granted only by the webhook after Stripe confirms payment (BRD PAY-01).
 *
 * Body: { catalogId: string, quantity?: number, autoRenewConsent?: boolean }
 * Visitors in India (Vercel's x-vercel-ip-country header,
 * https://vercel.com/docs/headers/request-headers) pay in INR when the item has
 * an INR Price; everyone else pays USD.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminDb } from "@/lib/admin";
import { LIVE_STATUSES, checkPurchase, chooseCurrency, priceFor } from "@/lib/billing";
import { CATALOG_COLUMNS, type CatalogRow } from "@/lib/catalog";
import { studentYear, type StudentRow } from "@/lib/credit-wallet";
import { stripe } from "@/lib/stripe";
import { BILLING_PURPOSE } from "@/lib/stripe-billing";
import { createClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  catalogId: z.uuid(),
  quantity: z.number().int().optional(),
  autoRenewConsent: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) return NextResponse.json({ error: "Log in to buy credits." }, { status: 401 });

  const body = bodySchema.safeParse(await req.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  const { catalogId, quantity = 1, autoRenewConsent = false } = body.data;

  const db = adminDb();
  const { data: student, error: studentError } = await db
    .from("students")
    .select("id, stage, study_year, year_started_on, stripe_customer_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (studentError) throw studentError;
  if (!student) return NextResponse.json({ error: "Only students can buy credits." }, { status: 403 });

  const { data: row, error: rowError } = await db
    .from("plan_catalog")
    .select(CATALOG_COLUMNS)
    .eq("id", catalogId)
    .maybeSingle();
  if (rowError) throw rowError;
  if (!row) return NextResponse.json({ error: "This item is not for sale." }, { status: 404 });
  const item = row as CatalogRow;

  const { count: liveMemberships, error: subError } = await db
    .from("subscriptions")
    .select("id", { count: "exact", head: true })
    .eq("student_id", student.id)
    .in("status", LIVE_STATUSES);
  if (subError) throw subError;

  const now = new Date();
  const check = checkPurchase(item, studentYear(student as StudentRow), now, {
    quantity,
    hasActiveMembership: (liveMemberships ?? 0) > 0,
    autoRenewConsent,
  });
  if (!check.ok) return NextResponse.json({ error: check.error }, { status: 400 });

  const price = priceFor(item, chooseCurrency(req.headers.get("x-vercel-ip-country"), item));
  if (!price) return NextResponse.json({ error: "This item is not for sale." }, { status: 400 });

  // One Stripe customer per student. The idempotency key stops two tabs from creating two.
  let customer = student.stripe_customer_id as string | null;
  if (!customer) {
    customer = (
      await stripe.customers.create(
        { email: user.email, metadata: { student_id: student.id } },
        { idempotencyKey: `student-customer/${student.id}` },
      )
    ).id;
    const { error: saveError } = await db.from("students").update({ stripe_customer_id: customer }).eq("id", student.id);
    if (saveError) throw saveError;
  }

  const membership = item.kind === "membership";
  const metadata: Record<string, string> = {
    purpose: BILLING_PURPOSE,
    student_id: student.id,
    catalog_id: item.id,
    ...(membership ? { renewal_consent_at: now.toISOString() } : {}),
  };
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://readmystudent.com";

  const session = await stripe.checkout.sessions.create({
    mode: membership ? "subscription" : "payment",
    ui_mode: "embedded",
    customer,
    line_items: [{ price, quantity }],
    metadata,
    ...(membership ? { subscription_data: { metadata } } : { payment_intent_data: { metadata } }),
    return_url: `${siteUrl}/dashboard?checkout={CHECKOUT_SESSION_ID}`,
  });
  if (!session.client_secret) {
    return NextResponse.json({ error: "Checkout could not start. Try again." }, { status: 500 });
  }
  return NextResponse.json({ clientSecret: session.client_secret });
}
