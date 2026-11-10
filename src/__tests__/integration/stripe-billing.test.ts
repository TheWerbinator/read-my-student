/**
 * @jest-environment node
 *
 * Integration tests for membership and credit webhooks. Signed events go
 * through the real route and the LOCAL database; Stripe API calls are mocked.
 * Run after `npx supabase migration up` and `npm run seed:local`:
 *
 *   NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321 SUPABASE_SECRET_KEY=<from supabase status> \
 *     npx jest src/__tests__/integration --testEnvironment=node
 *
 * The renewal lookup reads every Master's membership row, so the seeded ones are
 * switched off during the run and switched back on afterwards.
 */

const mockSend = jest.fn().mockResolvedValue({ data: { id: "email" }, error: null });
jest.mock("resend", () => ({
  Resend: jest.fn().mockImplementation(() => ({ emails: { send: mockSend } })),
}));
jest.mock("@/lib/stripe", () => {
  const S = jest.requireActual("stripe");
  const Stripe = S.default ?? S;
  return { stripe: new Stripe("sk_test_integration") };
});

import { randomUUID } from "crypto";
import { createClient } from "@supabase/supabase-js";
import { NextRequest } from "next/server";
import { offerMetadata } from "@/lib/billing";
import type { CatalogRow } from "@/lib/catalog";
import { loadWallet, spendCredit } from "@/lib/credit-wallet";
import { balance } from "@/lib/credits";
import { stripe } from "@/lib/stripe";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const KEY = process.env.SUPABASE_SECRET_KEY ?? "";
// Never run these writes against a hosted project.
const isLocal = /^http:\/\/(127\.0\.0\.1|localhost):54321\/?$/.test(URL);
const itLocal = isLocal && KEY ? it : it.skip;

const SECRET = "whsec_billing_test";
process.env.STRIPE_WEBHOOK_SECRET = SECRET;
const admin = () => createClient(URL, KEY, { auth: { autoRefreshToken: false, persistSession: false } });

const DAY = 86400000;
let userId = "";
let studentId = "";
let switchedOff: string[] = [];
const rows: Record<string, CatalogRow> = {};

const epoch = (date: Date) => Math.floor(date.getTime() / 1000);

beforeAll(async () => {
  if (!isLocal || !KEY) return;
  const db = admin();
  const { data: seeded } = await db
    .from("plan_catalog")
    .update({ active: false })
    .eq("stage", "masters")
    .eq("kind", "membership")
    .eq("active", true)
    .select("id");
  switchedOff = (seeded ?? []).map((r) => r.id as string);

  const base = { stage: "masters", kind: "membership", expiry: "end_of_year_n", expiry_year: 2, active: true };
  const { data: created, error } = await db
    .from("plan_catalog")
    .insert([
      { ...base, study_year: 1, credits: 45, price_usd_cents: 7000, stripe_price_usd: "price_m1_usd", stripe_price_inr: "price_m1_inr" },
      { ...base, study_year: 2, credits: 55, price_usd_cents: 9000, stripe_price_usd: "price_m2_usd", stripe_price_inr: "price_m2_inr" },
      { stage: "masters", kind: "credits", study_year: null, credits: 1, price_usd_cents: 199, expiry: "end_of_year_n", expiry_year: 2, active: true, stripe_price_usd: "price_mx_usd" },
    ])
    .select("*");
  if (error) throw error;
  for (const r of created as CatalogRow[]) rows[r.stripe_price_usd!] = r;

  const { data: user, error: userError } = await db.auth.admin.createUser({
    email: `billing-${randomUUID()}@test.local`,
    password: "TestPassword1!",
    email_confirm: true,
  });
  if (userError) throw userError;
  userId = user.user.id;
  // Master's Year 1, started 60 days ago: Year 2 starts 305 days from now.
  const { data: student, error: studentError } = await db
    .from("students")
    .insert({
      user_id: userId,
      stage: "masters",
      study_year: 1,
      year_started_on: new Date(Date.now() - 60 * DAY).toISOString().slice(0, 10),
    })
    .select("id")
    .single();
  if (studentError) throw studentError;
  studentId = student.id as string;
});

