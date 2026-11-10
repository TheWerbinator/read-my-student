/**
 * @jest-environment node
 *
 * Integration tests for free school delivery (Phase 3): a student sends a
 * finalized letter to a school, and the professor approves or declines from
 * the request link or the dashboard. LOCAL Supabase stack only, after
 * `npx supabase migration up` and `npm run seed:local`:
 *
 *   NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321 SUPABASE_SECRET_KEY=<from supabase status> \
 *     npx jest src/__tests__/integration --testEnvironment=node
 *
 * Resend is mocked, so no email is sent.
 */

const mockSend = jest.fn();
jest.mock("resend", () => ({
  Resend: jest.fn().mockImplementation(() => ({ emails: { send: mockSend } })),
}));
jest.mock("@/lib/stripe", () => ({ stripe: {} }));
// The logged-in user for the session paths. Null means a link visitor.
let mockUser: { id: string; email: string; user_metadata: Record<string, string> } | null = null;
jest.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser: async () => ({ data: { user: mockUser } }) } }),
}));

import { createHash, randomUUID } from "crypto";
import { createClient } from "@supabase/supabase-js";
import { hashToken, requestLinkToken } from "@/lib/request-access";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const KEY = process.env.SUPABASE_SECRET_KEY ?? "";
// Never run these writes against a hosted project.
const isLocal = /^http:\/\/(127\.0\.0\.1|localhost):54321\/?$/.test(URL);
const itLocal = isLocal && KEY ? it : it.skip;

process.env.PDF_SIGNING_SECRET ??= "integration-test-secret-32-chars!!";

const admin = () =>
  createClient(URL, KEY, { auth: { autoRefreshToken: false, persistSession: false } });

const PROF = "delivery-professor@test.local";
const studentUser = { id: "", email: "student@test.local", user_metadata: { firstName: "Priya", lastName: "Sharma" } };
const facultyUser = { id: "", email: "faculty@test.local", user_metadata: { firstName: "Alan", lastName: "Reyes" } };
let studentId = "";
let facultyId = "";
const requestIds: string[] = [];
const letterIds: string[] = [];

/** A request to PROF with a finalized letter. Returns the letter id and the request link token. */
async function finalizedLetter() {
  const db = admin();
  const requestId = randomUUID();
  const { error } = await db.from("letter_requests").insert({
    id: requestId,
    student_id: studentId,
    faculty_id: facultyId,
    professor_email: PROF,
    status: "requested",
    access_token_hash: hashToken(requestLinkToken(requestId)),
  });
  if (error) throw error;
  requestIds.push(requestId);
  const { data: letter, error: letterError } = await db
    .from("letters")
    .insert({ request_id: requestId, faculty_id: facultyId, student_id: studentId, is_draft: false })
    .select("id")
    .single();
  if (letterError) throw letterError;
  letterIds.push(letter.id as string);
  return { letterId: letter.id as string, token: requestLinkToken(requestId) };
}

