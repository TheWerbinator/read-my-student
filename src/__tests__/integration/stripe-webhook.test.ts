/**
 * @jest-environment node
 *
 * Integration tests for the Stripe webhook route: signature check, one run per
 * event id, and a 500 that makes Stripe retry. They call the route handler with
 * signed events and check stripe_events in the LOCAL Supabase stack. The billing
 * handler is mocked; its own tests are in stripe-billing.test.ts.
 * Run after `npx supabase migration up` and `npm run seed:local`:
 *
 *   NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321 SUPABASE_SECRET_KEY=<from supabase status> \
 *     npx jest src/__tests__/integration --testEnvironment=node
 *
 * No call goes to Stripe.
 */

const mockHandle = jest.fn();
jest.mock("@/lib/stripe-billing", () => ({ handleBillingEvent: (...args: unknown[]) => mockHandle(...args) }));
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

const eventIds: string[] = [];

afterAll(async () => {
  if (isLocal && KEY && eventIds.length) {
    await admin().from("stripe_events").delete().in("event_id", eventIds);
  }
});

beforeEach(() => {
  mockHandle.mockReset();
  mockHandle.mockResolvedValue(undefined);
});

function event(type: string, object: Record<string, unknown>) {
  const id = `evt_${randomUUID().replace(/-/g, "")}`;
  eventIds.push(id);
  return { id, payload: JSON.stringify({ id, object: "event", type, data: { object } }) };
}

async function post(payload: string, signature?: string) {
  const { POST } = await import("@/app/api/webhooks/stripe/route");
  return POST(
    new NextRequest("http://localhost/api/webhooks/stripe", {
      method: "POST",
      body: payload,
      headers: {
        "stripe-signature": signature ?? stripe.webhooks.generateTestHeaderString({ payload, secret: SECRET }),
      },
    }),
  );
}

async function processed(eventId: string) {
  const { data } = await admin().from("stripe_events").select("processed_at").eq("event_id", eventId).maybeSingle();
  return data ? Boolean(data.processed_at) : null;
}

describe("Stripe webhook route", () => {
  itLocal("a replayed event is handled once", async () => {
    const e = event("invoice.paid", { id: "in_test" });
    expect((await post(e.payload)).status).toBe(200);
    expect((await post(e.payload)).status).toBe(200);
    expect(mockHandle).toHaveBeenCalledTimes(1);
    expect(await processed(e.id)).toBe(true);
  });

  itLocal("a handler failure answers 500, and the retry finishes", async () => {
    const e = event("invoice.paid", { id: "in_test" });
    mockHandle.mockRejectedValueOnce(new Error("database down"));

    expect((await post(e.payload)).status).toBe(500);
    expect(await processed(e.id)).toBe(false);

    expect((await post(e.payload)).status).toBe(200);
    expect(await processed(e.id)).toBe(true);
    expect(mockHandle).toHaveBeenCalledTimes(2);
  });

  itLocal("an old $5 delivery event goes to the billing handler, which ignores it", async () => {
    const e = event("checkout.session.completed", { id: "cs_test_old", metadata: { letter_id: randomUUID() } });
    expect((await post(e.payload)).status).toBe(200);
    expect(mockHandle).toHaveBeenCalledWith(expect.anything(), expect.anything(), expect.objectContaining({ id: e.id }));
  });

  itLocal("a bad signature answers 400 and records nothing", async () => {
    const e = event("invoice.paid", { id: "in_test" });
    expect((await post(e.payload, "t=1,v1=bad")).status).toBe(400);
    expect(mockHandle).not.toHaveBeenCalled();
    expect(await processed(e.id)).toBeNull();
  });
});
