# Owner to-do list

Items that need the owner, not code. Updated 2026-11-08.

## Before the next production deploy

1. Generate a secret and add it as `CRON_SECRET` to the Vercel project, Production environment. The cleanup route now rejects every call while the secret is unset, so the daily retention sweep stops until you add it. Vercel sends the secret as a Bearer token on each cron call (https://vercel.com/docs/cron-jobs/manage-cron-jobs).
2. Make sure that Vercel has `SUPABASE_SECRET_KEY` (the `sb_secret_...` key) for Production. The code no longer reads `SUPABASE_SERVICE_ROLE_KEY`. Do not deactivate the legacy keys in Supabase until this code is deployed, because the running deployment still uses the old variable. Supabase says the legacy keys keep working until the end of 2026 (https://supabase.com/docs/guides/getting-started/migrating-to-new-api-keys).
3. Apply the database migrations to production before you deploy the request-link code (Phase 2). The CLI is already linked to production. Production already has the schema of the first two migrations, so mark them as applied first. `migration repair` changes only the history table and runs no SQL (https://supabase.com/docs/guides/deployment/database-migrations). Run these commands in order, and make sure that `migration list` shows only `20261107000000` as missing on the remote before you push:
   - `npx supabase migration repair --status applied 20261106000000 20261106000001`
   - `npx supabase migration list`
   - `npx supabase db push`
4. Make sure that the Stripe webhook endpoint is `https://www.readmystudent.com/api/webhooks/stripe` and that it listens for `checkout.session.completed`. The apex domain answers with a 307 redirect, so do not use `https://readmystudent.com/...`.

## Stripe and tax

1. Turn on UPI in the Stripe Dashboard payment method settings. UPI is in INR only, and recurring UPI payments have a limit of INR 15,000 (https://docs.stripe.com/payments/upi/accept-a-payment.md?payment-ui=checkout).
2. Get an answer from an Indian tax advisor about GST registration. Stripe says that remote sellers of digital services to Indian consumers "must register for IGST purposes from the first sale" (https://docs.stripe.com/tax/supported-countries/asia-pacific/india). [UNVERIFIED] It is not settled whether this service is in that category.

## Business decisions

1. Decide BRD DEC-01 to DEC-05 and DEC-09 (leftover HS credits at college start, missed renewals, top-up expiry, stacking of free UG credits, gap years, and DEC-09).
2. Set the price points in USD and INR for each plan. These go in the admin catalog screen, not in code.
3. Confirm how the year in school advances. [OPINION] Recommendation: the student declares the year at signup, the year goes up by one at each renewal, and a change outside renewal needs an admin. The price changes by year, so a student who sets their own year at will can pick the cheapest year.
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
| Year N | The student's year in school. |
| No response | The credit returns after 7 days. The professor gets a reminder on day 3. |
| Region | Stay in the current Supabase region, `us-west-2`. |
