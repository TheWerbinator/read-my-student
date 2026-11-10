/**
 * @jest-environment node
 *
 * Integration tests for emailed request links and the unanswered-request sweep.
 * Run against the LOCAL Supabase stack only, after `npx supabase db reset`
 * and `npm run seed:local`:
 *
 *   NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321 SUPABASE_SECRET_KEY=<from supabase status> \
 *     npx jest src/__tests__/integration --testEnvironment=node
 *
 * Resend is mocked, so no email is sent.
 */

const mockSend = jest.fn().mockResolvedValue({ data: { id: "test" }, error: null });
jest.mock("resend", () => ({
  Resend: jest.fn().mockImplementation(() => ({ emails: { send: mockSend } })),
}));
jest.mock("@/lib/stripe", () => ({ stripe: {} }));
// The logged-in user for sendLetterRequest. Null everywhere else, as for a link visitor.
let mockUser: { id: string; email: string; user_metadata: Record<string, string> } | null = null;
jest.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser: async () => ({ data: { user: mockUser } }) } }),
}));
let mockCountry: string | null = null;
jest.mock("next/headers", () => ({
  headers: async () => new Headers(mockCountry ? { "x-vercel-ip-country": mockCountry } : {}),
}));

import { randomUUID } from "crypto";
import { createClient } from "@supabase/supabase-js";
import {
  authorizeRequestAccess,
  hashToken,
  requestLinkToken,
} from "@/lib/request-access";
import { sweepUnansweredRequests } from "@/lib/request-sweep";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const KEY = process.env.SUPABASE_SECRET_KEY ?? "";
// Never run these writes against a hosted project.
const isLocal = /^http:\/\/(127\.0\.0\.1|localhost):54321\/?$/.test(URL);
const itLocal = isLocal && KEY ? it : it.skip;

process.env.PDF_SIGNING_SECRET ??= "integration-test-secret-32-chars!!";

const admin = () =>
  createClient(URL, KEY, { auth: { autoRefreshToken: false, persistSession: false } });

const DAY = 24 * 60 * 60 * 1000;
const created: string[] = [];
let studentId = "";
let facultyId = "";

async function insertRequest(createdAt: Date, student = studentId) {
  const id = randomUUID();
  const { error } = await admin()
    .from("letter_requests")
    .insert({
      id,
      student_id: student,
      faculty_id: facultyId,
      professor_email: "professor@test.local",
      status: "requested",
      access_token_hash: hashToken(requestLinkToken(id)),
      created_at: createdAt.toISOString(),
    });
  if (error) throw new Error(error.message);
  created.push(id);
  return id;
}

beforeAll(async () => {
  if (!isLocal || !KEY) return;
  const db = admin();
  // The seeded student, by email: other test files create and delete students in parallel.
  const { data: users } = await db.auth.admin.listUsers({ perPage: 1000 });
  const seeded = users?.users.find((u) => u.email === "student@test.local");
  const { data: s } = await db.from("students").select("id").eq("user_id", seeded?.id ?? "").maybeSingle();
  const { data: f } = await db
    .from("faculty")
    .select("id")
    .not("user_id", "is", null)
    .limit(1)
    .single();
  if (!s || !f) throw new Error("Seed the local stack first: npm run seed:local");
  studentId = s.id as string;
  facultyId = f.id as string;
  await makeWalletStudent();
});

// A PhD student: the seed catalog gives PhD no free credits, so the balance is
// exactly what each test grants.
const PROF = "credit-professor@test.local";
let wallet = { userId: "", email: "", studentId: "" };

async function makeWalletStudent() {
  const db = admin();
  const email = `request-credits-${randomUUID()}@test.local`;
  const { data, error } = await db.auth.admin.createUser({ email, password: "TestPassword1!", email_confirm: true });
  if (error) throw error;
  const { data: s, error: sError } = await db
    .from("students")
    .insert({ user_id: data.user.id, stage: "phd" })
    .select("id")
    .single();
  if (sError) throw sError;
  wallet = { userId: data.user.id, email, studentId: s.id as string };
}

async function grantCredits(quantity: number) {
  const { error } = await admin()
    .from("credit_grants")
    .insert({ student_id: wallet.studentId, source: "adjustment", quantity, source_ref: `test:${randomUUID()}` });
  if (error) throw error;
}

async function walletBalance() {
  const { loadWallet } = await import("@/lib/credit-wallet");
  const { balance } = await import("@/lib/credits");
  const w = await loadWallet(admin(), wallet.studentId);
  return balance(w.grants, w.events, new Date());
}

afterAll(async () => {
  if (created.length) await admin().from("letter_requests").delete().in("id", created);
  if (wallet.userId) {
    const db = admin();
    await db.from("letter_requests").delete().eq("student_id", wallet.studentId);
    await db.from("faculty").delete().is("user_id", null).eq("email", PROF);
    await db.auth.admin.deleteUser(wallet.userId);
  }
});

