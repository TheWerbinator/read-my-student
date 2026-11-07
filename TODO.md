# Owner to-do list

Items that need the owner, not code. Updated 2026-11-06.

## Before the next production deploy

1. Generate a secret and add it as `CRON_SECRET` to the Vercel project, Production environment. The cleanup route now rejects every call while the secret is unset, so the daily retention sweep stops until you add it. Vercel sends the secret as a Bearer token on each cron call (https://vercel.com/docs/cron-jobs/manage-cron-jobs).
2. Make sure that Vercel has `SUPABASE_SECRET_KEY` (the `sb_secret_...` key) for Production. The code no longer reads `SUPABASE_SERVICE_ROLE_KEY`. Do not deactivate the legacy keys in Supabase until this code is deployed, because the running deployment still uses the old variable. Supabase says the legacy keys keep working until the end of 2026 (https://supabase.com/docs/guides/getting-started/migrating-to-new-api-keys).
3. Make sure that the Stripe webhook endpoint is `https://www.readmystudent.com/api/webhooks/stripe` and that it listens for `checkout.session.completed`. The apex domain answers with a 307 redirect, so do not use `https://readmystudent.com/...`.

## Stripe and tax

1. Turn on UPI in the Stripe Dashboard payment method settings. UPI is in INR only, and recurring UPI payments have a limit of INR 15,000 (https://docs.stripe.com/payments/upi/accept-a-payment.md?payment-ui=checkout).
2. Get an answer from an Indian tax advisor about GST registration. Stripe says that remote sellers of digital services to Indian consumers "must register for IGST purposes from the first sale" (https://docs.stripe.com/tax/supported-countries/asia-pacific/india). [UNVERIFIED] It is not settled whether this service is in that category.

## Business decisions

1. Decide BRD DEC-01 to DEC-05 and DEC-09 (leftover HS credits at college start, missed renewals, top-up expiry, stacking of free UG credits, gap years, and DEC-09).
2. Set the price points in USD and INR for each plan. These go in the admin catalog screen, not in code.
3. Confirm how the year in school advances. [OPINION] Recommendation: the student declares the year at signup, the year goes up by one at each renewal, and a change outside renewal needs an admin. The price changes by year, so a student who sets their own year at will can pick the cheapest year.
4. Decide on professor identity checks beyond the minimum in the plan (domain shown to schools, free-mail warning, self-request block).
5. Approve the BRD v2.1 edits for "credit on request" (sections 1.2, 5.2, 7.1-7.2, 9, 9.1, UAT-13, UAT-14 and DEC-10).

## Legal

1. Get an Indian lawyer to review the high-school parental-consent flow before the HS launch. [UNVERIFIED] The DPDP rules on children start about 13 May 2027, per a third-party transcription (https://dpdpa.com).

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
