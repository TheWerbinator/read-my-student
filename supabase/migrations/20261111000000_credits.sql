-- Phase 1 step 1: the credit ledger. One credit pays for one letter request.
-- Catalog values (prices, credit counts, expiry rules) are data entered in the
-- admin screen. None are seeded here.

CREATE TYPE public.student_stage AS ENUM ('hs', 'ug', 'masters', 'phd');
CREATE TYPE public.catalog_kind AS ENUM ('membership', 'credits', 'bundle', 'free_allocation');
-- end_of_year: end of the student's current year in school when the grant is made.
-- end_of_year_n: end of year expiry_year of the student's stage (UG Year 5, Master's Year 2).
CREATE TYPE public.credit_expiry AS ENUM ('never', 'end_of_year', 'end_of_year_n');
CREATE TYPE public.credit_event_type AS ENUM ('consume', 'refund', 'adjust');

-- The year in school advances on each 12-month anniversary of year_started_on,
-- computed in src/lib/credits.ts. study_year is the year on that date.
ALTER TABLE public.students
  ADD COLUMN stage public.student_stage,
  ADD COLUMN study_year smallint CHECK (study_year BETWEEN 1 AND 12),
  ADD COLUMN year_started_on date,
  ADD CONSTRAINT students_year_required
    CHECK (stage IS NULL OR stage NOT IN ('ug', 'masters')
           OR (study_year IS NOT NULL AND year_started_on IS NOT NULL));

-- Only an admin (server key) changes stage and year. Students keep update
-- rights on the columns they could already edit.
REVOKE UPDATE ON public.students FROM authenticated;
GRANT UPDATE (university, university_opeid, program, graduation_date, updated_at)
  ON public.students TO authenticated;

CREATE TABLE public.plan_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stage public.student_stage NOT NULL,
  -- Null: any year (HS, PhD, top-ups).
  study_year smallint CHECK (study_year BETWEEN 1 AND 12),
  kind public.catalog_kind NOT NULL,
  credits integer NOT NULL CHECK (credits > 0),
  price_usd_cents integer CHECK (price_usd_cents >= 0),
  price_inr_paise integer CHECK (price_inr_paise >= 0),
  stripe_price_usd text,
  stripe_price_inr text,
  expiry public.credit_expiry NOT NULL,
  expiry_year smallint CHECK (expiry_year BETWEEN 1 AND 12),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((expiry = 'end_of_year_n') = (expiry_year IS NOT NULL)),
  CHECK (kind = 'free_allocation' OR price_usd_cents IS NOT NULL)
);

ALTER TABLE public.plan_catalog ENABLE ROW LEVEL SECURITY;
-- The pricing page reads active rows without a session.
CREATE POLICY "plan_catalog: read active" ON public.plan_catalog
  FOR SELECT TO anon, authenticated USING (active);

-- Grants never change after insert: usage, refunds and corrections are events.
CREATE TABLE public.credit_grants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  catalog_id uuid REFERENCES public.plan_catalog(id),
  source text NOT NULL
    CHECK (source IN ('free_allocation', 'membership', 'credits', 'bundle', 'adjustment')),
  quantity integer NOT NULL CHECK (quantity > 0),
  expires_at timestamptz, -- null: never expires
  -- Idempotency key: Stripe invoice id, or free:<stage>:y<year>:<student_id>.
  source_ref text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX credit_grants_student_id_idx ON public.credit_grants (student_id);

CREATE TABLE public.credit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  grant_id uuid NOT NULL REFERENCES public.credit_grants(id) ON DELETE CASCADE,
  -- SET NULL keeps the event (and the balance) if a request row is deleted.
  request_id uuid REFERENCES public.letter_requests(id) ON DELETE SET NULL,
  type public.credit_event_type NOT NULL,
  delta integer NOT NULL,
  actor uuid, -- the admin user behind a manual adjustment (BRD PAY-06)
  reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (
    (type = 'consume' AND delta = -1)
    OR (type = 'refund' AND delta = 1)
    OR (type = 'adjust' AND delta <> 0 AND actor IS NOT NULL AND reason IS NOT NULL)
  )
);

CREATE INDEX credit_events_grant_id_idx ON public.credit_events (grant_id);
-- One request spends at most one credit and is refunded at most once, even when
-- a decline and the day-7 sweep race each other.
CREATE UNIQUE INDEX credit_events_one_consume_per_request
  ON public.credit_events (request_id) WHERE type = 'consume';
CREATE UNIQUE INDEX credit_events_one_refund_per_request
  ON public.credit_events (request_id) WHERE type = 'refund';

-- Append-only ledger (BRD PAY-03): nobody updates or deletes rows. Deleting a
-- student still cascades, because foreign key actions run as the table owner.
REVOKE UPDATE, DELETE, TRUNCATE ON public.credit_grants, public.credit_events
  FROM anon, authenticated, service_role;

ALTER TABLE public.credit_grants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "credit_grants: student select own" ON public.credit_grants
  FOR SELECT TO authenticated
  USING (student_id = (SELECT id FROM public.students WHERE user_id = auth.uid()));

CREATE POLICY "credit_events: student select own" ON public.credit_events
  FOR SELECT TO authenticated
  USING (grant_id IN (
    SELECT g.id FROM public.credit_grants g
    WHERE g.student_id = (SELECT id FROM public.students WHERE user_id = auth.uid())
  ));

-- Spends one credit from a grant the caller chose (src/lib/credit-wallet.ts picks
-- the soonest-expiring one). This is SQL only because it must win a race: the
-- row lock stops two requests from spending the last credit of one grant.
-- Returns 'consumed', 'already' (this request already spent a credit) or
-- 'unavailable' (grant empty, expired, or not the request's student).
-- SECURITY DEFINER: the row lock (FOR UPDATE) needs UPDATE privilege, which no
-- API role has on the ledger. Only service_role may execute the function.
CREATE FUNCTION public.consume_credit(p_request_id uuid, p_grant_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_remaining integer;
BEGIN
  IF EXISTS (SELECT 1 FROM public.credit_events
             WHERE request_id = p_request_id AND type = 'consume') THEN
    RETURN 'already';
  END IF;

  PERFORM 1 FROM public.credit_grants g
   WHERE g.id = p_grant_id
     AND (g.expires_at IS NULL OR g.expires_at > now())
     AND g.student_id = (SELECT r.student_id FROM public.letter_requests r
                         WHERE r.id = p_request_id)
   FOR UPDATE;
  IF NOT FOUND THEN
    RETURN 'unavailable';
  END IF;

  SELECT g.quantity + COALESCE((SELECT sum(e.delta) FROM public.credit_events e
                                WHERE e.grant_id = g.id), 0)
    INTO v_remaining
    FROM public.credit_grants g
   WHERE g.id = p_grant_id;
  IF v_remaining < 1 THEN
    RETURN 'unavailable';
  END IF;

  BEGIN
    INSERT INTO public.credit_events (grant_id, request_id, type, delta)
    VALUES (p_grant_id, p_request_id, 'consume', -1);
  EXCEPTION WHEN unique_violation THEN
    RETURN 'already';
  END;
  RETURN 'consumed';
END;
$$;

REVOKE EXECUTE ON FUNCTION public.consume_credit(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_credit(uuid, uuid) TO service_role;