describe("authorizeRequestAccess by link token", () => {
  itLocal("grants access to the matching request only", async () => {
    const id = await insertRequest(new Date());
    const token = requestLinkToken(id);

    const access = await authorizeRequestAccess(null, token);
    expect(access).toMatchObject({ requestId: id, facultyId, studentId, viaToken: true });

    expect(await authorizeRequestAccess(id, token)).not.toBeNull();
    expect(await authorizeRequestAccess(randomUUID(), token)).toBeNull();
    expect(await authorizeRequestAccess(null, token.slice(0, -1) + "x")).toBeNull();
  });
});

describe("server actions by link token", () => {
  // Imported inside the tests: letters.ts builds its client at import time,
  // which needs the env that only the local run provides.
  const actions = () => import("@/app/actions/letters");
  const draft = {
    recommenderForm: {} as never,
    letterHtml: "<p>Draft</p>",
    letterPlainText: "Draft",
    letterEditorState: null,
  };

  itLocal("saveDraft marks the request answered and refuses a finalized letter", async () => {
    const { saveDraft } = await actions();
    const id = await insertRequest(new Date());
    const token = requestLinkToken(id);

    expect((await saveDraft(id, draft, "wrong-token")).success).toBe(false);

    const saved = await saveDraft(id, draft, token);
    expect(saved).toMatchObject({ success: true });
    const { data: req } = await admin()
      .from("letter_requests")
      .select("responded_at")
      .eq("id", id)
      .single();
    expect(req?.responded_at).not.toBeNull();

    await admin().from("letters").update({ is_draft: false }).eq("id", saved.letterId!);
    expect(await saveDraft(id, draft, token)).toMatchObject({
      success: false,
      error: "This letter has already been finalized.",
    });
  });

  itLocal("rejectLetterRequest declines, emails the student, and closes the request", async () => {
    const { rejectLetterRequest, saveDraft } = await actions();
    const id = await insertRequest(new Date());
    const token = requestLinkToken(id);
    mockSend.mockClear();

    expect(await rejectLetterRequest(id, "Not my course", token)).toEqual({ error: null });

    const { data } = await admin()
      .from("letter_requests")
      .select("status")
      .eq("id", id)
      .single();
    expect(data?.status).toBe("rejected");
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ to: "student@test.local" }),
    );
    expect(await saveDraft(id, draft, token)).toMatchObject({
      success: false,
      error: "This request is closed.",
    });
    expect(await rejectLetterRequest(id, undefined, token)).toEqual({
      error: "Request is no longer in a rejectable state.",
    });
  });
});

describe("sweepUnansweredRequests", () => {
  itLocal("reminds on day 3, expires on day 7, and does neither twice", async () => {
    const now = new Date();
    const fresh = await insertRequest(new Date(now.getTime() - 1 * DAY));
    const dayFour = await insertRequest(new Date(now.getTime() - 4 * DAY));
    const dayEight = await insertRequest(new Date(now.getTime() - 8 * DAY));

    await sweepUnansweredRequests(now);

    const { data: rows } = await admin()
      .from("letter_requests")
      .select("id, status, reminder_sent_at")
      .in("id", [fresh, dayFour, dayEight]);
    const byId = Object.fromEntries((rows ?? []).map((r) => [r.id, r]));

    expect(byId[fresh]).toMatchObject({ status: "requested", reminder_sent_at: null });
    expect(byId[dayFour].status).toBe("requested");
    expect(byId[dayFour].reminder_sent_at).not.toBeNull();
    expect(byId[dayEight]).toMatchObject({ status: "expired", reminder_sent_at: null });

    // The reminder went to the professor with a link to the request page.
    const reminder = mockSend.mock.calls.find(
      ([msg]) => msg.to === "professor@test.local" && msg.subject.startsWith("Reminder"),
    );
    expect(reminder?.[0].html).toContain(`/r/${requestLinkToken(dayFour)}`);

    mockSend.mockClear();
    await sweepUnansweredRequests(now);
    const professorMail = mockSend.mock.calls.filter(
      ([msg]) => msg.to === "professor@test.local",
    );
    expect(professorMail).toHaveLength(0);
  });

  itLocal("leaves answered requests alone", async () => {
    const now = new Date();
    const answered = await insertRequest(new Date(now.getTime() - 8 * DAY));
    await admin()
      .from("letter_requests")
      .update({ responded_at: new Date(now.getTime() - 6 * DAY).toISOString() })
      .eq("id", answered);

    await sweepUnansweredRequests(now);

    const { data } = await admin()
      .from("letter_requests")
      .select("status, reminder_sent_at")
      .eq("id", answered)
      .single();
    expect(data).toMatchObject({ status: "requested", reminder_sent_at: null });
  });
});

