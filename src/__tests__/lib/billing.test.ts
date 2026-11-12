/**
 * @jest-environment node
 *
 * Unit tests for the billing rules: who may buy what, the currency, the offer
 * snapshot in Stripe Price metadata, and the membership a renewal moves to.
 */

import {
  checkPurchase,
  chooseCurrency,
  grantForPurchase,
  offerChanged,
  offerFromMetadata,
  offerMetadata,
  priceFor,
  pricingRow,
  lastMembershipYear,
  pricingRows,
  renewalRow,
  yearlyFreeAllocation,
} from "@/lib/billing";
import type { CatalogRow } from "@/lib/catalog";
import type { StudentYear } from "@/lib/credits";

const d = (iso: string) => new Date(`${iso}T00:00:00Z`);
const now = d("2026-11-09");
const ug2: StudentYear = { stage: "ug", studyYear: 2, yearStartedOn: d("2026-09-01") };

const row = (over: Partial<CatalogRow> = {}): CatalogRow => ({
  id: "row-ug-2",
  stage: "ug",
  study_year: 2,
  kind: "membership",
  credits: 25,
  price_usd_cents: 2500,
  price_inr_paise: 210000,
  expiry: "end_of_year_n",
  expiry_year: 5,
  free_credits: 0,
  members_only: false,
  active: true,
  stripe_product_id: "prod_1",
  stripe_price_usd: "price_usd",
  stripe_price_inr: "price_inr",
  ...over,
});

const ok = { quantity: 1, hasActiveMembership: false, autoRenewConsent: true };

describe("currency", () => {
  it("charges INR in India when the item has an INR Price", () => {
    expect(chooseCurrency("IN", row())).toBe("inr");
    expect(priceFor(row(), "inr")).toBe("price_inr");
  });

  it("falls back to USD in India when the item has no INR Price", () => {
    expect(chooseCurrency("IN", row({ stripe_price_inr: null }))).toBe("usd");
  });

  it("charges USD everywhere else, and when the country is unknown", () => {
    expect(chooseCurrency("US", row())).toBe("usd");
    expect(chooseCurrency(null, row())).toBe("usd");
  });
});

describe("checkPurchase", () => {
  it("lets a Year 2 UG student buy the Year 2 membership", () => {
    expect(checkPurchase(row(), ug2, now, ok)).toEqual({ ok: true });
  });

  it.each([
    ["an inactive item", row({ active: false })],
    ["free credits", row({ kind: "free_allocation" })],
    ["an item with no Stripe Price", row({ stripe_price_usd: null })],
  ])("refuses %s", (_, item) => {
    expect(checkPurchase(item, ug2, now, ok)).toEqual({ ok: false, error: "This item is not for sale." });
  });

  it("refuses another stage's item", () => {
    expect(checkPurchase(row({ stage: "masters" }), ug2, now, ok)).toMatchObject({ ok: false, error: "This item is for a different stage." });
  });

  it("refuses another year's membership, so nobody picks the cheapest year", () => {
    expect(checkPurchase(row({ study_year: 1 }), ug2, now, ok)).toEqual({
      ok: false,
      error: "This item is for Year 1. You are in Year 2.",
    });
  });

  it("sells the last year's membership to a student past that year, and only that one", () => {
    const ug7: StudentYear = { stage: "ug", studyYear: 7, yearStartedOn: d("2026-09-01") };
    const last = { ...ok, lastMembershipYear: 5 };
    expect(checkPurchase(row({ study_year: 5 }), ug7, now, last)).toEqual({ ok: true });
    expect(checkPurchase(row({ study_year: 4 }), ug7, now, last)).toMatchObject({ ok: false });
    expect(checkPurchase(row({ study_year: 5 }), ug7, now, ok)).toMatchObject({ ok: false });
    expect(checkPurchase(row({ study_year: 5 }), ug2, now, last)).toMatchObject({ ok: false });
  });

  it("sells extra credits to members only, and pay-as-you-go credits to anyone", () => {
    const extra = row({ kind: "credits", study_year: null, credits: 1, members_only: true });
    expect(checkPurchase(extra, ug2, now, ok)).toMatchObject({ ok: false, error: expect.stringContaining("for members") });
    expect(checkPurchase(extra, ug2, now, { ...ok, hasActiveMembership: true })).toEqual({ ok: true });
    expect(checkPurchase({ ...extra, members_only: false }, ug2, now, ok)).toEqual({ ok: true });
  });

  it("refuses a second membership", () => {
    expect(checkPurchase(row(), ug2, now, { ...ok, hasActiveMembership: true })).toMatchObject({ ok: false });
  });

  it("refuses a membership without consent to automatic renewal (PAY-05)", () => {
    expect(checkPurchase(row(), ug2, now, { ...ok, autoRenewConsent: false })).toEqual({
      ok: false,
      error: "Agree to automatic yearly renewal to continue.",
    });
  });

  it("needs no renewal consent for one-time credits", () => {
    const credits = row({ kind: "credits", study_year: null, credits: 1, price_usd_cents: 147 });
    expect(checkPurchase(credits, ug2, now, { ...ok, quantity: 10, autoRenewConsent: false })).toEqual({ ok: true });
  });

  it.each([0, 101, 1.5])("refuses a credit quantity of %d", (quantity) => {
    const credits = row({ kind: "credits", study_year: null });
    expect(checkPurchase(credits, ug2, now, { ...ok, quantity })).toMatchObject({ ok: false });
  });

  it("sells memberships and bundles one at a time", () => {
    expect(checkPurchase(row(), ug2, now, { ...ok, quantity: 2 })).toEqual({ ok: false, error: "Buy one at a time." });
  });
});

