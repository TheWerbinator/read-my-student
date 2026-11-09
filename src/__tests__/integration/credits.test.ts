/**
 * @jest-environment node
 *
 * Integration tests for the credit ledger: free grants, the consume_credit race,
 * one refund per request, the append-only rule and RLS. LOCAL Supabase stack only,
 * after `npx supabase migration up`:
 *
 *   NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321 SUPABASE_SECRET_KEY=<from supabase status> \
 *     NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<from supabase status> \
 *     npx jest src/__tests__/integration --testEnvironment=node
 *
 * Each test student is created and deleted here. Deleting the student cascades
 * to its grants and events.
 */

import { randomUUID } from "crypto";
import { createClient } from "@supabase/supabase-js";
import {
  ensureFreeGrants,
  loadWallet,
  refundCredit,
  spendCredit,
  type StudentRow,
} from "@/lib/credit-wallet";
import { balance } from "@/lib/credits";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const KEY = process.env.SUPABASE_SECRET_KEY ?? "";
const PUBLISHABLE = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
// Never run these writes against a hosted project.
const isLocal = /^http:\/\/(127\.0\.0\.1|localhost):54321\/?$/.test(URL);
const itLocal = isLocal && KEY ? it : it.skip;
const itLocalRls = isLocal && KEY && PUBLISHABLE ? it : it.skip;

const PASSWORD = "TestPassword1!";
const admin = () =>
  createClient(URL, KEY, { auth: { autoRefreshToken: false, persistSession: false } });

const userIds: string[] = [];
const studentIds: string[] = [];
const catalogIds: string[] = [];

async function makeStudent(row: Partial<StudentRow> = {}) {
  const db = admin();
  const email = `credits-${randomUUID()}@test.local`;
  const { data, error } = await db.auth.admin.createUser({ email, password: PASSWORD, email_confirm: true });
  if (error) throw error;
  userIds.push(data.user.id);
  const { data: student, error: studentError } = await db
    .from("students")
    .insert({ user_id: data.user.id, ...row })
    .select("id, stage, study_year, year_started_on")
    .single();
  if (studentError) throw studentError;
  studentIds.push(student.id as string);
  return { email, student: student as StudentRow };
}

async function makeRequest(studentId: string) {
  const id = randomUUID();
  const { error } = await admin()
    .from("letter_requests")
    .insert({ id, student_id: studentId, professor_email: "faculty@test.local", status: "requested" });
  if (error) throw error;
  return id;
}

