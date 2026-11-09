-- Stripe webhook idempotency. Stripe can deliver the same event more than once
-- and retries any delivery that fails (https://docs.stripe.com/webhooks.md).

-- One row per Stripe event id. processed_at is set only after the handler
-- succeeds, so a failed attempt is processed again on Stripe's retry.
CREATE TABLE public.stripe_events (
  event_id text PRIMARY KEY,
  type text NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz
);

-- Server-only table: RLS on with no policies, so only the secret key can use it.
ALTER TABLE public.stripe_events ENABLE ROW LEVEL SECURITY;

-- A retried checkout reuses its delivery link instead of inserting a second one.
-- A plain unique constraint allows many NULLs, and PostgREST cannot target a
-- partial index.
ALTER TABLE public.delivery_links
  ADD CONSTRAINT delivery_links_stripe_checkout_session_id_key
  UNIQUE (stripe_checkout_session_id);
