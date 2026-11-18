-- Phase 5: sign-in tokens for the browser extension.
-- The extension gets its own token instead of a copy of the site session, so
-- disconnecting the extension and logging out of the site stay independent.
-- Only the SHA-256 hash is stored. Only the server reads this table (src/lib/extension-auth.ts).
CREATE TABLE public.extension_tokens (
  token_hash text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);

CREATE INDEX extension_tokens_user_id_idx ON public.extension_tokens (user_id);

ALTER TABLE public.extension_tokens ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.extension_tokens FROM anon, authenticated;