async function linkFor(letterId: string) {
  const { data } = await admin()
    .from("delivery_links")
    .select("id, payment_status, recipient_email, recipient_email_hash, token_hash, expires_at, school_name")
    .eq("letter_id", letterId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();
  return data!;
}

const actions = () => import("@/app/actions/letters");

async function send(letterId: string, schoolEmail = "admissions@test-university.edu") {
  const { requestDelivery } = await actions();
  mockUser = studentUser;
  try {
    return await requestDelivery(letterId, { schoolName: "Test University", schoolEmail });
  } finally {
    mockUser = null;
  }
}

beforeAll(async () => {
  if (!isLocal || !KEY) return;
  const db = admin();
  const { data: users } = await db.auth.admin.listUsers({ perPage: 1000 });
  studentUser.id = users!.users.find((u) => u.email === studentUser.email)!.id;
  facultyUser.id = users!.users.find((u) => u.email === facultyUser.email)!.id;
  const { data: s } = await db.from("students").select("id").eq("user_id", studentUser.id).single();
  const { data: f } = await db.from("faculty").select("id").eq("user_id", facultyUser.id).single();
  if (!s || !f) throw new Error("Seed the local stack first: npm run seed:local");
  studentId = s.id as string;
  facultyId = f.id as string;
});

afterAll(async () => {
  if (!isLocal || !KEY) return;
  const db = admin();
  if (letterIds.length) {
    await db.from("delivery_links").delete().in("letter_id", letterIds);
    await db.from("letters").delete().in("id", letterIds);
  }
  if (requestIds.length) await db.from("letter_requests").delete().in("id", requestIds);
});

beforeEach(() => {
  mockUser = null;
  mockSend.mockReset();
  mockSend.mockResolvedValue({ data: { id: "email" }, error: null });
});

describe("requestDelivery", () => {
  itLocal("stores the school address and emails the professor a request-link approval", async () => {
    const { letterId, token } = await finalizedLetter();
    expect(await send(letterId, " Admissions@Test-University.edu ")).toEqual({ error: null });

    const link = await linkFor(letterId);
    expect(link).toMatchObject({ payment_status: "pending", recipient_email: "admissions@test-university.edu", token_hash: null });
    expect(link.recipient_email_hash).toBe(createHash("sha256").update("admissions@test-university.edu").digest("hex"));

    expect(mockSend).toHaveBeenCalledTimes(1);
    const [mail] = mockSend.mock.calls[0];
    expect(mail.to).toBe(PROF);
    expect(mail.html).toContain(`/r/${token}`);
    expect(mail.html).toContain("admissions@test-university.edu");
  });

  itLocal("refuses a second delivery to the same address, a bad address, and another student's letter", async () => {
    const { letterId } = await finalizedLetter();
    await send(letterId);
    expect((await send(letterId, "ADMISSIONS@test-university.edu")).error).toMatch(/already sent/);
    expect((await send(letterId, "not-an-email")).error).toMatch(/full admissions email/);

    const { requestDelivery } = await actions();
    mockUser = facultyUser;
    expect((await requestDelivery(letterId, { schoolName: "X", schoolEmail: "x@x.edu" })).error).toBe("Letter not found.");
  });

  itLocal("removes the delivery when the professor email fails", async () => {
    const { letterId } = await finalizedLetter();
    mockSend.mockResolvedValueOnce({ data: null, error: { name: "application_error", message: "down" } });
    expect((await send(letterId)).error).toMatch(/Email failed/);
    const { count } = await admin().from("delivery_links").select("id", { count: "exact", head: true }).eq("letter_id", letterId);
    expect(count).toBe(0);
  });
});

describe("approving and declining", () => {
  itLocal("approval by request link sends the school a view link and clears the stored address", async () => {
    const { approveDelivery } = await actions();
    const { letterId, token } = await finalizedLetter();
    await send(letterId);
    const { id } = await linkFor(letterId);
    mockSend.mockClear();

    expect(await approveDelivery(id, token)).toEqual({ error: null });
    const link = await linkFor(letterId);
    expect(link).toMatchObject({ payment_status: "paid", recipient_email: null });
    expect(link.token_hash).not.toBeNull();
    const hours = (new Date(link.expires_at as string).getTime() - Date.now()) / 3_600_000;
    expect(hours).toBeGreaterThan(47);
    expect(hours).toBeLessThanOrEqual(48);

    const [mail] = mockSend.mock.calls[0];
    expect(mail.to).toBe("admissions@test-university.edu");
    expect(mail.html).toContain("/view/");

    expect((await approveDelivery(id, token)).error).toBe("This delivery is not awaiting approval.");
  });

  itLocal("a link for another request cannot approve", async () => {
    const { approveDelivery } = await actions();
    const { letterId } = await finalizedLetter();
    const other = await finalizedLetter();
    await send(letterId);
    const { id } = await linkFor(letterId);
    expect((await approveDelivery(id, other.token)).error).toBe("Delivery not found or access denied.");
    expect((await linkFor(letterId)).payment_status).toBe("pending");
  });

  itLocal("a failed school email puts the delivery back to pending with its address", async () => {
    const { approveDelivery } = await actions();
    const { letterId, token } = await finalizedLetter();
    await send(letterId);
    const { id } = await linkFor(letterId);
    mockSend.mockResolvedValueOnce({ data: null, error: { name: "application_error", message: "down" } });

    expect((await approveDelivery(id, token)).error).toMatch(/could not be sent/);
    expect(await linkFor(letterId)).toMatchObject({
      payment_status: "pending",
      token_hash: null,
      expires_at: null,
      recipient_email: "admissions@test-university.edu",
    });
  });

  itLocal("a decline by request link closes the delivery and emails the student with no refund wording", async () => {
    const { rejectDelivery } = await actions();
    const { letterId, token } = await finalizedLetter();
    await send(letterId);
    const { id } = await linkFor(letterId);
    mockSend.mockClear();

    expect(await rejectDelivery(id, token)).toEqual({ error: null });
    expect(await linkFor(letterId)).toMatchObject({ payment_status: "rejected", recipient_email: null });
    const [mail] = mockSend.mock.calls[0];
    expect(mail.to).toBe(studentUser.email);
    expect(mail.html).toContain(PROF);
    expect(mail.html).not.toMatch(/refund/i);
  });

  itLocal("the professor's dashboard shows the address and approves by session", async () => {
    const { approveDelivery, getPendingDeliveries } = await actions();
    const { letterId } = await finalizedLetter();
    await send(letterId);
    const { id } = await linkFor(letterId);

    mockUser = facultyUser;
    const pending = await getPendingDeliveries();
    expect(pending.find((d) => d.deliveryLinkId === id)).toMatchObject({
      schoolName: "Test University",
      schoolEmail: "admissions@test-university.edu",
    });
    expect(await approveDelivery(id)).toEqual({ error: null });
  });

  itLocal("the first school open can be recorded as 'used'", async () => {
    const { letterId } = await finalizedLetter();
    const { error } = await admin()
      .from("delivery_links")
      .insert({ letter_id: letterId, recipient_email_hash: "x", payment_status: "used" });
    expect(error).toBeNull();
  });
});
