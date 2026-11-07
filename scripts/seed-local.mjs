// Seeds the LOCAL Supabase stack with one student and one faculty account.
// Run after `npx supabase db reset`:  npm run seed:local
// The emails and password match the defaults in src/__tests__/integration/rls.test.ts.
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

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
    row: { university: "Test University", program: "Computer Science", graduation_date: "2028-05-01" },
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
