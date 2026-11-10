-- Phase 1 step 3: Stripe memberships and credit purchases.

ALTER TABLE public.students ADD COLUMN stripe_customer_id text UNIQUE;

-- One Stripe Product per catalog row. Its Prices are replaced (never edited)
-- whenever the offer changes, because Stripe Prices are immutable.
ALTER TABLE public.plan_catalog ADD COLUMN stripe_product_id text;

-- Lets a Stripe refund find the credits it paid for (charge.refunded carries
-- the PaymentIntent). Set at insert like every other grant column.
ALTER TABLE public.credit_grants ADD COLUMN stripe_payment_intent text;
CREATE INDEX credit_grants_stripe_payment_intent_idx
  ON public.credit_grants (stripe_payment_intent) WHERE stripe_payment_intent IS NOT NULL;

-- A system adjustment (removing unused credits after a Stripe refund) has no
-- admin behind it. Manual adjustments still record the admin in actor.
ALTER TABLE public.credit_events DROP CONSTRAINT credit_events_check;
ALTER TABLE public.credit_events ADD CONSTRAINT credit_events_check CHECK (
  (type = 'consume' AND delta = -1)
  OR (type = 'refund' AND delta = 1)
  OR (type = 'adjust' AND delta <> 0 AND reason IS NOT NULL)
);

-- A mirror of each Stripe membership subscription, kept current by webhooks.
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  stripe_subscription_id text NOT NULL UNIQUE,
  catalog_id uuid REFERENCES public.plan_catalog(id),
  status text NOT NULL,
  currency text NOT NULL,
  current_period_end timestamptz,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  -- When the student agreed to automatic yearly renewal (BRD PAY-05).
  renewal_consent_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX subscriptions_student_id_idx ON public.subscriptions (student_id);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.subscriptions FROM anon, authenticated;

CREATE POLICY "subscriptions: student select own" ON public.subscriptions
  FOR SELECT TO authenticated
  USING (student_id = (SELECT id FROM public.students WHERE user_id = auth.uid()));
