/**
 * Singleton Stripe client.
 *
 * Import `stripe` from here anywhere server-side rather than calling
 * `new Stripe(...)` directly, so the SDK is only instantiated once per
 * process and the API version is enforced in one place.
 */

import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover",
});

/** Price in cents for one school delivery ($5.00 USD) */
export const DELIVERY_PRICE_CENTS = 500;
