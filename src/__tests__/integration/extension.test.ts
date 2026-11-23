/**
 * @jest-environment node
 *
 * Integration tests for the browser extension API (plan Phase 5): the token
 * issued by the connect page, and the /api/extension/* routes that accept it.
 * Run against the LOCAL Supabase stack only, after `npx supabase db reset`
 * and `npm run seed:local` (see request-links.test.ts for the command).
 */

jest.mock("@/lib/stripe", () => ({ stripe: {} }));
// The logged-in user for the connect action.
let mockUser: { id: string } | null = null;
jest.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser: async () => ({ data: { user: mockUser } }) } }),
}));

import { randomUUID } from "crypto";
import { createClient } from "@supabase/supabase-js";
import { extensionProfessor, issueExtensionToken } from "@/lib/extension-auth";
import { connectExtension } from "@/app/(auth)/extension/connect/actions";
import { GET as summary } from "@/app/api/extension/summary/route";
import { GET as pdf } from "@/app/api/extension/letters/[id]/pdf/route";
import { DELETE as disconnect } from "@/app/api/extension/token/route";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const KEY = process.env.SUPABASE_SECRET_KEY ?? "";
// Never run these writes against a hosted project.
const isLocal = /^http:\/\/(127\.0\.0\.1|localhost):54321\/?$/.test(URL);
const itLocal = isLocal && KEY ? it : it.skip;

process.env.PDF_SIGNING_SECRET ??= "integration-test-secret-32-chars!!";

const admin = () =>
  createClient(URL, KEY, { auth: { autoRefreshToken: false, persistSession: false } });

const DAY = 24 * 60 * 60 * 1000;
let facultyUserId = "";
let facultyId = "";
let studentUserId = "";
let studentId = "";
let otherFacultyId = "";
const requestIds: string[] = [];
const letterIds: string[] = [];
const storagePath = `extension-test/${randomUUID()}.pdf`;

const withToken = (token: string | null) =>
  new Request("http://localhost/api/extension", token ? { headers: { authorization: `Bearer ${token}` } } : {});
const params = (id: string) => ({ params: Promise.resolve({ id }) });

async function insertRequest(faculty: string, status = "requested") {
  const id = randomUUID();
  const { error } = await admin()
    .from("letter_requests")
    .insert({ id, student_id: studentId, faculty_id: faculty, professor_email: "x@test.local", status });
  if (error) throw new Error(error.message);
  requestIds.push(id);
  return id;
}

async function insertLetter(faculty: string) {
  const requestId = await insertRequest(faculty, "completed");
  const { data, error } = await admin()
    .from("letters")
    .insert({
      request_id: requestId,
      faculty_id: faculty,
      student_id: studentId,
      status: "final",
      is_draft: false,
      storage_path: storagePath,
      finalized_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  letterIds.push(data.id as string);
  return data.id as string;
}

beforeAll(async () => {
  if (!isLocal || !KEY) return;
  const db = admin();
  const { data: users } = await db.auth.admin.listUsers({ perPage: 1000 });
  facultyUserId = users?.users.find((u) => u.email === "faculty@test.local")?.id ?? "";
  studentUserId = users?.users.find((u) => u.email === "student@test.local")?.id ?? "";
  const { data: f } = await db.from("faculty").select("id").eq("user_id", facultyUserId).maybeSingle();
  const { data: s } = await db.from("students").select("id").eq("user_id", studentUserId).maybeSingle();
  if (!f || !s) throw new Error("Seed the local stack first: npm run seed:local");
  facultyId = f.id as string;
  studentId = s.id as string;
  const { data: other, error } = await db
    .from("faculty")
    .insert({ email: `other-${randomUUID()}@test.local` })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  otherFacultyId = other.id as string;
  await db.storage.from("letters").upload(storagePath, Buffer.from("%PDF-1.4 test"), { contentType: "application/pdf" });
});

afterAll(async () => {
  if (!isLocal || !KEY) return;
  const db = admin();
  await db.from("letters").delete().in("id", letterIds);
  await db.from("letter_requests").delete().in("id", requestIds);
  await db.from("faculty").delete().eq("id", otherFacultyId);
  await db.from("extension_tokens").delete().in("user_id", [facultyUserId, studentUserId]);
  await db.storage.from("letters").remove([storagePath]);
});

describe("extension tokens", () => {
  itLocal("the connect action issues a token to a professor and refuses a student", async () => {
    mockUser = { id: facultyUserId };
    const issued = await connectExtension();
    expect(issued?.token).toEqual(expect.any(String));
    expect(await extensionProfessor(admin(), issued!.token)).toEqual({ userId: facultyUserId, facultyId });

    mockUser = { id: studentUserId };
    expect(await connectExtension()).toBeNull();
    mockUser = null;
    expect(await connectExtension()).toBeNull();
  });

  itLocal("an expired token and a non-professor token are refused", async () => {
    const old = await issueExtensionToken(admin(), facultyUserId, new Date(Date.now() - 31 * DAY));
    expect(await extensionProfessor(admin(), old.token)).toBeNull();
    const student = await issueExtensionToken(admin(), studentUserId);
    expect(await extensionProfessor(admin(), student.token)).toBeNull();
    expect(await extensionProfessor(admin(), "not-a-token")).toBeNull();
  });
});

describe("extension routes", () => {
  itLocal("the summary needs a token and returns the professor's profile, requests and letters", async () => {
    expect((await summary(withToken(null))).status).toBe(401);
    expect((await summary(withToken("not-a-token"))).status).toBe(401);

    const requestId = await insertRequest(facultyId);
    const letterId = await insertLetter(facultyId);
    const otherRequest = await insertRequest(otherFacultyId);
    const { token } = await issueExtensionToken(admin(), facultyUserId);

    const res = await summary(withToken(token));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.profile).toMatchObject({ name: "Alan Reyes", title: "Professor", institution: "Test University" });
    const mine = body.requests.find((r: { requestId: string }) => r.requestId === requestId);
    expect(mine).toMatchObject({ studentName: "Priya Sharma", writeUrl: expect.stringMatching(/\/r\/[\w-]+$/) });
    expect(body.requests.some((r: { requestId: string }) => r.requestId === otherRequest)).toBe(false);
    expect(body.letters.some((l: { letterId: string }) => l.letterId === letterId)).toBe(true);
  });

  itLocal("the PDF download works for the professor's own letter only", async () => {
    const mine = await insertLetter(facultyId);
    const theirs = await insertLetter(otherFacultyId);
    const { token } = await issueExtensionToken(admin(), facultyUserId);

    expect((await pdf(withToken(null), params(mine))).status).toBe(401);
    const ok = await pdf(withToken(token), params(mine));
    expect(ok.status).toBe(200);
    expect(ok.headers.get("content-type")).toBe("application/pdf");
    expect(ok.headers.get("content-disposition")).toMatch(/^attachment; filename="recommendation-letter-\d{4}-\d{2}-\d{2}\.pdf"$/);
    expect(Buffer.from(await ok.arrayBuffer()).toString()).toBe("%PDF-1.4 test");

    expect((await pdf(withToken(token), params(theirs))).status).toBe(404);
    expect((await pdf(withToken(token), params("not-a-uuid"))).status).toBe(404);
  });

  itLocal("disconnect deletes the token", async () => {
    const { token } = await issueExtensionToken(admin(), facultyUserId);
    expect((await summary(withToken(token))).status).toBe(200);
    expect((await disconnect(withToken(token))).status).toBe(204);
    expect((await summary(withToken(token))).status).toBe(401);
  });
});
