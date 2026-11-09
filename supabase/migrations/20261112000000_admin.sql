-- Phase 1 step 2: admins and the catalog change log.

-- One row per admin. Add an admin with an insert in the SQL editor:
--   insert into public.admins (user_id) select id from auth.users where email = '<email>';
-- Only the server reads this table (src/lib/admin.ts).
CREATE TABLE public.admins (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.admins FROM anon, authenticated;

-- Append-only record of every catalog edit made in the admin screen. No foreign
-- keys, so the record outlives the row and the admin account it names.
CREATE TABLE public.catalog_changes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  catalog_id uuid NOT NULL,
  admin_user_id uuid NOT NULL,
  before jsonb, -- null when the row was created
  after jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX catalog_changes_catalog_id_idx ON public.catalog_changes (catalog_id);

ALTER TABLE public.catalog_changes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.catalog_changes FROM anon, authenticated;
REVOKE UPDATE, DELETE, TRUNCATE ON public.catalog_changes FROM service_role;
