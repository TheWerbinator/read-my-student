/**
 * @jest-environment node
 *
 * Unit tests for the credit wallet math. Pure functions, no database.
 */

import {
  balance,
  currentYear,
  dueFreeAllocations,
  endOfYear,
  freeGrantRef,
  grantExpiry,
  pickGrant,
  remaining,
  type CatalogItem,
  type CreditEvent,
  type CreditGrant,
  type StudentYear,
} from "@/lib/credits";

const now = new Date("2027-01-15T00:00:00Z");
const grant = (id: string, quantity: number, expiresAt: string | null): CreditGrant => ({
  id,
  quantity,
  expiresAt: expiresAt ? new Date(expiresAt) : null,
});

describe("credit wallet", () => {
  const free = grant("ug-free-y1", 3, "2027-06-30T00:00:00Z");
  const paid = grant("ug-paid-y1", 20, "2031-06-30T00:00:00Z");
  const topup = grant("topup", 5, null);

  it("spends the soonest-expiring grant first, never-expiring last", () => {
    expect(pickGrant([topup, paid, free], [], now)?.id).toBe("ug-free-y1");
  });

  it("moves to the next grant when one is used up", () => {
    const events: CreditEvent[] = [1, 2, 3].map(() => ({
      grantId: "ug-free-y1",
      type: "consume",
      delta: -1,
    }));
    expect(remaining(free, events)).toBe(0);
    expect(pickGrant([free, paid], events, now)?.id).toBe("ug-paid-y1");
  });

  it("ignores expired grants in balance and selection", () => {
    const later = new Date("2027-07-01T00:00:00Z");
    expect(balance([free, paid], [], later)).toBe(20);
    expect(pickGrant([free], [], later)).toBeNull();
  });

  it("restores a credit when a declined request is refunded", () => {
    const events: CreditEvent[] = [
      { grantId: "ug-paid-y1", type: "consume", delta: -1 },
      { grantId: "ug-paid-y1", type: "refund", delta: 1 },
    ];
    expect(balance([paid], events, now)).toBe(20);
  });

  it("sums every usable grant", () => {
    expect(balance([free, paid, topup], [], now)).toBe(28);
  });

  it("returns null for an empty wallet", () => {
    expect(pickGrant([], [], now)).toBeNull();
  });
});

const d = (iso: string) => new Date(`${iso}T00:00:00Z`);
const ug2: StudentYear = { stage: "ug", studyYear: 2, yearStartedOn: d("2026-09-01") };
const hs: StudentYear = { stage: "hs", studyYear: null, yearStartedOn: null };

const item = (over: Partial<CatalogItem>): CatalogItem => ({
  id: "row",
  stage: "ug",
  studyYear: null,
  kind: "membership",
  credits: 20,
  expiry: "never",
  expiryYear: null,
  ...over,
});
const hsFree = item({ id: "hs-free", stage: "hs", kind: "free_allocation", credits: 20 });
const ugFree = (year: number) =>
  item({ id: `ug-free-${year}`, kind: "free_allocation", credits: 3, studyYear: year, expiry: "end_of_year" });
const ugPaid = (year: number, credits: number) =>
  item({ id: `ug-paid-${year}`, studyYear: year, credits, expiry: "end_of_year_n", expiryYear: 5 });

describe("year in school", () => {
  it("advances on each anniversary of the start date", () => {
    expect(currentYear(ug2, d("2026-09-01"))).toBe(2);
    expect(currentYear(ug2, new Date("2027-08-31T23:59:59Z"))).toBe(2);
    expect(currentYear(ug2, d("2027-09-01"))).toBe(3);
    expect(currentYear(ug2, d("2026-01-01"))).toBe(2); // before the start date
  });

  it("ends a year on the anniversary that starts the next one", () => {
    expect(endOfYear(ug2, 2)).toEqual(d("2027-09-01"));
    expect(endOfYear(ug2, 5)).toEqual(d("2030-09-01"));
  });

  it("has no year for HS and PhD students", () => {
    expect(currentYear(hs, now)).toBeNull();
    expect(endOfYear(hs, 1)).toBeNull();
  });

  it("rolls a Feb 29 start to Mar 1 in later years", () => {
    const leap: StudentYear = { stage: "ug", studyYear: 1, yearStartedOn: d("2028-02-29") };
    expect(currentYear(leap, d("2029-02-28"))).toBe(1);
    expect(currentYear(leap, d("2029-03-01"))).toBe(2);
  });
});

