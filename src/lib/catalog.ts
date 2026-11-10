// Catalog form rules for the admin screen. Prices are typed as decimals
// ("1.47", "122.50") and stored as integer cents or paise. The database checks
// in 20261111000000_credits.sql stay as the last line of defense.

import { z } from "zod";

export const STAGES = ["hs", "ug", "masters", "phd"] as const;
export const KINDS = ["membership", "credits", "bundle", "free_allocation"] as const;
export const EXPIRIES = ["never", "end_of_year", "end_of_year_n"] as const;

export type CatalogRow = {
  id: string;
  stage: (typeof STAGES)[number];
  study_year: number | null;
  kind: (typeof KINDS)[number];
  credits: number;
  price_usd_cents: number | null;
  price_inr_paise: number | null;
  expiry: (typeof EXPIRIES)[number];
  expiry_year: number | null;
  /** Free credits for that year, membership or not. Membership rows with a year only. */
  free_credits: number;
  active: boolean;
  // Set by the Stripe sync on save (src/lib/stripe-catalog.ts), never by the form.
  stripe_product_id?: string | null;
  stripe_price_usd?: string | null;
  stripe_price_inr?: string | null;
};

export const CATALOG_COLUMNS =
  "id, stage, study_year, kind, credits, price_usd_cents, price_inr_paise, expiry, expiry_year, free_credits, active, stripe_product_id, stripe_price_usd, stripe_price_inr";

export type CatalogInput = Omit<CatalogRow, "id" | "stripe_product_id" | "stripe_price_usd" | "stripe_price_inr">;

/** "1.47" -> 147. Returns null for anything that is not a plain amount with at most 2 decimals. */
export function parseMoney(text: string): number | null {
  const clean = text.trim().replace(/,/g, "");
  const match = /^(\d{1,7})(?:\.(\d{1,2}))?$/.exec(clean);
  if (!match) return null;
  return Number(match[1]) * 100 + Number((match[2] ?? "0").padEnd(2, "0"));
}

/** 147 -> "1.47", for filling the form. */
export function moneyText(minor: number | null): string {
  if (minor === null) return "";
  return `${Math.floor(minor / 100)}.${String(minor % 100).padStart(2, "0")}`;
}

export function formatMoney(minor: number | null, currency: "USD" | "INR"): string | null {
  if (minor === null) return null;
  return new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-US", {
    style: "currency",
    currency,
  }).format(minor / 100);
}

const year = z.coerce.number().int().min(1).max(12);

// The raw form: every field as the browser sends it.
export const catalogFormSchema = z
  .object({
    stage: z.enum(STAGES),
    studyYear: z.union([z.literal(""), year]),
    kind: z.enum(KINDS),
    credits: z.coerce.number().int().min(1, "Credits must be at least 1."),
    priceUsd: z.string(),
    priceInr: z.string(),
    expiry: z.enum(EXPIRIES),
    expiryYear: z.union([z.literal(""), year]),
    freeCredits: z.coerce.number().int().min(0, "Free credits cannot be negative."),
    active: z.boolean(),
  })
  .superRefine((form, ctx) => {
    const free = form.kind === "free_allocation";
    if (form.freeCredits > 0 && form.kind === "membership" && form.studyYear === "")
      ctx.addIssue({ code: "custom", path: ["freeCredits"], message: "Only a membership for a set year has free credits." });
    if (free && form.studyYear !== "")
      ctx.addIssue({ code: "custom", path: ["studyYear"], message: "Put yearly free credits on that year's membership." });
    const check = (field: "priceUsd" | "priceInr", required: boolean) => {
      const text = form[field].trim();
      if (free && text) ctx.addIssue({ code: "custom", path: [field], message: "Free allocations have no price." });
      else if (!free && required && !text) ctx.addIssue({ code: "custom", path: [field], message: "Enter a price." });
      else if (text && parseMoney(text) === null)
        ctx.addIssue({ code: "custom", path: [field], message: "Enter an amount like 1.47." });
    };
    check("priceUsd", true);
    check("priceInr", false);

    if (form.expiry === "end_of_year_n" && form.expiryYear === "")
      ctx.addIssue({ code: "custom", path: ["expiryYear"], message: "Choose the year the credits end." });
    // HS and PhD students have no year in school, so a year-based expiry cannot be computed.
    if ((form.stage === "hs" || form.stage === "phd") && form.expiry !== "never")
      ctx.addIssue({ code: "custom", path: ["expiry"], message: "HS and PhD credits must use Never." });
  });

export type CatalogForm = z.input<typeof catalogFormSchema>;

/** Validates the form. Returns the database row, or an error message per field. */
export function parseCatalogForm(
  form: unknown,
): { ok: true; row: CatalogInput } | { ok: false; errors: Record<string, string> } {
  const parsed = catalogFormSchema.safeParse(form);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) errors[String(issue.path[0] ?? "form")] ??= issue.message;
    return { ok: false, errors };
  }
  const f = parsed.data;
  const free = f.kind === "free_allocation";
  return {
    ok: true,
    row: {
      stage: f.stage,
      study_year: f.studyYear === "" ? null : f.studyYear,
      kind: f.kind,
      credits: f.credits,
      price_usd_cents: free ? null : parseMoney(f.priceUsd),
      price_inr_paise: free || !f.priceInr.trim() ? null : parseMoney(f.priceInr),
      expiry: f.expiry,
      expiry_year: f.expiry === "end_of_year_n" && f.expiryYear !== "" ? f.expiryYear : null,
      // The field is hidden for other kinds, so a value left over from switching kind is dropped.
      free_credits: f.kind === "membership" ? f.freeCredits : 0,
      active: f.active,
    },
  };
}

/** The form values for an existing row (or blank defaults for a new one). */
export function formFromRow(row: CatalogRow | null): CatalogForm {
  return {
    stage: row?.stage ?? "ug",
    studyYear: row?.study_year ?? "",
    kind: row?.kind ?? "membership",
    credits: row?.credits ?? 1,
    priceUsd: moneyText(row?.price_usd_cents ?? null),
    priceInr: moneyText(row?.price_inr_paise ?? null),
    expiry: row?.expiry ?? "never",
    expiryYear: row?.expiry_year ?? "",
    freeCredits: row?.free_credits ?? 0,
    active: row?.active ?? true,
  };
}
