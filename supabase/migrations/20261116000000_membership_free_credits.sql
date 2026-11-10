-- Yearly free credits become a field on that year's membership row (owner,
-- 2026-11-10), so the admin screen and the pricing page show one line per year.
-- A student gets them whether or not they buy the membership, and they stack on
-- paid credits (DEC-04). They last until the end of that school year (BRD 3.2).
-- One-off free allocations with no year (HS: 20 once) stay free_allocation rows.

ALTER TABLE public.plan_catalog
  ADD COLUMN free_credits integer NOT NULL DEFAULT 0 CHECK (free_credits >= 0),
  ADD CONSTRAINT plan_catalog_free_credits_on_membership
    CHECK (free_credits = 0 OR (kind = 'membership' AND study_year IS NOT NULL));

-- Move each active yearly free allocation onto the active membership for the
-- same stage and year, then switch the old row off. The old rows stay, because
-- credit_grants.catalog_id points at them. The grant key (free:<stage>:y<year>)
-- does not change, so nobody gets a year's free credits twice.
WITH moved AS (
  UPDATE public.plan_catalog m
  SET free_credits = f.credits
  FROM public.plan_catalog f
  WHERE f.kind = 'free_allocation' AND f.active AND f.study_year IS NOT NULL
    AND m.kind = 'membership' AND m.active
    AND m.stage = f.stage AND m.study_year = f.study_year
  RETURNING m.stage, m.study_year
)
UPDATE public.plan_catalog f
SET active = false
FROM moved
WHERE f.kind = 'free_allocation' AND f.active
  AND f.stage = moved.stage AND f.study_year = moved.study_year;
