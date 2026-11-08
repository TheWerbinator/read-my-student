-- Professors answer a letter request from an emailed link, with no account.

-- A request with no answer after 7 days closes as 'expired'.
ALTER TYPE public.letter_request_status ADD VALUE IF NOT EXISTS 'expired';

ALTER TABLE public.letter_requests
  -- SHA-256 of the link token. The token itself is never stored.
  ADD COLUMN access_token_hash text,
  -- First draft save (the professor accepted). Stops the reminder and the 7-day expiry.
  ADD COLUMN responded_at timestamptz,
  ADD COLUMN reminder_sent_at timestamptz;

CREATE UNIQUE INDEX letter_requests_access_token_hash_key
  ON public.letter_requests (access_token_hash);

-- A professor without an account is a faculty row with user_id null, found by
-- this email (stored lowercase). Signup attaches the account to the same row.
ALTER TABLE public.faculty ADD COLUMN email text;

CREATE UNIQUE INDEX faculty_email_without_account_key
  ON public.faculty (email) WHERE user_id IS NULL;
