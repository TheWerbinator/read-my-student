// Billing rules for memberships and credit purchases. Pure functions; the
// Stripe and database calls live in stripe-catalog.ts and stripe-billing.ts.

import type { CatalogRow } from "@/lib/catalog";
import { currentYear, grantExpiry, type CatalogItem, type StudentYear } from "@/lib/credits";

export type Currency = "usd" | "inr";

/** India visitors pay in INR when the item has an INR Price; everyone else, and any item without one, pays USD (owner, 2026-11-09). */
export function chooseCurrency(country: string | null, row: CatalogRow): Currency {
  return country === "IN" && row.stripe_price_inr ? "inr" : "usd";
}

export function priceFor(row: CatalogRow, currency: Currency): string | null {
  return (currency === "inr" ? row.stripe_price_inr : row.stripe_price_usd) ?? null;
}

const MAX_CREDITS_PER_PURCHASE = 100;

/** Whether the student may buy `quantity` of this item now. */
export function checkPurchase(
  row: CatalogRow,
  student: StudentYear,
  now: Date,
  opts: { quantity: number; hasActiveMembership: boolean; autoRenewConsent: boolean },
): { ok: true } | { ok: false; error: string } {
  if (!row.active || row.kind === "free_allocation" || !row.stripe_price_usd) {
    return { ok: false, error: "This item is not for sale." };
  }
  if (row.stage !== student.stage) return { ok: false, error: "This item is for a different stage." };

  const year = currentYear(student, now);
  if (row.study_year !== null && row.study_year !== year) {
    return { ok: false, error: `This item is for Year ${row.study_year}. You are in Year ${year ?? "unknown"}.` };
  }

  const many = row.kind === "credits";
  if (!Number.isInteger(opts.quantity) || opts.quantity < 1 || opts.quantity > (many ? MAX_CREDITS_PER_PURCHASE : 1)) {
    return { ok: false, error: many ? `Buy between 1 and ${MAX_CREDITS_PER_PURCHASE} credits.` : "Buy one at a time." };
  }

  if (row.kind === "membership") {
    if (opts.hasActiveMembership) return { ok: false, error: "You already have a membership." };
    // BRD PAY-05: explicit consent before recurring billing.
    if (!opts.autoRenewConsent) return { ok: false, error: "Agree to automatic yearly renewal to continue." };
  }
  return { ok: true };
}

// ─── Offer snapshot in Stripe Price metadata ─────────────────────────────────
// A new Price is created whenever the offer changes, so the metadata on the
// Price a student paid is exactly what they were sold.

export function offerMetadata(row: CatalogRow): Record<string, string> {
  return {
    catalog_id: row.id,
    stage: row.stage,
    study_year: row.study_year === null ? "" : String(row.study_year),
    kind: row.kind,
    credits: String(row.credits),
    expiry: row.expiry,
    expiry_year: row.expiry_year === null ? "" : String(row.expiry_year),
  };
}

const optionalInt = (text: string | undefined) => (text ? Number(text) : null);

export function offerFromMetadata(meta: Record<string, string> | null | undefined): CatalogItem | null {
  if (!meta?.catalog_id || !meta.kind || !meta.stage || !meta.expiry) return null;
  const credits = Number(meta.credits);
  if (!Number.isInteger(credits) || credits < 1) return null;
  return {
    id: meta.catalog_id,
    stage: meta.stage as CatalogItem["stage"],
    studyYear: optionalInt(meta.study_year),
    kind: meta.kind as CatalogItem["kind"],
    credits,
    expiry: meta.expiry as CatalogItem["expiry"],
    expiryYear: optionalInt(meta.expiry_year),
  };
}

/** The grant for a paid purchase: the offer's credits times the quantity bought. */
export function grantForPurchase(
  offer: CatalogItem,
  quantity: number,
  student: StudentYear,
  now: Date,
): { quantity: number; expiresAt: Date | null } {
  return { quantity: offer.credits * quantity, expiresAt: grantExpiry(offer, student, now) };
}

/** True when the fields that define what a buyer gets changed, so Stripe needs new Prices. */
export function offerChanged(before: CatalogRow | null, after: Omit<CatalogRow, "id">): boolean {
  if (!before) return true;
  const keys = [
    "stage",
    "study_year",
    "kind",
    "credits",
    "price_usd_cents",
    "price_inr_paise",
    "expiry",
    "expiry_year",
  ] as const;
  return keys.some((k) => before[k] !== after[k]);
}

/** The membership a renewal at `renewalAt` should charge, or null when the student has no next year (end the subscription). */
export function renewalRow(catalog: CatalogRow[], student: StudentYear, renewalAt: Date): CatalogRow | null {
  const year = currentYear(student, renewalAt);
  return (
    catalog.find(
      (r) => r.active && r.kind === "membership" && r.stage === student.stage && r.study_year === year,
    ) ?? null
  );
}
