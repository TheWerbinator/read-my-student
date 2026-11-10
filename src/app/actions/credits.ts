"use server";

import { headers } from "next/headers";
import { adminDb } from "@/lib/admin";
import { LIVE_STATUSES, checkPurchase, chooseCurrency } from "@/lib/billing";
import { CATALOG_COLUMNS, formatMoney, type CatalogRow } from "@/lib/catalog";
import { ensureFreeGrants, loadWallet, studentYear, type StudentRow } from "@/lib/credit-wallet";
import { balance, currentYear, remaining, type Stage } from "@/lib/credits";
import { createClient } from "@/lib/supabase/server";

export type WalletGrant = {
  id: string;
  source: string;
  quantity: number;
  left: number;
  createdAt: string;
  expiresAt: string | null;
  expired: boolean;
};

export type ForSale = {
  id: string;
  kind: CatalogRow["kind"];
  credits: number;
  studyYear: number | null;
  price: string;
};

export type Wallet =
  | { status: "no_stage" }
  | {
      status: "ok";
      stage: Stage;
      year: number | null;
      balance: number;
      grants: WalletGrant[];
      forSale: ForSale[];
      hasMembership: boolean;
    };

/**
 * The signed-in student's balance, grant history (BRD 5.3) and what they can
 * buy now. Adds any free credits they are due first. Null for non-students.
 */
export async function getWallet(): Promise<Wallet | null> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;

  const db = adminDb();
  const { data: student, error } = await db
    .from("students")
    .select("id, stage, study_year, year_started_on")
    .eq("user_id", auth.user.id)
    .maybeSingle();
  if (error) throw error;
  if (!student) return null;
  // Students from before signup asked for it: an admin sets it (owner, 2026-11-09).
  if (!student.stage) return { status: "no_stage" };

  const row = student as StudentRow;
  const year = studentYear(row);
  const now = new Date();
  await ensureFreeGrants(db, row, now);

  const [wallet, grantRows, catalogRows, subs] = await Promise.all([
    loadWallet(db, row.id),
    db
      .from("credit_grants")
      .select("id, source, quantity, expires_at, created_at")
      .eq("student_id", row.id)
      .order("created_at", { ascending: false }),
    db.from("plan_catalog").select(CATALOG_COLUMNS).eq("stage", row.stage).eq("active", true),
    db
      .from("subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("student_id", row.id)
      .in("status", LIVE_STATUSES),
  ]);
  for (const r of [grantRows, catalogRows, subs]) if (r.error) throw r.error;

  const grants = (grantRows.data ?? []).map((g) => {
    const expiresAt = (g.expires_at as string | null) ?? null;
    return {
      id: g.id as string,
      source: g.source as string,
      quantity: g.quantity as number,
      left: remaining({ id: g.id as string, quantity: g.quantity as number, expiresAt: null }, wallet.events),
      createdAt: g.created_at as string,
      expiresAt,
      expired: expiresAt !== null && new Date(expiresAt) <= now,
    };
  });

  const hasMembership = (subs.count ?? 0) > 0;
  const country = (await headers()).get("x-vercel-ip-country");
  const forSale = ((catalogRows.data ?? []) as CatalogRow[])
    .filter(
      (r) =>
        checkPurchase(r, year, now, { quantity: 1, hasActiveMembership: hasMembership, autoRenewConsent: true }).ok,
    )
    .map((r) => {
      const inr = chooseCurrency(country, r) === "inr";
      return {
        id: r.id,
        kind: r.kind,
        credits: r.credits,
        studyYear: r.study_year,
        price: formatMoney(inr ? r.price_inr_paise : r.price_usd_cents, inr ? "INR" : "USD") ?? "",
      };
    });

  return {
    status: "ok",
    stage: row.stage as Stage,
    year: currentYear(year, now),
    balance: balance(wallet.grants, wallet.events, now),
    grants,
    forSale,
    hasMembership,
  };
}
