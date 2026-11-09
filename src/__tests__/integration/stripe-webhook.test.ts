/**
 * @jest-environment node
 *
 * Integration tests for Stripe webhook idempotency. They call the route
 * handler with signed events and check the rows in the LOCAL Supabase stack.
 * Run after `npx supabase migration up` and `npm run seed:local`:
 *
 *   NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321 SUPABASE_SECRET_KEY=<from supabase status> \
 *     npx jest src/__tests__/integration --testEnvironment=node
 *
 * Resend is mocked, so no email is sent. No call goes to Stripe.
 */

const mockSend = jest.fn();
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
import { stripe } from "@/lib/stripe";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const KEY = process.env.SUPABASE_SECRET_KEY ?? "";
// Never run these writes against a hosted project.
const isLocal = /^http:\/\/(127\.0\.0\.1|localhost):54321\/?$/.test(URL);
const itLocal = isLocal && KEY ? it : it.skip;

const SECRET = "whsec_integration_test";
process.env.STRIPE_WEBHOOK_SECRET = SECRET;

const admin = () =>
  createClient(URL, KEY, { auth: { autoRefreshToken: false, persistSession: false } });

let letterId = "";
let requestId = "";
let studentUserId = "";
const eventIds: string[] = [];

beforeAll(async () => {
  if (!isLocal || !KEY) return;
  const db = admin();
  const { data: s } = await db.from("students").select("id, user_id").limit(1).single();
  const { data: f } = await db
    .from("faculty")
    .select("id")
    .not("user_id", "is", null)
    .limit(1)
    .single();
  if (!s || !f) throw new Error("Seed the local stack first: npm run seed:local");
  studentUserId = s.user_id as string;

  requestId = randomUUID();
  const { error: reqError } = await db.from("letter_requests").insert({
    id: requestId,
    student_id: s.id,
    faculty_id: f.id,
    professor_email: "faculty@test.local",
    status: "requested",
  });
  if (reqError) throw new Error(reqError.message);

  const { data: letter, error: letterError } = await db
    .from("letters")
    .insert({ request_id: requestId, faculty_id: f.id, student_id: s.id })
    .select("id")
    .single();
  if (letterError) throw new Error(letterError.message);
  letterId = letter.id as string;
});

afterAll(async () => {
  if (!letterId) return;
  const db = admin();
  await db.from("payment_events").delete().eq("letter_id", letterId);
  await db.from("delivery_links").delete().eq("letter_id", letterId);
  await db.from("letters").delete().eq("id", letterId);
  await db.from("letter_requests").delete().eq("id", requestId);
  if (eventIds.length) await db.from("stripe_events").delete().in("event_id", eventIds);
});

beforeEach(() => {
  mockSend.mockReset();
  mockSend.mockResolvedValue({ data: { id: "email" }, error: null });
});

function checkoutEvent(sessionId: string, metadata: Record<string, string>) {
  const id = `evt_${randomUUID().replace(/-/g, "")}`;
  eventIds.push(id);
  return JSON.stringify({
    id,
    object: "event",
    type: "checkout.session.completed",
    data: {
      object: {
        id: sessionId,
        object: "checkout.session",
        amount_total: 500,
        currency: "usd",
        metadata,
      },
    },
  });
}

async function post(payload: string) {
  const { POST } = await import("@/app/api/webhooks/stripe/route");
  const signature = stripe.webhooks.generateTestHeaderString({ payload, secret: SECRET });
  return POST(
    new NextRequest("http://localhost/api/webhooks/stripe", {
      method: "POST",
      body: payload,
      headers: { "stripe-signature": signature },
    }),
  );
}

const meta = () => ({
  letter_id: letterId,
  school_name: "Test University",
  school_email: "admissions@test.local",
  student_user_id: studentUserId,
});

async function counts(sessionId: string, eventId: string) {
  const db = admin();
  const links = await db
    .from("delivery_links")
    .select("id", { count: "exact", head: true })
    .eq("stripe_checkout_session_id", sessionId);
  const payments = await db
    .from("payment_events")
    .select("id", { count: "exact", head: true })
    .eq("stripe_event_id", eventId);
  const { data: evt } = await db
    .from("stripe_events")
    .select("processed_at")
    .eq("event_id", eventId)
    .maybeSingle();
  return { links: links.count, payments: payments.count, processed: Boolean(evt?.processed_at) };
}

describe("Stripe webhook idempotency", () => {
  itLocal("a replayed event creates one link, one payment event and one email", async () => {
    const sessionId = `cs_test_${randomUUID()}`;
    const payload = checkoutEvent(sessionId, meta());
    const eventId = JSON.parse(payload).id as string;

    expect((await post(payload)).status).toBe(200);
    expect((await post(payload)).status).toBe(200);

    expect(await counts(sessionId, eventId)).toEqual({ links: 1, payments: 1, processed: true });
    expect(mockSend).toHaveBeenCalledTimes(1);
  });

  itLocal("an email failure answers 500, and the retry finishes without a second link", async () => {
    const sessionId = `cs_test_${randomUUID()}`;
    const payload = checkoutEvent(sessionId, meta());
    const eventId = JSON.parse(payload).id as string;
    mockSend.mockResolvedValueOnce({ data: null, error: { name: "application_error", message: "down" } });

    expect((await post(payload)).status).toBe(500);
    expect(await counts(sessionId, eventId)).toEqual({ links: 1, payments: 1, processed: false });

    expect((await post(payload)).status).toBe(200);
    expect(await counts(sessionId, eventId)).toEqual({ links: 1, payments: 1, processed: true });

    expect(mockSend).toHaveBeenCalledTimes(2);
    const keys = mockSend.mock.calls.map((call) => call[1]?.idempotencyKey);
    expect(keys).toEqual([`delivery-approval/${sessionId}`, `delivery-approval/${sessionId}`]);
  });

  itLocal("bad metadata answers 200 and is marked processed, because a retry cannot fix it", async () => {
    const sessionId = `cs_test_${randomUUID()}`;
    const payload = checkoutEvent(sessionId, { letter_id: letterId });
    const eventId = JSON.parse(payload).id as string;

    expect((await post(payload)).status).toBe(200);
    expect(await counts(sessionId, eventId)).toEqual({ links: 0, payments: 0, processed: true });
    expect(mockSend).not.toHaveBeenCalled();
  });

  itLocal("a bad signature answers 400 and records nothing", async () => {
    const { POST } = await import("@/app/api/webhooks/stripe/route");
    const payload = checkoutEvent(`cs_test_${randomUUID()}`, meta());
    const res = await POST(
      new NextRequest("http://localhost/api/webhooks/stripe", {
        method: "POST",
        body: payload,
        headers: { "stripe-signature": "t=1,v1=bad" },
      }),
    );
    expect(res.status).toBe(400);
    const { count } = await admin()
      .from("stripe_events")
      .select("event_id", { count: "exact", head: true })
      .eq("event_id", JSON.parse(payload).id);
    expect(count).toBe(0);
  });
});
