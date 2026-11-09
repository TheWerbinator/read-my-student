// Admin access and catalog writes. Every admin page and server action calls
// requireAdmin() itself, because a server action is a public endpoint.

import { createClient as createAdminClient, type SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type { CatalogInput, CatalogRow } from "@/lib/catalog";

export function adminDb(): SupabaseClient {
  return createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/** The signed-in user's id if they are an admin, otherwise null. */
export async function requireAdmin(): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) return null;

  const { data: row, error } = await adminDb()
    .from("admins")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return row ? userId : null;
}

const COLUMNS =
  "id, stage, study_year, kind, credits, price_usd_cents, price_inr_paise, expiry, expiry_year, active";

export async function listCatalog(db: SupabaseClient): Promise<CatalogRow[]> {
  const { data, error } = await db
    .from("plan_catalog")
    .select(COLUMNS)
    .order("stage")
    .order("kind")
    .order("study_year", { nullsFirst: true });
  if (error) throw error;
  return (data ?? []) as CatalogRow[];
}

/**
 * Creates (id null) or updates a catalog row, then records the change in
 * catalog_changes. shortcut: the two writes are not one transaction, so a failed
 * log insert leaves the edit saved without its record; the caller reports the
 * error. Move both into one SQL function if that ever happens in practice.
 */
export async function saveCatalogItem(
  db: SupabaseClient,
  adminUserId: string,
  id: string | null,
  row: CatalogInput,
): Promise<CatalogRow> {
  let before: CatalogRow | null = null;
  if (id) {
    const { data, error } = await db.from("plan_catalog").select(COLUMNS).eq("id", id).maybeSingle();
    if (error) throw error;
    if (!data) throw new Error(`Catalog row ${id} does not exist.`);
    before = data as CatalogRow;
  }

  const query = id
    ? db.from("plan_catalog").update(row).eq("id", id)
    : db.from("plan_catalog").insert(row);
  const { data: saved, error: saveError } = await query.select(COLUMNS).single();
  if (saveError) throw saveError;

  const { error: logError } = await db.from("catalog_changes").insert({
    catalog_id: saved.id,
    admin_user_id: adminUserId,
    before,
    after: saved,
  });
  if (logError) throw logError;
  return saved as CatalogRow;
}