describe("offer snapshot", () => {
  it("round-trips through Stripe Price metadata", () => {
    expect(offerFromMetadata(offerMetadata(row()))).toEqual({
      id: "row-ug-2",
      stage: "ug",
      studyYear: 2,
      kind: "membership",
      credits: 25,
      expiry: "end_of_year_n",
      expiryYear: 5,
    });
    const phd = row({ stage: "phd", study_year: null, kind: "credits", credits: 1, expiry: "never", expiry_year: null });
    expect(offerFromMetadata(offerMetadata(phd))).toMatchObject({ studyYear: null, expiryYear: null });
  });

  it("returns null for a Price without an offer", () => {
    expect(offerFromMetadata({})).toBeNull();
    expect(offerFromMetadata(null)).toBeNull();
    expect(offerFromMetadata({ ...offerMetadata(row()), credits: "zero" })).toBeNull();
  });

  it("grants the offer's credits times the quantity, with the offer's expiry", () => {
    const offer = offerFromMetadata(offerMetadata(row({ kind: "credits", study_year: null, credits: 1 })))!;
    expect(grantForPurchase(offer, 10, ug2, now)).toEqual({ quantity: 10, expiresAt: d("2030-09-01") });
  });

  it("needs new Prices when anything the buyer gets changes", () => {
    const before = row();
    expect(offerChanged(null, before)).toBe(true);
    expect(offerChanged(before, { ...before, active: false })).toBe(false);
    expect(offerChanged(before, { ...before, price_inr_paise: 199900 })).toBe(true);
    expect(offerChanged(before, { ...before, credits: 30 })).toBe(true);
    expect(offerChanged(before, { ...before, expiry_year: 4 })).toBe(true);
  });
});

describe("renewalRow", () => {
  const catalog = [1, 2, 3, 4, 5].map((y) => row({ id: `ug-${y}`, study_year: y }));

  it("moves a renewal to the membership for the year on the renewal date", () => {
    // Bought in Year 2 on 2026-11-09; renews 2027-11-09, which is in Year 3.
    expect(renewalRow(catalog, ug2, d("2027-11-09"))?.id).toBe("ug-3");
  });

  it("keeps renewing at the last year's membership after that year", () => {
    expect(renewalRow(catalog, ug2, d("2030-11-09"))?.id).toBe("ug-5"); // Year 6
    expect(renewalRow(catalog, ug2, d("2036-11-09"))?.id).toBe("ug-5"); // Year 12
    expect(lastMembershipYear(catalog, "ug")).toBe(5);
  });

  it("ends the subscription when the stage has no membership for the year", () => {
    const gap = catalog.filter((r) => r.id !== "ug-1");
    expect(renewalRow(gap, { ...ug2, studyYear: 1 }, d("2026-11-09"))).toBeNull();
  });

  it("skips inactive rows and other stages", () => {
    const withOff = catalog.map((r) => (r.id === "ug-3" ? { ...r, active: false } : r));
    expect(renewalRow(withOff, ug2, d("2027-11-09"))).toBeNull();
    expect(renewalRow(catalog, { ...ug2, stage: "masters" }, d("2027-11-09"))).toBeNull();
  });
});