afterAll(async () => {
  if (!isLocal || !KEY) return;
  const db = admin();
  if (studentId) await db.from("students").delete().eq("id", studentId);
  if (userId) await db.auth.admin.deleteUser(userId);
  const ids = Object.values(rows).map((r) => r.id);
  if (ids.length) await db.from("plan_catalog").delete().in("id", ids);
  if (switchedOff.length) await db.from("plan_catalog").update({ active: true }).in("id", switchedOff);
});

beforeEach(() => {
  jest.restoreAllMocks();
  jest.spyOn(stripe.prices, "retrieve").mockImplementation((async (id: string) => ({
    id,
    metadata: offerMetadata(rows[id.replace("_inr", "_usd")]),
  })) as never);
  jest.spyOn(stripe.invoicePayments, "list").mockResolvedValue({ data: [{ payment: { payment_intent: "pi_member" } }] } as never);
});

function subscription(over: Record<string, unknown> = {}, periodEnd = new Date(Date.now() + 305 * DAY)) {
  return {
    id: "sub_test",
    status: "active",
    currency: "usd",
    cancel_at_period_end: false,
    metadata: {
      purpose: "credits",
      student_id: studentId,
      catalog_id: rows.price_m1_usd.id,
      renewal_consent_at: "2026-11-09T00:00:00.000Z",
    },
    items: { data: [{ id: "si_test", current_period_end: epoch(periodEnd), price: { id: "price_m1_usd" } }] },
    ...over,
  };
}

const invoice = (id: string, billingReason: string, price = "price_m1_usd") => ({
  id,
  object: "invoice",
  billing_reason: billingReason,
  parent: { type: "subscription_details", subscription_details: { subscription: "sub_test" } },
  lines: { data: [{ quantity: 1, pricing: { type: "price_details", price_details: { price, product: "prod" } } }] },
});

async function post(type: string, object: unknown) {
  const { POST } = await import("@/app/api/webhooks/stripe/route");
  const payload = JSON.stringify({ id: `evt_${randomUUID().replace(/-/g, "")}`, object: "event", type, data: { object } });
  const signature = stripe.webhooks.generateTestHeaderString({ payload, secret: SECRET });
  return POST(
    new NextRequest("http://localhost/api/webhooks/stripe", {
      method: "POST",
      body: payload,
      headers: { "stripe-signature": signature },
    }),
  );
}

async function grants(sourceRef: string) {
  const { data } = await admin()
    .from("credit_grants")
    .select("quantity, source, expires_at, stripe_payment_intent")
    .eq("source_ref", sourceRef);
  return data ?? [];
}

