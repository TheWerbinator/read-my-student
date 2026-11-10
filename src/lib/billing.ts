// Billing rules for memberships and credit purchases. Pure functions; the
// Stripe and database calls live in stripe-catalog.ts and stripe-billing.ts.

import { formatMoney, type CatalogRow } from "@/lib/catalog";
import { currentYear, grantExpiry, type CatalogItem, type StudentYear } from "@/lib/credits";

export type Currency = "usd" | "inr";

/** India visitors pay in INR when the item has an INR Price; everyone else, and any item without one, pays USD (owner, 2026-11-09). */
export function chooseCurrency(country: string | null, row: CatalogRow): Currency {
  return country === "IN" && row.stripe_price_inr ? "inr" : "usd";
}

export function priceFor(row: CatalogRow, currency: Currency): string | null {
  return (currency === "inr" ? row.stripe_price_inr : row.stripe_price_usd) ?? null;
}

export type PricingRow = { id: string; label: string; detail: string; price: string; free: boolean };

function expiryNote(row: CatalogRow): string {
  if (row.expiry === "never") return "Credits never expire.";
  if (row.expiry === "end_of_year_n") return `Credits last until the end of Year ${row.expiry_year}.`;
  return "Credits last until the end of that school year.";
}

/** One line of the public pricing page, in the visitor's currency. Null for items that are not on sale. */
export function pricingRow(row: CatalogRow, country: string | null): PricingRow | null {
  if (!row.active) return null;
  const credits = row.credits === 1 ? "1 credit" : `${row.credits} credits`;
  if (row.kind === "free_allocation") {
    return {
      id: row.id,
      label: row.study_year ? `Year ${row.study_year}, free` : "Free on signup",
      detail: `${credits}. ${expiryNote(row)}`,
      price: "Free",
      free: true,
    };
  }
  // Only items that can be bought: the same rule as checkPurchase.
  if (!row.stripe_price_usd) return null;
  const inr = chooseCurrency(country, row) === "inr";
  const amount = formatMoney(inr ? row.price_inr_paise : row.price_usd_cents, inr ? "INR" : "USD");
  if (!amount) return null;
  if (row.kind === "membership") {
    return { id: row.id, label: `Year ${row.study_year} membership`, detail: `${credits} a year. ${expiryNote(row)}`, price: `${amount} a year`, free: false };
  }
  if (row.kind === "bundle") {
    return { id: row.id, label: `Pack of ${row.credits}`, detail: expiryNote(row), price: amount, free: false };
  }
  return { id: row.id, label: "Extra credit", detail: expiryNote(row), price: `${amount} each`, free: false };
}

/**
 * The pricing lines for one stage, with yearly free allocations that give the
 * same credits merged into one line ("Years 1 to 4, free"). Expects rows sorted
 * by year, as the pricing page sorts them.
 */
export function pricingRows(rows: CatalogRow[], country: string | null): PricingRow[] {
  const out: PricingRow[] = [];
  const groups = new Map<string, { line: PricingRow; row: CatalogRow; years: number[] }>();
  for (const row of rows) {
    const line = pricingRow(row, country);
    if (!line) continue;
    if (row.kind !== "free_allocation" || !row.study_year) {
      out.push(line);
      continue;
    }
    const key = `${row.credits}:${row.expiry}:${row.expiry_year}`;
    const group = groups.get(key);
    if (group) {
      group.years.push(row.study_year);
      continue;
    }
    groups.set(key, { line, row, years: [row.study_year] });
    out.push(line);
  }
  for (const { line, row, years } of groups.values()) {
    if (years.length < 2) continue;
    const first = years[0];
    const last = years[years.length - 1];
    line.label = last - first === years.length - 1 ? `Years ${first} to ${last}, free` : `Years ${years.join(", ")}, free`;
    line.detail = `${row.credits === 1 ? "1 credit" : `${row.credits} credits`} each school year. ${expiryNote(row)}`;
  }
  return out;
}

const MAX_CREDITS_PER_PURCHASE = 100;

/** Subscription statuses that still count as having a membership. */
export const LIVE_STATUSES = ["active", "trialing", "past_due", "unpaid"];

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
