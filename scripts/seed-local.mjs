// Seeds the LOCAL Supabase stack with one student and one faculty account.
// Run after `npx supabase db reset`:  npm run seed:local
// The emails and password match the defaults in src/__tests__/integration/rls.test.ts.
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const key = process.env.SUPABASE_SECRET_KEY ?? "";

// Refuse to touch anything but a local stack.
if (!/^http:\/\/(127\.0\.0\.1|localhost):54321\/?$/.test(url)) {
  console.error(`Refusing to seed: NEXT_PUBLIC_SUPABASE_URL is not the local stack (${url || "unset"}).`);
  process.exit(1);
}

const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
const PASSWORD = "TestPassword1!";

const users = [
  {
    email: "student@test.local",
    meta: { role: "STUDENT", firstName: "Priya", lastName: "Sharma" },
    table: "students",
    // UG Year 2, started 90 days ago, so the year advances 275 days from now.
    row: {
      university: "Test University",
      program: "Computer Science",
      graduation_date: "2028-05-01",
      stage: "ug",
      study_year: 2,
      year_started_on: new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10),
    },
  },
  {
    email: "faculty@test.local",
    meta: { role: "FACULTY", firstName: "Alan", lastName: "Reyes" },
    table: "faculty",
    row: { institution: "Test University", title: "Professor", department: "Computer Science" },
  },
];

for (const u of users) {
  const { data, error } = await admin.auth.admin.createUser({
    email: u.email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: u.meta,
  });
  if (error) {
    // Re-running without a db reset leaves the users in place.
    console.log(`skip ${u.email}: ${error.message}`);
    continue;
  }
  const { error: rowError } = await admin.from(u.table).insert({ user_id: data.user.id, ...u.row });
  if (rowError) throw new Error(`${u.table} insert for ${u.email} failed: ${rowError.message}`);
  console.log(`created ${u.email} (${u.meta.role})`);
}
console.log(`Password for both accounts: ${PASSWORD}`);

// Catalog rows from BRD v2.0 §3, for local testing only. Production prices are
// entered in the admin screen. The BRD has no INR amounts, so they stay empty.
const { count: catalogCount, error: countError } = await admin
  .from("plan_catalog")
  .select("id", { count: "exact", head: true });
if (countError) throw new Error(`plan_catalog count failed: ${countError.message}`);
if (catalogCount) {
  console.log(`skip catalog: ${catalogCount} rows already exist`);
} else {
  const never = { expiry: "never", expiry_year: null };
  const toYear = (n) => ({ expiry: "end_of_year_n", expiry_year: n });
  const rows = [
    { stage: "hs", study_year: null, kind: "free_allocation", credits: 20, price_usd_cents: null, ...never },
    { stage: "hs", study_year: null, kind: "credits", credits: 1, price_usd_cents: 100, ...never },
    ...[1, 2, 3, 4].map((y) => ({
      stage: "ug", study_year: y, kind: "free_allocation", credits: 3, price_usd_cents: null,
      expiry: "end_of_year", expiry_year: null,
    })),
    ...[[1, 2000, 20], [2, 2500, 25], [3, 3000, 35], [4, 3500, 40], [5, 4000, 50]].map(([y, cents, credits]) => ({
      stage: "ug", study_year: y, kind: "membership", credits, price_usd_cents: cents, ...toYear(5),
    })),
    { stage: "ug", study_year: null, kind: "credits", credits: 1, price_usd_cents: 147, ...toYear(5) },
    { stage: "masters", study_year: 1, kind: "membership", credits: 45, price_usd_cents: 7000, ...toYear(2) },
    { stage: "masters", study_year: 2, kind: "membership", credits: 55, price_usd_cents: 9000, ...toYear(2) },
    { stage: "masters", study_year: null, kind: "credits", credits: 1, price_usd_cents: 199, ...toYear(2) },
    { stage: "phd", study_year: null, kind: "credits", credits: 1, price_usd_cents: 255, ...never },
    // BRD DEC-09: $259 for 100 costs more than 100 single credits. Owner to fix in admin.
    { stage: "phd", study_year: null, kind: "bundle", credits: 100, price_usd_cents: 25900, ...never },
  ];
  const { error: catalogError } = await admin.from("plan_catalog").insert(rows);
  if (catalogError) throw new Error(`plan_catalog insert failed: ${catalogError.message}`);
  console.log(`created ${rows.length} catalog rows`);
}
