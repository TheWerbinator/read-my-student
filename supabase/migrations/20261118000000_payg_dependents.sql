-- Owner decisions of 2026-11-11.
--
-- 1. Pay-as-you-go. A "credits" row marked members_only is an extra credit that
--    only a student with a live membership can buy. An unmarked "credits" row is
--    pay-as-you-go, open to anyone in that stage. Prices stay catalog values.
ALTER TABLE public.plan_catalog
  ADD COLUMN members_only boolean NOT NULL DEFAULT false,
  ADD CONSTRAINT plan_catalog_members_only_credits CHECK (NOT members_only OR kind = 'credits');

-- 2. Faculty dependents. An admin records each invite after a professor emails
--    in. The dependent's requests cost no credit until free_requests_until.
--    Only the server key writes it (students lost UPDATE in 20261111000000).
ALTER TABLE public.students ADD COLUMN free_requests_until timestamptz;

CREATE TABLE public.dependent_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Stored lowercase; signup matches the new account's email against it.
  email text NOT NULL UNIQUE CHECK (email = lower(email)),
  dependent_name text NOT NULL,
  faculty_id uuid NOT NULL REFERENCES public.faculty(id) ON DELETE CASCADE,
  invited_by uuid NOT NULL, -- the admin user
  student_id uuid REFERENCES public.students(id) ON DELETE SET NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- No policies: only the server key reads or writes invites.
ALTER TABLE public.dependent_invites ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.dependent_invites FROM anon, authenticated;
