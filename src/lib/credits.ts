// Credit wallet math. Grants are immutable; every change is a signed ledger event
// (consume -1, refund +1, adjust +/-n) against one grant (BRD 5.2). Expiry is a
// date on the grant, so balance() simply ignores expired grants.

export type CreditGrant = {
  id: string;
  quantity: number;
  expiresAt: Date | null; // null = never expires
};

export type CreditEvent = {
  grantId: string;
  type: "consume" | "refund" | "adjust";
  delta: number;
};

export function remaining(grant: CreditGrant, events: CreditEvent[]): number {
  return events
    .filter((e) => e.grantId === grant.id)
    .reduce((sum, e) => sum + e.delta, grant.quantity);
}

/** Grants that can pay for a request now, soonest-expiring first. */
export function usableGrants(
  grants: CreditGrant[],
  events: CreditEvent[],
  now: Date,
): CreditGrant[] {
  return grants
    .filter((g) => (g.expiresAt === null || g.expiresAt > now) && remaining(g, events) > 0)
    .sort(
      (a, b) =>
        (a.expiresAt?.getTime() ?? Infinity) - (b.expiresAt?.getTime() ?? Infinity),
    );
}

export function balance(grants: CreditGrant[], events: CreditEvent[], now: Date): number {
  return usableGrants(grants, events, now).reduce((sum, g) => sum + remaining(g, events), 0);
}

/** The grant the next request should spend from, or null when the wallet is empty. */
export function pickGrant(
  grants: CreditGrant[],
  events: CreditEvent[],
  now: Date,
): CreditGrant | null {
  return usableGrants(grants, events, now)[0] ?? null;
}

// ─── Year in school ───────────────────────────────────────────────────────────
// The student picks a year at signup (studyYear, on yearStartedOn). The year
// advances by one on each 12-month anniversary of that date (owner, 2026-11-09).

export type Stage = "hs" | "ug" | "masters" | "phd";

export type StudentYear = {
  stage: Stage | null;
  studyYear: number | null;
  yearStartedOn: Date | null;
};

// A Feb 29 start date rolls to Mar 1 in non-leap years (Date.setUTCFullYear).
function addYears(date: Date, years: number): Date {
  const d = new Date(date);
  d.setUTCFullYear(d.getUTCFullYear() + years);
  return d;
}

/** The student's year in school at `now`, or null when they have no year (HS, PhD). */
export function currentYear(s: StudentYear, now: Date): number | null {
  if (s.studyYear === null || s.yearStartedOn === null) return null;
  let elapsed = now.getUTCFullYear() - s.yearStartedOn.getUTCFullYear();
  if (addYears(s.yearStartedOn, elapsed) > now) elapsed -= 1;
  return s.studyYear + Math.max(elapsed, 0);
}

/** The moment year `n` ends: the anniversary on which year n + 1 starts. */
export function endOfYear(s: StudentYear, n: number): Date | null {
  if (s.studyYear === null || s.yearStartedOn === null) return null;
  return addYears(s.yearStartedOn, n - s.studyYear + 1);
}

// ─── Catalog rules ────────────────────────────────────────────────────────────

export type CatalogItem = {
  id: string;
  stage: Stage;
  studyYear: number | null;
  kind: "membership" | "credits" | "bundle" | "free_allocation";
  credits: number;
  expiry: "never" | "end_of_year" | "end_of_year_n";
  expiryYear: number | null;
};

/**
 * When a grant made now from `item` expires (null = never). Throws when the rule
 * needs a year in school and the student has none, because that is a catalog
 * mistake (HS and PhD rows must use "never").
 */
export function grantExpiry(item: CatalogItem, s: StudentYear, now: Date): Date | null {
  if (item.expiry === "never") return null;
  const thisYear = currentYear(s, now);
  let year = item.expiry === "end_of_year" ? thisYear : item.expiryYear;
  // Credits that arrive after Year N (a "Year 5+" renewal) last until the end of that year (owner, 2026-11-10).
  if (year !== null && thisYear !== null && thisYear > year) year = thisYear;
  const end = year === null ? null : endOfYear(s, year);
  if (end === null) {
    throw new Error(`Catalog item ${item.id} needs a year in school, and the student has none.`);
  }
  return end;
}

/** Free allocations the student is due now: their stage, and their current year if the row has one. */
export function dueFreeAllocations(catalog: CatalogItem[], s: StudentYear, now: Date): CatalogItem[] {
  const year = currentYear(s, now);
  return catalog.filter(
    (item) =>
      item.kind === "free_allocation" &&
      item.stage === s.stage &&
      (item.studyYear === null || item.studyYear === year),
  );
}

/**
 * Idempotency key for a free grant. It names the stage and year, not the catalog
 * row, so an admin who replaces a row cannot cause a second grant. HS rows have
 * no year, so the key (y0) makes the HS allocation once per account.
 */
export function freeGrantRef(item: CatalogItem, studentId: string): string {
  return `free:${item.stage}:y${item.studyYear ?? 0}:${studentId}`;
}
