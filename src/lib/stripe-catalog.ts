// Keeps Stripe Prices in step with the catalog. Stripe Prices are immutable:
// "you can't change a price's amount in the API. Instead, we recommend creating
// a new price for the new amount, switch to the new price's ID, then update the
// old price to be inactive" (https://docs.stripe.com/products-prices/manage-prices.md).

import type Stripe from "stripe";
import { offerMetadata } from "@/lib/billing";
import type { CatalogRow } from "@/lib/catalog";

export type StripeIds = {
  stripe_product_id: string;
  stripe_price_usd: string | null;
  stripe_price_inr: string | null;
};

export type PriceSync = {
  /** Creates the Product (once) and a fresh USD and INR Price for the row's current offer. */
  create(row: CatalogRow): Promise<StripeIds>;
  /** Archives Prices the row no longer uses. Existing subscriptions keep them until they renew. */
  archive(priceIds: string[]): Promise<void>;
};

const STAGE = { hs: "High school", ug: "Undergraduate", masters: "Master's", phd: "PhD" } as const;
const KIND = { membership: "membership", credits: "credit", bundle: "credit bundle", free_allocation: "free credits" } as const;

export function productName(row: CatalogRow): string {
  const year = row.study_year === null ? "" : `, Year ${row.study_year}`;
  return `${STAGE[row.stage]} ${KIND[row.kind]}${year}`;
}

export function stripePriceSync(stripe: Stripe): PriceSync {
  return {
    async create(row) {
      const productId =
        row.stripe_product_id ??
        (await stripe.products.create({ name: productName(row), metadata: { catalog_id: row.id } })).id;

      const price = async (currency: "usd" | "inr", amount: number | null) => {
        if (amount === null) return null;
        const created = await stripe.prices.create({
          product: productId,
          currency,
          unit_amount: amount,
          recurring: row.kind === "membership" ? { interval: "year" } : undefined,
          metadata: offerMetadata(row),
        });
        return created.id;
      };

      return {
        stripe_product_id: productId,
        stripe_price_usd: await price("usd", row.price_usd_cents),
        stripe_price_inr: await price("inr", row.price_inr_paise),
      };
    },

    async archive(priceIds) {
      for (const id of priceIds) await stripe.prices.update(id, { active: false });
    },
  };
}
