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

async function insertRequest(createdAt: Date) {
  const id = randomUUID();
  const { error } = await admin()
    .from("letter_requests")
    .insert({
      id,
      student_id: studentId,
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
  const { data: s } = await db.from("students").select("id").limit(1).single();
  const { data: f } = await db
    .from("faculty")
    .select("id")
    .not("user_id", "is", null)
    .limit(1)
    .single();
  if (!s || !f) throw new Error("Seed the local stack first: npm run seed:local");
  studentId = s.id as string;
  facultyId = f.id as string;
});

afterAll(async () => {
  if (created.length) await admin().from("letter_requests").delete().in("id", created);
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
