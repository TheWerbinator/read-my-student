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

/** The year's free credits, which a student gets with or without the membership (DEC-04). */
function freeNote(row: CatalogRow, when: "that year" | "each year" = "that year"): string {
  if (row.free_credits <= 0) return "";
  const n = row.free_credits === 1 ? "1 free credit" : `${row.free_credits} free credits`;
  return ` Plus ${n} ${when}, with or without a membership, which last until the end of that school year.`;
}

/** One line of the public pricing page, in the visitor's currency. Null for items that are not on sale. */
export function pricingRow(row: CatalogRow, country: string | null): PricingRow | null {
  if (!row.active) return null;
  const credits = row.credits === 1 ? "1 credit" : `${row.credits} credits`;
  if (row.kind === "free_allocation") {
    return {
      id: row.id,
      // HS free credits renew each year from signup (owner, 2026-11-11).
      label: row.study_year ? `Year ${row.study_year}, free` : row.stage === "hs" ? "Free every year" : "Free on signup",
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
    return { id: row.id, label: `Year ${row.study_year} membership`, detail: `${credits} a year. ${expiryNote(row)}${freeNote(row)}`, price: `${amount} a year`, free: false };
  }
  if (row.kind === "bundle") {
    return { id: row.id, label: `Pack of ${row.credits}`, detail: expiryNote(row), price: amount, free: false };
  }
  if (row.members_only) {
    return { id: row.id, label: "Extra credit for members", detail: `For students with a membership. ${expiryNote(row)}`, price: `${amount} each`, free: false };
  }
  return { id: row.id, label: "Pay as you go", detail: `No membership needed. Buy only the credits you use. ${expiryNote(row)}`, price: `${amount} each`, free: false };
}

/**
 * The pricing lines for one stage, with the last membership year marked "+"
 * because it also covers every later year.
 */
export function pricingRows(rows: CatalogRow[], country: string | null): PricingRow[] {
  const lastYear = rows.length ? lastMembershipYear(rows, rows[0].stage) : null;
  const out: PricingRow[] = [];
  for (const row of rows) {
    const line = pricingRow(row, country);
    if (!line) continue;
    if (row.kind === "membership" && row.study_year !== null && row.study_year === lastYear) {
      const credits = row.credits === 1 ? "1 credit" : `${row.credits} credits`;
      const expiry =
        row.expiry === "end_of_year_n"
          ? `Credits last until the end of Year ${row.expiry_year} or the end of the year they arrive in, whichever is later.`
          : expiryNote(row);
      line.label = `Year ${lastYear}+ membership`;
      line.detail = `${credits} a year, at this price every year from Year ${lastYear} on. ${expiry}${freeNote(row, "each year")}`;
    }
    out.push(line);
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
  opts: {
    quantity: number;
    hasActiveMembership: boolean;
    autoRenewConsent: boolean;
    /** From lastMembershipYear: lets a student past that year buy its membership. */
    lastMembershipYear?: number | null;
  },
): { ok: true } | { ok: false; error: string } {
  if (!row.active || row.kind === "free_allocation" || !row.stripe_price_usd) {
    return { ok: false, error: "This item is not for sale." };
  }
  if (row.stage !== student.stage) return { ok: false, error: "This item is for a different stage." };
  if (row.members_only && !opts.hasActiveMembership) {
    return { ok: false, error: "Extra credits are for members. Pay-as-you-go credits need no membership." };
  }

  const year = currentYear(student, now);
  const lastYear = row.kind === "membership" ? (opts.lastMembershipYear ?? null) : null;
  if (row.study_year !== null && !membershipCovers(row, year, lastYear)) {
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

/** The highest year with an active membership for this stage. Its membership also covers every later year ("Year 5+"). */
export function lastMembershipYear(catalog: CatalogRow[], stage: CatalogRow["stage"]): number | null {
  const years = catalog
    .filter((r) => r.active && r.kind === "membership" && r.stage === stage && r.study_year !== null)
    .map((r) => r.study_year as number);
  return years.length ? Math.max(...years) : null;
}

/** Whether a membership for `row.study_year` is the one for a student in `year`. */
function membershipCovers(row: CatalogRow, year: number | null, lastYear: number | null): boolean {
  return row.study_year === year || (year !== null && lastYear !== null && row.study_year === lastYear && year > lastYear);
}

/**
 * The free credits for the student's current year, from the membership row that
 * covers it, as a grantable item. Null when that year has none. Its studyYear is
 * the student's year, so the grant key stays one per year even under "Year 5+".
 */
export function yearlyFreeAllocation(catalog: CatalogRow[], student: StudentYear, now: Date): CatalogItem | null {
  const row = renewalRow(catalog, student, now);
  const year = currentYear(student, now);
  if (!row || row.free_credits <= 0 || year === null) return null;
  return { id: row.id, stage: row.stage, studyYear: year, kind: "free_allocation", credits: row.free_credits, expiry: "end_of_year", expiryYear: null };
}

/** The membership for the student's year on `renewalAt`, or null when the stage has none for that year (a renewal then ends the subscription). */
export function renewalRow(catalog: CatalogRow[], student: StudentYear, renewalAt: Date): CatalogRow | null {
  const year = currentYear(student, renewalAt);
  const lastYear = student.stage ? lastMembershipYear(catalog, student.stage) : null;
  return (
    catalog.find(
      (r) => r.active && r.kind === "membership" && r.stage === student.stage && membershipCovers(r, year, lastYear),
    ) ?? null
  );
}
