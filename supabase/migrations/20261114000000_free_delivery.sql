-- Phase 3: sending a letter to a school is free. No Stripe payment per delivery.
--
-- payment_status keeps its name: 'pending' waits on the professor, 'paid' means
-- approved and live (the name dates from the $5 delivery), 'used' is the first
-- verified open, 'rejected' is a professor decline. The old check left out
-- 'used' and 'rejected', so the first-open log and declines both failed.
ALTER TABLE public.delivery_links DROP CONSTRAINT delivery_links_payment_status_check;
ALTER TABLE public.delivery_links ADD CONSTRAINT delivery_links_payment_status_check
  CHECK (payment_status IN ('unpaid', 'pending', 'paid', 'used', 'rejected', 'refunded'));

COMMENT ON COLUMN public.delivery_links.recipient_email IS
  'The school address, kept only until the professor approves (and the school is emailed) or declines. recipient_email_hash stays for the email gate.';