describe("credits on letter requests", () => {
  const actions = () => import("@/app/actions/letters");
  const asWalletStudent = () => {
    mockUser = { id: wallet.userId, email: wallet.email, user_metadata: { firstName: "Wallet", lastName: "Test" } };
  };
  afterEach(() => {
    mockUser = null;
  });

  async function requestsFor() {
    const { data } = await admin().from("letter_requests").select("id").eq("student_id", wallet.studentId);
    return (data ?? []).map((r) => r.id as string);
  }

  async function events(requestId: string) {
    const { data } = await admin().from("credit_events").select("type").eq("request_id", requestId);
    return (data ?? []).map((e) => e.type as string).sort();
  }

  itLocal("sendLetterRequest refuses with no credits and leaves no request", async () => {
    const { sendLetterRequest } = await actions();
    asWalletStudent();
    const before = await requestsFor();
    mockSend.mockClear();

    const res = await sendLetterRequest({ professorEmail: PROF });
    expect(res).toEqual({ status: "error", error: "You have no credits left. Buy credits to send a request." });
    expect(await requestsFor()).toEqual(before);
    expect(mockSend).not.toHaveBeenCalled();
  });

  itLocal("sendLetterRequest spends one credit, and a failed email gives it back", async () => {
    const { sendLetterRequest } = await actions();
    asWalletStudent();
    await grantCredits(1);
    const start = await walletBalance();

    mockSend.mockResolvedValueOnce({ data: null, error: { name: "application_error", message: "down" } });
    const failed = await sendLetterRequest({ professorEmail: PROF });
    expect(failed.status).toBe("error");
    expect(await walletBalance()).toBe(start);

    const sent = await sendLetterRequest({ professorEmail: PROF });
    expect(sent.status).toBe("requested");
    const requestId = (sent as { requestId: string }).requestId;
    expect(await events(requestId)).toEqual(["consume"]);
    expect(await walletBalance()).toBe(start - 1);
  });

  itLocal("a decline gives the credit back and says so in the email", async () => {
    const { rejectLetterRequest } = await actions();
    const { spendCredit } = await import("@/lib/credit-wallet");
    await grantCredits(1);
    const id = await insertRequest(new Date(), wallet.studentId);
    expect(await spendCredit(admin(), wallet.studentId, id, new Date())).toBe("consumed");
    const start = await walletBalance();
    mockSend.mockClear();

    expect(await rejectLetterRequest(id, undefined, requestLinkToken(id))).toEqual({ error: null });
    expect(await events(id)).toEqual(["consume", "refund"]);
    expect(await walletBalance()).toBe(start + 1);
    const mail = mockSend.mock.calls.find(([msg]) => msg.to === wallet.email);
    expect(mail?.[0].html).toContain("back in your balance");
  });

  itLocal("the day-7 expiry gives the credit back once", async () => {
    const { spendCredit } = await import("@/lib/credit-wallet");
    await grantCredits(1);
    const id = await insertRequest(new Date(Date.now() - 8 * DAY), wallet.studentId);
    expect(await spendCredit(admin(), wallet.studentId, id, new Date())).toBe("consumed");

    await sweepUnansweredRequests(new Date());
    await sweepUnansweredRequests(new Date());
    expect(await events(id)).toEqual(["consume", "refund"]);
  });

  itLocal("getWallet shows the balance and prices what the student can buy in their currency", async () => {
    const { getWallet } = await import("@/app/actions/credits");
    const db = admin();
    const offer = { stage: "phd", kind: "credits", credits: 1, price_usd_cents: 255, price_inr_paise: 21900, expiry: "never" };
    const { data: rows, error } = await db
      .from("plan_catalog")
      .insert([
        { ...offer, active: true, stripe_price_usd: "price_w_usd", stripe_price_inr: "price_w_inr" },
        { ...offer, active: false, stripe_price_usd: "price_off_usd" },
      ])
      .select("id");
    if (error) throw error;
    const [onSale, off] = rows.map((r) => r.id as string);
    try {
      await grantCredits(2);
      asWalletStudent();

      mockCountry = "IN";
      const india = await getWallet();
      if (india?.status !== "ok") throw new Error(`expected a wallet, got ${JSON.stringify(india)}`);
      expect(india.balance).toBe(await walletBalance());
      expect(india.grants.some((g) => g.source === "adjustment" && g.quantity === 2)).toBe(true);
      expect(india.forSale.find((i) => i.id === onSale)?.price).toBe("₹219.00");
      expect(india.forSale.some((i) => i.id === off)).toBe(false);

      mockCountry = "US";
      const us = await getWallet();
      expect(us?.status === "ok" && us.forSale.find((i) => i.id === onSale)?.price).toBe("$2.55");
    } finally {
      mockCountry = null;
      await db.from("plan_catalog").delete().in("id", [onSale, off]);
    }
  });

  itLocal("a student with no stage gets no wallet and cannot request", async () => {
    const { getWallet } = await import("@/app/actions/credits");
    const { sendLetterRequest } = await actions();
    const db = admin();
    const email = `no-stage-${randomUUID()}@test.local`;
    const { data, error } = await db.auth.admin.createUser({ email, password: "TestPassword1!", email_confirm: true });
    if (error) throw error;
    try {
      const { error: sError } = await db.from("students").insert({ user_id: data.user.id });
      if (sError) throw sError;
      mockUser = { id: data.user.id, email, user_metadata: {} };
      expect(await getWallet()).toEqual({ status: "no_stage" });
      expect((await sendLetterRequest({ professorEmail: PROF })).status).toBe("error");
    } finally {
      await db.auth.admin.deleteUser(data.user.id);
    }
  });
});
