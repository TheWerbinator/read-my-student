/**
 * @jest-environment node
 *
 * Unit tests for the admin catalog form: money parsing and validation.
 */

import { formFromRow, formatMoney, moneyText, parseCatalogForm, parseMoney, type CatalogForm } from "@/lib/catalog";

const form = (over: Partial<CatalogForm> = {}): CatalogForm => ({
  stage: "ug",
  studyYear: 2,
  kind: "membership",
  credits: 25,
  priceUsd: "25.00",
  priceInr: "",
  expiry: "end_of_year_n",
  expiryYear: 5,
  active: true,
  ...over,
});

describe("money", () => {
  it.each([
    ["1.47", 147],
    ["1.5", 150],
    ["20", 2000],
    [" 2,099.00 ", 209900],
    ["0", 0],
  ])("parses %s as %d minor units", (text, minor) => {
    expect(parseMoney(text)).toBe(minor);
  });

  it.each(["", "abc", "1.234", "-1", "1e3", "$5", "1.2.3"])("rejects %j", (text) => {
    expect(parseMoney(text)).toBeNull();
  });

  it("round-trips through the form text", () => {
    expect(moneyText(147)).toBe("1.47");
    expect(moneyText(2000)).toBe("20.00");
    expect(moneyText(null)).toBe("");
    expect(parseMoney(moneyText(9999))).toBe(9999);
  });

  it("formats USD and INR for display", () => {
    expect(formatMoney(147, "USD")).toBe("$1.47");
    expect(formatMoney(12345600, "INR")).toBe("₹1,23,456.00");
    expect(formatMoney(null, "INR")).toBeNull();
  });
});

describe("catalog form", () => {
  it("turns a valid form into a database row", () => {
    expect(parseCatalogForm(form({ priceInr: "2,099" }))).toEqual({
      ok: true,
      row: {
        stage: "ug",
        study_year: 2,
        kind: "membership",
        credits: 25,
        price_usd_cents: 2500,
        price_inr_paise: 209900,
        expiry: "end_of_year_n",
        expiry_year: 5,
        active: true,
      },
    });
  });

  it("leaves INR empty when it is not set", () => {
    const result = parseCatalogForm(form());
    expect(result.ok && result.row.price_inr_paise).toBeNull();
  });

  it("requires a USD price for paid items", () => {
    expect(parseCatalogForm(form({ priceUsd: "" }))).toMatchObject({ ok: false, errors: { priceUsd: "Enter a price." } });
  });

  it("refuses a price on free credits", () => {
    const result = parseCatalogForm(form({ kind: "free_allocation", priceUsd: "1.00" }));
    expect(result).toMatchObject({ ok: false, errors: { priceUsd: "Free allocations have no price." } });
  });

  it("stores no price for free credits", () => {
    const result = parseCatalogForm(form({ kind: "free_allocation", priceUsd: "", expiry: "end_of_year", expiryYear: "" }));
    expect(result.ok && result.row).toMatchObject({ price_usd_cents: null, price_inr_paise: null, expiry_year: null });
  });

  it("rejects a malformed amount", () => {
    expect(parseCatalogForm(form({ priceInr: "12.345" }))).toMatchObject({ ok: false, errors: { priceInr: "Enter an amount like 1.47." } });
  });

  it("needs a year for 'end of a set year'", () => {
    expect(parseCatalogForm(form({ expiryYear: "" }))).toMatchObject({ ok: false, errors: { expiryYear: expect.any(String) } });
  });

  it("drops the expiry year when the rule does not use it", () => {
    const result = parseCatalogForm(form({ expiry: "end_of_year", expiryYear: 5 }));
    expect(result.ok && result.row.expiry_year).toBeNull();
  });

  it("only allows Never for HS and PhD, which have no year in school", () => {
    expect(parseCatalogForm(form({ stage: "phd", expiry: "end_of_year_n" }))).toMatchObject({
      ok: false,
      errors: { expiry: "HS and PhD credits must use Never." },
    });
    expect(parseCatalogForm(form({ stage: "phd", studyYear: "", expiry: "never", expiryYear: "" })).ok).toBe(true);
  });

  it("rejects zero credits and unknown values", () => {
    expect(parseCatalogForm(form({ credits: 0 }))).toMatchObject({ ok: false, errors: { credits: expect.any(String) } });
    expect(parseCatalogForm({ ...form(), stage: "kindergarten" })).toMatchObject({ ok: false, errors: { stage: expect.any(String) } });
  });

  it("fills the form back from a saved row", () => {
    const result = parseCatalogForm(form({ priceInr: "2,099" }));
    if (!result.ok) throw new Error("expected a valid form");
    expect(parseCatalogForm(formFromRow({ id: "x", ...result.row }))).toEqual(result);
  });
});
