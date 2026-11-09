# Owner to-do list

Items that need the owner, not code. Updated 2026-11-09.

## Before the next production deploy

1. Generate a secret and add it as `CRON_SECRET` to the Vercel project, Production environment. The cleanup route now rejects every call while the secret is unset, so the daily retention sweep stops until you add it. Vercel sends the secret as a Bearer token on each cron call (https://vercel.com/docs/cron-jobs/manage-cron-jobs).
2. Make sure that Vercel has `SUPABASE_SECRET_KEY` (the `sb_secret_...` key) for Production. The code no longer reads `SUPABASE_SERVICE_ROLE_KEY`. Do not deactivate the legacy keys in Supabase until this code is deployed, because the running deployment still uses the old variable. Supabase says the legacy keys keep working until the end of 2026 (https://supabase.com/docs/guides/getting-started/migrating-to-new-api-keys).
3. Make sure that production has no duplicate checkout sessions in `delivery_links`. Migration `20261110000000` adds a unique constraint on `stripe_checkout_session_id`, and `db push` fails if duplicates exist. Run this query in the Supabase SQL editor for the production project. It must return no rows. If it returns rows, do not push, and send me the output.
   ```sql
   select stripe_checkout_session_id, count(*) from public.delivery_links where stripe_checkout_session_id is not null group by 1 having count(*) > 1;
   ```
4. Apply the database migrations to production before you deploy the request-link code (Phase 2) and the webhook idempotency code (Phase 0). The CLI is already linked to production. Production already has the schema of the first two migrations, so mark them as applied first. `migration repair` changes only the history table and runs no SQL (https://supabase.com/docs/guides/deployment/database-migrations). Run these commands in order. Before you push, make sure that `migration list` shows only these four as missing on the remote: `20261107000000` (request links), `20261109000000` (the `opened_at` column for the student's Opened stop), `20261110000000` (the `stripe_events` table and the unique checkout session) and `20261111000000` (the credit ledger: `plan_catalog`, `credit_grants`, `credit_events`, `consume_credit`, and the stage and year columns on `students`). The credits migration adds no catalog rows, so the production catalog stays empty until you enter prices in the admin screen. It also limits which `students` columns a logged-in student can update. No current code updates that table with a student session.
   - `npx supabase migration repair --status applied 20261106000000 20261106000001`
   - `npx supabase migration list`
   - `npx supabase db push`
5. After the push, make sure that production matches the migrations. Run `npx supabase db diff --remote --schema public`. The CLI builds a database from `supabase/migrations` and compares it with production (from `npx supabase db diff --help`, CLI on 2026-11-09). If it prints SQL, production has schema changes that the migrations do not hold. Send me the output. Nobody compared production with the baseline migration after the dump on 2026-11-06.
6. Make sure that the Stripe webhook endpoint is `https://www.readmystudent.com/api/webhooks/stripe` and that it listens for `checkout.session.completed`. The apex domain answers with a 307 redirect, so do not use `https://readmystudent.com/...`.
7. After the deploy, look at the webhook endpoint in the Stripe Dashboard for failed deliveries. The webhook now answers 500 when processing fails, so that Stripe retries. Stripe retries "for up to three days with an exponential back off in live mode" (https://docs.stripe.com/webhooks.md). Repeated failures for one event mean a real fault, so read the Vercel logs for `[webhook] Failed to process`.

## Stripe and tax

1. Turn on UPI in the Stripe Dashboard payment method settings. UPI is in INR only, and recurring UPI payments have a limit of INR 15,000 (https://docs.stripe.com/payments/upi/accept-a-payment.md?payment-ui=checkout).
2. Get an answer from an Indian tax advisor about GST registration. Stripe says that remote sellers of digital services to Indian consumers "must register for IGST purposes from the first sale" (https://docs.stripe.com/tax/supported-countries/asia-pacific/india). [UNVERIFIED] It is not settled whether this service is in that category.

## Business decisions

1. Decide the rest of BRD DEC-05: enrollment interruptions and repeat degrees (for example a second master's). Until then, an admin corrects a student's stage or year by hand.
2. Fix the PhD bulk price (BRD DEC-09: $259 for 100 credits costs more than 100 single credits at $2.55). This is a catalog value in the admin screen, so no code waits on it.
3. Enter the INR amount for each catalog item in the admin screen when it is built (Phase 1). The USD amounts come from BRD v2.0 §3. The BRD has no INR amounts.
4. Decide on professor identity checks beyond the minimum in the plan (domain shown to schools, free-mail warning, self-request block).
5. Approve the BRD v2.1 edits for "credit on request" (sections 1.2, 5.2, 7.1-7.2, 9, 9.1, UAT-13, UAT-14 and DEC-10).
6. Collect real testimonials, with written permission from each person, if you want a reviews section again. The placeholder reviews and user counts were removed on 2026-11-08. The old card layout is `src/components/marketing/SocialProof.tsx` in git history before that date.

## Legal

1. Get an Indian lawyer to review the high-school parental-consent flow before the HS launch. [UNVERIFIED] The DPDP rules on children start about 13 May 2027, per a third-party transcription (https://dpdpa.com).
2. Have the legal pages reviewed. The redesign on 2026-11-08 kept their wording word for word, but these statements do not match the code [INFERRED from a code search, not a legal opinion]:
   - Terms §4 and Privacy §5 say that every link expires after submission and cannot be reused. Only school links expire, and a verified school session can reopen its link until it expires (`src/app/view/[token]/actions.ts`).
   - Terms §1 and §3 and Privacy §1 and §2 describe "viewers (such as universities or employers)" as account holders. Schools have no accounts. They open an emailed link.
   - Terms §6 mentions "additional recommendation links and premium plans". The only charge in the code is $5 per school delivery. Terms also says that payments are non-refundable, which conflicts with the 7-day refund decision.
   - The Terms "Last updated" date is today's date on every page load. The Privacy date `01/02/2026` can be read as January or February. Set real effective dates.
   - The FERPA page claims "bank-grade", "end-to-end", and "AES-256" encryption, "immutable digital waivers", and "US-based data centers". The repo shows private storage buckets but no waiver step, and server-side storage is not end to end. Confirm each claim or remove it. "Is this compliant for University use? Yes" and "We act as a data processor" need a lawyer.

## Copy to confirm

1. The delivery-declined email now says "To get a refund of the $5.00 delivery fee, contact support." The old text promised an automatic refund within 5 to 10 business days, and no code issues refunds (`rejectDelivery` in `src/app/actions/letters.ts`).
2. The redesigned pricing and FAQ pages state these facts, which come from the code: a professor approves each school delivery, the school link is valid for 48 hours after approval, only the first opening is logged, and each school is a separate $5 delivery. Confirm that you want them public.
3. The pricing page says "Yearly plans are coming. Today you pay per school." Change or remove it before the launch of Phase 1.
4. The for-faculty page heading says "Ten minutes. One link. Free." No data supports "ten minutes". Keep it as a promise, or measure it after launch.
5. The for-students page says "Many programs weigh a letter more when the student has not seen it." This is a general claim about admissions with no source. Keep it with a source, or cut it.

## Security follow-up

1. Review the Supabase Storage logs for reads of the `letters` bucket while the open policy "Allow access to objects via signed URLs 14plhp_0" existed. The policy was dropped on 2026-11-06. All three buckets are private (`public = false`, from a production dump on 2026-11-06).

## Decided (for the record)

| Topic | Decision |
|---|---|
| Testing | Local Supabase stack only. No hosted staging project. |
| Currency | Detect India from the visitor IP and show INR. USD everywhere else. |
| Admin | A full admin dashboard for owners and admins, with the price catalog first. |
| Year N | The student's year in school. The student picks it at signup, and it advances by one on each 12-month anniversary of that date. Renewal charges the next year's price. Only an admin changes it otherwise (2026-11-09). |
| Free UG credits (DEC-04) | The 3 free credits per year in Years 1 to 4 stack on a paid membership (2026-11-09). |
| Credit expiry (DEC-01, 02, 03) | Each grant gets its end date when it is created. UG paid credits end at the end of Year 5, even after a skipped renewal. Master's Year 1 credits end at the end of Year 2. A top-up follows its stage. HS and PhD credits never expire, and HS credits carry into UG. These are defaults in the catalog, editable in the admin screen (2026-11-09). |
| PhD pricing | A flat per-credit price and an optional bulk pack, both catalog rows. No tier logic (2026-11-09). |
| No response | The credit returns after 7 days. The professor gets a reminder on day 3. |
| Region | Stay in the current Supabase region, `us-west-2`. |