describe("catalog rules", () => {
  it("gives 'never' grants no end date", () => {
    expect(grantExpiry(hsFree, hs, now)).toBeNull();
  });

  it("ends UG paid credits at the end of Year 5, whatever year they were bought", () => {
    expect(grantExpiry(ugPaid(2, 25), ug2, d("2026-10-01"))).toEqual(d("2030-09-01"));
  });

  it("ends a free UG grant at the end of the year it was made in", () => {
    expect(grantExpiry(ugFree(3), ug2, d("2027-10-01"))).toEqual(d("2028-09-01"));
  });

  it("refuses a year-based rule for a student with no year", () => {
    expect(() => grantExpiry(ugFree(1), hs, now)).toThrow("needs a year in school");
  });

  it("finds the free allocations due for the stage and current year", () => {
    const catalog = [hsFree, ugFree(1), ugFree(2), ugFree(3), ugFree(4), ugPaid(2, 25)];
    expect(dueFreeAllocations(catalog, ug2, d("2026-10-01")).map((i) => i.id)).toEqual(["ug-free-2"]);
    expect(dueFreeAllocations(catalog, ug2, d("2029-10-01"))).toEqual([]); // Year 5: no free row
    expect(dueFreeAllocations(catalog, hs, now).map((i) => i.id)).toEqual(["hs-free"]);
  });

  it("keys free grants by stage and year, so HS gets one key and UG one per year", () => {
    expect(freeGrantRef(hsFree, "s1")).toBe("free:hs:y0:s1");
    expect(freeGrantRef(ugFree(2), "s1")).toBe("free:ug:y2:s1");
    expect(freeGrantRef({ ...ugFree(2), id: "replacement-row" }, "s1")).toBe("free:ug:y2:s1");
  });
});

describe("BRD acceptance scenarios", () => {
  const consumes = (grantId: string, n: number): CreditEvent[] =>
    Array.from({ length: n }, () => ({ grantId, type: "consume", delta: -1 }));
  const grantFrom = (id: string, catalogItem: CatalogItem, s: StudentYear, at: Date): CreditGrant => ({
    id,
    quantity: catalogItem.credits,
    expiresAt: grantExpiry(catalogItem, s, at),
  });

  it("UAT-01: an HS account is due 20 free credits under one key", () => {
    const due = dueFreeAllocations([hsFree], hs, now);
    expect(due).toHaveLength(1);
    expect(due[0].credits).toBe(20);
    // The unique source_ref makes the grant once per account (integration test).
  });

  it("UAT-02: free Year-1 UG credits do not roll into Year 2", () => {
    const ug1: StudentYear = { stage: "ug", studyYear: 1, yearStartedOn: d("2026-09-01") };
    const free = grantFrom("free-y1", ugFree(1), ug1, d("2026-10-01"));
    expect(balance([free], [], d("2027-08-31"))).toBe(3);
    expect(balance([free], [], d("2027-09-01"))).toBe(0);
  });

  it("UAT-03: a Year-1 paid balance of 8 becomes 33 after the Year-2 purchase of 25", () => {
    const ug1: StudentYear = { stage: "ug", studyYear: 1, yearStartedOn: d("2026-09-01") };
    const y1 = grantFrom("paid-y1", ugPaid(1, 20), ug1, d("2026-09-01"));
    const events = consumes("paid-y1", 12);
    expect(balance([y1], events, d("2027-08-01"))).toBe(8);
    const y2 = grantFrom("paid-y2", ugPaid(2, 25), ug1, d("2027-09-01"));
    expect(balance([y1, y2], events, d("2027-09-02"))).toBe(33);
  });

  it("UAT-04: UG paid credits expire at the end of Year 5", () => {
    const y2 = grantFrom("paid-y2", ugPaid(2, 25), ug2, d("2026-10-01"));
    expect(balance([y2], [], new Date("2030-08-31T23:59:59Z"))).toBe(25);
    expect(balance([y2], [], d("2030-09-01"))).toBe(0);
  });

  it("UAT-05: Master's Year-1 credits roll into Year 2 and no further", () => {
    const m1: StudentYear = { stage: "masters", studyYear: 1, yearStartedOn: d("2026-08-01") };
    const mastersY1 = item({ stage: "masters", studyYear: 1, credits: 45, expiry: "end_of_year_n", expiryYear: 2 });
    const grant = grantFrom("m-y1", mastersY1, m1, d("2026-08-01"));
    expect(balance([grant], [], d("2028-07-31"))).toBe(45); // still Year 2
    expect(balance([grant], [], d("2028-08-01"))).toBe(0); // Year 3
  });
});