describe("membership webhooks", () => {
  itLocal("a paid first year grants its credits once, even when the event repeats (UAT-07)", async () => {
    jest.spyOn(stripe.subscriptions, "retrieve").mockResolvedValue(subscription() as never);
    const paid = invoice("in_first", "subscription_create");

    expect((await post("invoice.paid", paid)).status).toBe(200);
    expect((await post("invoice.paid", paid)).status).toBe(200); // a new event id for the same invoice

    const granted = await grants("invoice:in_first");
    expect(granted).toHaveLength(1);
    expect(granted[0]).toMatchObject({ quantity: 45, source: "membership", stripe_payment_intent: "pi_member" });
    // Master's Year 1 credits end with Year 2: two anniversaries after the start.
    const start = new Date(Date.now() - 60 * DAY);
    expect(new Date(granted[0].expires_at as string).getUTCFullYear()).toBe(start.getUTCFullYear() + 2);

    const { data: mirrored } = await admin()
      .from("subscriptions")
      .select("status, currency, renewal_consent_at")
      .eq("stripe_subscription_id", "sub_test")
      .single();
    expect(mirrored).toMatchObject({ status: "active", currency: "usd" });
    expect(mirrored?.renewal_consent_at).not.toBeNull();
  });

  itLocal("does not grant while the subscription is not active, and asks Stripe to retry", async () => {
    jest.spyOn(stripe.subscriptions, "retrieve").mockResolvedValue(subscription({ status: "incomplete" }) as never);
    expect((await post("invoice.paid", invoice("in_incomplete", "subscription_create"))).status).toBe(500);
    expect(await grants("invoice:in_incomplete")).toHaveLength(0);
  });

  itLocal("ignores invoices that are not a membership year", async () => {
    const retrieve = jest.spyOn(stripe.subscriptions, "retrieve");
    expect((await post("invoice.paid", invoice("in_update", "subscription_update"))).status).toBe(200);
    expect(retrieve).not.toHaveBeenCalled();
  });

  itLocal("before renewal, moves the subscription to next year's catalog price with no proration", async () => {
    jest.spyOn(stripe.subscriptions, "retrieve").mockResolvedValue(subscription() as never);
    const update = jest.spyOn(stripe.subscriptions, "update").mockResolvedValue({} as never);

    expect((await post("invoice.upcoming", { ...invoice("", "upcoming"), id: undefined })).status).toBe(200);
    expect(update).toHaveBeenCalledWith("sub_test", {
      items: [{ id: "si_test", price: "price_m2_usd" }],
      proration_behavior: "none",
      metadata: expect.objectContaining({ catalog_id: rows.price_m2_usd.id }),
    });
  });

  itLocal("keeps an INR subscription in INR", async () => {
    jest.spyOn(stripe.subscriptions, "retrieve").mockResolvedValue(subscription({ currency: "inr" }) as never);
    const update = jest.spyOn(stripe.subscriptions, "update").mockResolvedValue({} as never);
    await post("invoice.upcoming", { ...invoice("", "upcoming"), id: undefined });
    expect(update).toHaveBeenCalledWith("sub_test", expect.objectContaining({ items: [{ id: "si_test", price: "price_m2_inr" }] }));
  });

  itLocal("ends the subscription when there is no membership for the next year", async () => {
    // Renewal after the end of Master's Year 2.
    jest.spyOn(stripe.subscriptions, "retrieve").mockResolvedValue(subscription({}, new Date(Date.now() + 700 * DAY)) as never);
    const update = jest.spyOn(stripe.subscriptions, "update").mockResolvedValue({} as never);
    await post("invoice.upcoming", { ...invoice("", "upcoming"), id: undefined });
    expect(update).toHaveBeenCalledWith("sub_test", { cancel_at_period_end: true });
  });

  itLocal("a refund removes the unused credits from that payment, and spent ones stay spent", async () => {
    const db = admin();
    const requestId = randomUUID();
    await db.from("letter_requests").insert({ id: requestId, student_id: studentId, professor_email: "faculty@test.local", status: "requested" });
    expect(await spendCredit(db, studentId, requestId, new Date())).toBe("consumed");

    expect((await post("charge.refunded", { id: "ch_test", object: "charge", payment_intent: "pi_member" })).status).toBe(200);
    expect((await post("charge.refunded", { id: "ch_test", object: "charge", payment_intent: "pi_member" })).status).toBe(200);

    const { data: adjustments } = await db.from("credit_events").select("delta, reason").eq("type", "adjust").eq("reason", "Stripe refund ch_test");
    expect(adjustments).toEqual([{ delta: -44, reason: "Stripe refund ch_test" }]);
    const { grants: g, events } = await loadWallet(db, studentId);
    expect(balance(g, events, new Date())).toBe(0);
  });
});

describe("one-time credit purchases", () => {
  itLocal("a paid Checkout grants quantity times credits once; an unpaid one grants nothing", async () => {
    jest.spyOn(stripe.checkout.sessions, "listLineItems").mockResolvedValue({
      data: [{ quantity: 10, price: { id: "price_mx_usd", metadata: offerMetadata(rows.price_mx_usd) } }],
    } as never);
    const session = (id: string, paymentStatus: string) => ({
      id,
      object: "checkout.session",
      mode: "payment",
      payment_status: paymentStatus,
      payment_intent: "pi_credits",
      metadata: { purpose: "credits", student_id: studentId, catalog_id: rows.price_mx_usd.id },
    });

    await post("checkout.session.completed", session("cs_unpaid", "unpaid"));
    expect(await grants("checkout:cs_unpaid")).toHaveLength(0);

    await post("checkout.session.completed", session("cs_paid", "paid"));
    await post("checkout.session.async_payment_succeeded", session("cs_paid", "paid"));
    const granted = await grants("checkout:cs_paid");
    expect(granted).toEqual([expect.objectContaining({ quantity: 10, source: "credits", stripe_payment_intent: "pi_credits" })]);
  });
});
