/**
 * @jest-environment node
 *
 * Integration tests for the admin catalog: saves write a change record, the
 * record is append-only, and logged-in users cannot see who is an admin.
 * LOCAL Supabase stack only, after `npx supabase migration up`:
 *
 *   NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321 SUPABASE_SECRET_KEY=<from supabase status> \
 *     NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<from supabase status> \
 *     npx jest src/__tests__/integration --testEnvironment=node
 *
 * The catalog rows it creates are deleted afterwards. Their change records stay,
 * because the log is append-only and has no foreign key.
 */

import { randomUUID } from "crypto";
import { createClient } from "@supabase/supabase-js";
import { saveCatalogItem } from "@/lib/admin";
import type { CatalogInput } from "@/lib/catalog";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const KEY = process.env.SUPABASE_SECRET_KEY ?? "";
const PUBLISHABLE = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
// Never run these writes against a hosted project.
const isLocal = /^http:\/\/(127\.0\.0\.1|localhost):54321\/?$/.test(URL);
const itLocal = isLocal && KEY ? it : it.skip;
const itLocalRls = isLocal && KEY && PUBLISHABLE ? it : it.skip;

const admin = () =>
  createClient(URL, KEY, { auth: { autoRefreshToken: false, persistSession: false } });

const userIds: string[] = [];
const catalogIds: string[] = [];
afterAll(async () => {
  if (!isLocal || !KEY) return;
  if (catalogIds.length) await admin().from("plan_catalog").delete().in("id", catalogIds);
  for (const id of userIds) await admin().auth.admin.deleteUser(id);
});

const item: CatalogInput = {
  stage: "phd",
  study_year: null,
  kind: "credits",
  credits: 1,
  price_usd_cents: 255,
  price_inr_paise: null,
  expiry: "never",
  expiry_year: null,
  active: false,
};

describe("catalog saves", () => {
  itLocal("records who changed what, with before and after values", async () => {
    const db = admin();
    const adminUserId = randomUUID();
    const created = await saveCatalogItem(db, adminUserId, null, item);
    catalogIds.push(created.id);
    const updated = await saveCatalogItem(db, adminUserId, created.id, { ...item, price_inr_paise: 21900 });
    expect(updated.price_inr_paise).toBe(21900);

    const { data: log } = await db
      .from("catalog_changes")
      .select("admin_user_id, before, after")
      .eq("catalog_id", created.id)
      .order("created_at");
    expect(log).toHaveLength(2);
    expect(log![0]).toMatchObject({ admin_user_id: adminUserId, before: null, after: { price_inr_paise: null } });
    expect(log![1]).toMatchObject({ before: { price_inr_paise: null }, after: { price_inr_paise: 21900 } });

    const del = await db.from("catalog_changes").delete().eq("catalog_id", created.id);
    expect(del.error?.code).toBe("42501");
  });

  itLocal("refuses to update a row that does not exist", async () => {
    await expect(saveCatalogItem(admin(), randomUUID(), randomUUID(), item)).rejects.toThrow("does not exist");
  });
});

describe("admins table", () => {
  itLocalRls("is invisible to a logged-in user, even an admin", async () => {
    const db = admin();
    const email = `admin-${randomUUID()}@test.local`;
    const { data, error } = await db.auth.admin.createUser({ email, password: "TestPassword1!", email_confirm: true });
    if (error) throw error;
    userIds.push(data.user.id);
    const { error: insertError } = await db.from("admins").insert({ user_id: data.user.id });
    if (insertError) throw insertError;

    const client = createClient(URL, PUBLISHABLE, { auth: { autoRefreshToken: false, persistSession: false } });
    await client.auth.signInWithPassword({ email, password: "TestPassword1!" });
    const read = await client.from("admins").select("user_id");
    expect(read.error?.code).toBe("42501");
    const grant = await client.from("admins").insert({ user_id: randomUUID() });
    expect(grant.error?.code).toBe("42501");
    const log = await client.from("catalog_changes").select("id");
    expect(log.error?.code).toBe("42501");
  });
});
