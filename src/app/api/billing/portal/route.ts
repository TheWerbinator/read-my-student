/**
 * POST /api/billing/portal
 *
 * Opens the Stripe customer portal, where a student cancels auto-renewal or
 * changes the card (https://docs.stripe.com/customer-management). The portal
 * must be configured in the Stripe Dashboard first (TODO.md).
 */

import { NextResponse } from "next/server";
import { adminDb } from "@/lib/admin";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Log in first." }, { status: 401 });

  const { data: student, error } = await adminDb()
    .from("students")
    .select("stripe_customer_id")
    .eq("user_id", auth.user.id)
    .maybeSingle();
  if (error) throw error;
  if (!student?.stripe_customer_id) {
    return NextResponse.json({ error: "You have no payments to manage." }, { status: 404 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://readmystudent.com";
  const session = await stripe.billingPortal.sessions.create({
    customer: student.stripe_customer_id as string,
    return_url: `${siteUrl}/dashboard`,
  });
  return NextResponse.json({ url: session.url });
}
