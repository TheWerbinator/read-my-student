// Admin access and catalog writes. Every admin page and server action calls
// requireAdmin() itself, because a server action is a public endpoint.

import { randomUUID } from "crypto";
import { createClient as createAdminClient, type SupabaseClient } from "@supabase/supabase-js";
import { offerChanged } from "@/lib/billing";
import { createClient } from "@/lib/supabase/server";
import { CATALOG_COLUMNS, type CatalogInput, type CatalogRow } from "@/lib/catalog";
import type { PriceSync, StripeIds } from "@/lib/stripe-catalog";

export function adminDb(): SupabaseClient {
  return createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * The signed-in admin, and whether this login passed the authenticator-app step
 * (`aal2` in the token, https://supabase.com/docs/guides/auth/jwt-fields).
 * Null when the user is not an admin.
 */
export async function adminSession(): Promise<{ userId: string; mfa: boolean } | null> {
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
  return row ? { userId, mfa: data?.claims?.aal === "aal2" } : null;
}

/** The signed-in user's id if they are an admin who passed MFA this login (BRD §12.1), otherwise null. */
export async function requireAdmin(): Promise<string | null> {
  const session = await adminSession();
  return session?.mfa ? session.userId : null;
}

const COLUMNS = CATALOG_COLUMNS;

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
 * catalog_changes. With `prices`, a paid item whose offer changed (or that has
 * no Stripe Price yet) first gets fresh Stripe Prices, and the replaced ones are
 * archived after the save. A Stripe failure stops the save before the database
 * changes. shortcut: the row write and the log insert are not one transaction,
 * so a failed log insert leaves the edit saved without its record; the caller
 * reports the error. Move both into one SQL function if that ever happens.
 */
export async function saveCatalogItem(
  db: SupabaseClient,
  adminUserId: string,
  id: string | null,
  row: CatalogInput,
  prices?: PriceSync,
): Promise<CatalogRow> {
  let before: CatalogRow | null = null;
  if (id) {
    const { data, error } = await db.from("plan_catalog").select(COLUMNS).eq("id", id).maybeSingle();
    if (error) throw error;
    if (!data) throw new Error(`Catalog row ${id} does not exist.`);
    before = data as CatalogRow;
  }

  // The id is chosen here so a new row's Stripe Prices can name it in their metadata.
  const rowId = id ?? randomUUID();
  let stripe: Partial<StripeIds> = {};
  const missingPrice =
    (row.price_usd_cents !== null && !before?.stripe_price_usd) ||
    (row.price_inr_paise !== null && !before?.stripe_price_inr);
  if (prices && row.kind !== "free_allocation" && (offerChanged(before, row) || missingPrice)) {
    stripe = await prices.create({ ...before, ...row, id: rowId });
  }

  const query = id
    ? db.from("plan_catalog").update({ ...row, ...stripe }).eq("id", id)
    : db.from("plan_catalog").insert({ ...row, ...stripe, id: rowId });
  const { data: saved, error: saveError } = await query.select(COLUMNS).single();
  if (saveError) throw saveError;

  const { error: logError } = await db.from("catalog_changes").insert({
    catalog_id: saved.id,
    admin_user_id: adminUserId,
    before,
    after: saved,
  });
  if (logError) throw logError;

  if (prices && before) {
    const replaced = [before.stripe_price_usd, before.stripe_price_inr].filter(
      (p): p is string => !!p && p !== saved.stripe_price_usd && p !== saved.stripe_price_inr,
    );
    if (replaced.length) await prices.archive(replaced);
  }
  return saved as CatalogRow;
}