async function grant(studentId: string, quantity: number) {
  const { data, error } = await admin()
    .from("credit_grants")
    .insert({ student_id: studentId, source: "adjustment", quantity, source_ref: `test:${randomUUID()}` })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

async function eventCount(requestId: string, type: string) {
  const { count } = await admin()
    .from("credit_events")
    .select("id", { count: "exact", head: true })
    .eq("request_id", requestId)
    .eq("type", type);
  return count;
}

afterAll(async () => {
  if (!isLocal || !KEY) return;
  const db = admin();
  if (studentIds.length) await db.from("students").delete().in("id", studentIds);
  if (catalogIds.length) await db.from("plan_catalog").delete().in("id", catalogIds);
  for (const id of userIds) await db.auth.admin.deleteUser(id);
});

describe("free grants", () => {
  itLocal("grants the current year's free credits once, however often it runs", async () => {
    const db = admin();
    // A test-only stage so the seeded catalog rows do not interfere.
    const { data: rows, error } = await db
      .from("plan_catalog")
      .insert([
        { stage: "masters", study_year: 1, kind: "free_allocation", credits: 7, expiry: "end_of_year" },
        { stage: "masters", study_year: 2, kind: "free_allocation", credits: 9, expiry: "end_of_year" },
      ])
      .select("id");
    if (error) throw error;
    catalogIds.push(...rows.map((r) => r.id as string));

    const { student } = await makeStudent({ stage: "masters", study_year: 1, year_started_on: "2026-08-01" });
    const now = new Date("2026-11-09T00:00:00Z");
    await ensureFreeGrants(db, student, now);
    await ensureFreeGrants(db, student, now);

    const { data: grants } = await db
      .from("credit_grants")
      .select("quantity, expires_at, source_ref")
      .eq("student_id", student.id);
    const free = (grants ?? []).filter((g) => (g.source_ref as string).startsWith("free:masters:"));
    expect(free).toHaveLength(1);
    expect(free[0]).toMatchObject({ quantity: 7, source_ref: `free:masters:y1:${student.id}` });
    expect(new Date(free[0].expires_at as string).toISOString()).toBe("2027-08-01T00:00:00.000Z");
  });
});

describe("spending and refunds", () => {
  itLocal("two requests racing for the last credit: exactly one wins", async () => {
    const db = admin();
    const { student } = await makeStudent();
    await grant(student.id, 1);
    const [a, b] = [await makeRequest(student.id), await makeRequest(student.id)];
    const now = new Date();

    const results = await Promise.all([spendCredit(db, student.id, a, now), spendCredit(db, student.id, b, now)]);
    expect(results.sort()).toEqual(["consumed", "no_credits"]);
    const { grants, events } = await loadWallet(db, student.id);
    expect(balance(grants, events, now)).toBe(0);
  });

  itLocal("spends the next grant when the first one runs out", async () => {
    const db = admin();
    const { student } = await makeStudent();
    await grant(student.id, 1);
    await grant(student.id, 1);
    const requests = await Promise.all([1, 2, 3].map(() => makeRequest(student.id)));
    const now = new Date();

    const results = await Promise.all(requests.map((r) => spendCredit(db, student.id, r, now)));
    expect(results.sort()).toEqual(["consumed", "consumed", "no_credits"]);
  });

  itLocal("one request spends one credit, even when sent twice", async () => {
    const db = admin();
    const { student } = await makeStudent();
    await grant(student.id, 5);
    const request = await makeRequest(student.id);
    const now = new Date();

    const results = await Promise.all([
      spendCredit(db, student.id, request, now),
      spendCredit(db, student.id, request, now),
    ]);
    expect(results.sort()).toEqual(["already", "consumed"]);
    expect(await eventCount(request, "consume")).toBe(1);
  });

  itLocal("refunds once when a decline and the sweep race", async () => {
    const db = admin();
    const { student } = await makeStudent();
    await grant(student.id, 1);
    const request = await makeRequest(student.id);
    const now = new Date();
    expect(await spendCredit(db, student.id, request, now)).toBe("consumed");

    const results = await Promise.all([refundCredit(db, request), refundCredit(db, request)]);
    expect(results.sort()).toEqual(["already", "refunded"]);
    expect(await eventCount(request, "refund")).toBe(1);
    const { grants, events } = await loadWallet(db, student.id);
    expect(balance(grants, events, now)).toBe(1);
  });

  itLocal("does not refund a request that spent nothing", async () => {
    const { student } = await makeStudent();
    expect(await refundCredit(admin(), await makeRequest(student.id))).toBe("not_spent");
  });

  itLocal("will not spend another student's grant", async () => {
    const { student: owner } = await makeStudent();
    const { student: other } = await makeStudent();
    const grantId = await grant(owner.id, 1);
    const { data } = await admin().rpc("consume_credit", {
      p_request_id: await makeRequest(other.id),
      p_grant_id: grantId,
    });
    expect(data).toBe("unavailable");
  });

  itLocal("keeps the ledger append-only, even for the server key", async () => {
    const db = admin();
    const { student } = await makeStudent();
    const grantId = await grant(student.id, 1);
    const del = await db.from("credit_grants").delete().eq("id", grantId);
    expect(del.error?.code).toBe("42501");
    const upd = await db.from("credit_grants").update({ quantity: 99 }).eq("id", grantId);
    expect(upd.error?.code).toBe("42501");
  });
});

describe("RLS for students", () => {
  itLocalRls("a student reads only their own ledger and cannot write it", async () => {
    const { email, student } = await makeStudent({ stage: "ug", study_year: 1, year_started_on: "2026-09-01" });
    const { student: other } = await makeStudent();
    await grant(student.id, 2);
    await grant(other.id, 3);

    const client = createClient(URL, PUBLISHABLE, { auth: { autoRefreshToken: false, persistSession: false } });
    const { error: signInError } = await client.auth.signInWithPassword({ email, password: PASSWORD });
    if (signInError) throw signInError;

    const { data: visible } = await client.from("credit_grants").select("student_id");
    expect(new Set((visible ?? []).map((g) => g.student_id))).toEqual(new Set([student.id]));

    const insert = await client
      .from("credit_grants")
      .insert({ student_id: student.id, source: "adjustment", quantity: 100, source_ref: `hack:${randomUUID()}` });
    expect(insert.error).not.toBeNull();

    const rpc = await client.rpc("consume_credit", { p_request_id: randomUUID(), p_grant_id: randomUUID() });
    expect(rpc.error?.code).toBe("42501");

    // Only an admin changes the year in school.
    const yearChange = await client.from("students").update({ study_year: 5 }).eq("id", student.id);
    expect(yearChange.error?.code).toBe("42501");
    const programChange = await client.from("students").update({ program: "Physics" }).eq("id", student.id);
    expect(programChange.error).toBeNull();
  });
});