describe("pricingRow", () => {
  it("prices a membership in the visitor's currency, with USD as the fallback", () => {
    expect(pricingRow(row(), "US")).toMatchObject({
      label: "Year 2 membership",
      detail: "25 credits a year. Credits last until the end of Year 5.",
      price: "$25.00 a year",
      free: false,
    });
    expect(pricingRow(row(), "IN")?.price).toBe("₹2,100.00 a year");
    expect(pricingRow(row({ stripe_price_inr: null }), "IN")?.price).toBe("$25.00 a year");
  });

  it("shows free credits, extra credits and packs", () => {
    expect(
      pricingRow(row({ kind: "free_allocation", credits: 3, price_usd_cents: null, expiry: "end_of_year", expiry_year: null, stripe_price_usd: null }), "US"),
    ).toMatchObject({ label: "Year 2, free", price: "Free", free: true, detail: "3 credits. Credits last until the end of that school year." });
    expect(pricingRow(row({ kind: "credits", study_year: null, credits: 1, price_usd_cents: 147, members_only: true }), "US")).toMatchObject({
      label: "Extra credit for members",
      price: "$1.47 each",
    });
    expect(pricingRow(row({ kind: "credits", study_year: null, credits: 1, price_usd_cents: 499, expiry: "never" }), "US")).toMatchObject({
      label: "Pay as you go",
      price: "$4.99 each",
      detail: "No membership needed. Buy only the credits you use. Credits never expire.",
    });
    expect(
      pricingRow(row({ kind: "free_allocation", stage: "hs", study_year: null, credits: 20, price_usd_cents: null, expiry: "never", stripe_price_usd: null }), "US"),
    ).toMatchObject({ label: "Free every year", price: "Free" });
    expect(pricingRow(row({ kind: "bundle", stage: "phd", study_year: null, credits: 100, price_usd_cents: 25900, expiry: "never" }), "US")).toMatchObject({
      label: "Pack of 100",
      price: "$259.00",
      detail: "Credits never expire.",
    });
  });

  it("hides items that are switched off or cannot be bought yet", () => {
    expect(pricingRow(row({ active: false }), "US")).toBeNull();
    expect(pricingRow(row({ stripe_price_usd: null }), "US")).toBeNull();
  });
});

describe("pricingRows", () => {
  it("shows a year's free credits inside that year's membership line", () => {
    const lines = pricingRows([row({ free_credits: 3 }), row({ id: "ug-3", study_year: 3 })], "US");
    expect(lines.map((l) => l.label)).toEqual(["Year 2 membership", "Year 3+ membership"]);
    expect(lines[0].detail).toBe(
      "25 credits a year. Credits last until the end of Year 5. Plus 3 free credits that year, with or without a membership, which last until the end of that school year.",
    );
    expect(lines[1].detail).not.toMatch(/free/);
  });

  it("marks the last membership year with a plus", () => {
    const lines = pricingRows([row({ id: "ug-4", study_year: 4 }), row({ id: "ug-5", study_year: 5, credits: 50 })], "US");
    expect(lines.map((l) => l.label)).toEqual(["Year 4 membership", "Year 5+ membership"]);
    expect(lines[1].detail).toBe(
      "50 credits a year, at this price every year from Year 5 on. Credits last until the end of Year 5 or the end of the year they arrive in, whichever is later.",
    );
  });

});

describe("yearlyFreeAllocation", () => {
  const catalog = [1, 2, 3].map((y) => row({ id: `ug-${y}`, study_year: y, free_credits: y === 3 ? 2 : 3 }));

  it("grants the free credits on the membership for the student's year, keyed by that year", () => {
    expect(yearlyFreeAllocation(catalog, ug2, now)).toEqual({
      id: "ug-2", stage: "ug", studyYear: 2, kind: "free_allocation", credits: 3, expiry: "end_of_year", expiryYear: null,
    });
  });

  it("uses the last year's row for later years, and grants nothing when it has none", () => {
    expect(yearlyFreeAllocation(catalog, ug2, d("2028-11-09"))).toMatchObject({ id: "ug-3", studyYear: 4, credits: 2 });
    const none = catalog.map((r) => ({ ...r, free_credits: 0 }));
    expect(yearlyFreeAllocation(none, ug2, now)).toBeNull();
  });
});
