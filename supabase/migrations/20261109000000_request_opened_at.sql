-- When the professor first opened the emailed request link, so the student's
-- board can show the Opened stop. Set once, from the page's client code.
ALTER TABLE public.letter_requests
  ADD COLUMN IF NOT EXISTS opened_at timestamptz;
