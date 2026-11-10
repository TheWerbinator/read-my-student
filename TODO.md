# Owner to-do list

Items that need the owner, not code. Updated 2026-11-09.

## Before the next production deploy

1. Generate a secret and add it as `CRON_SECRET` to the Vercel project, Production environment. The cleanup route now rejects every call while the secret is unset, so the daily retention sweep stops until you add it. Vercel sends the secret as a Bearer token on each cron call (https://vercel.com/docs/cron-jobs/manage-cron-jobs).
2. Make sure that Vercel has `SUPABASE_SECRET_KEY` (the `sb_secret_...` key) for Production. The code no longer reads `SUPABASE_SERVICE_ROLE_KEY`. Do not deactivate the legacy keys in Supabase until this code is deployed, because the running deployment still uses the old variable. Supabase says the legacy keys keep working until the end of 2026 (https://supabase.com/docs/guides/getting-started/migrating-to-new-api-keys).
3. Bring production up to date before you deploy Phase 3 and publish the new privacy page. The SQL of `20261114000000` (delivery statuses `used` and `rejected`) already ran on production on 2026-11-09, but the history does not record it, so record it first. Then push `20261115000000` (letter cleanup). Without it, the daily cleanup cannot delete any letter a school has opened, and the privacy page says letters are deleted after 365 days. Every command needs `--remote`, because this CLI version targets the local stack by default ("Local by default. Pass --remote for the linked project", from `npx supabase db push --help` on 2026-11-09). Make sure that the dry run lists only `20261115000000`.
   - `npx supabase migration repair --remote --status applied 20261114000000`
   - `npx supabase db push --remote --dry-run`
   - `npx supabase db push --remote`
4. Before you deploy Phase 3, make sure that production has no school delivery still waiting for approval. Deliveries paid for under the $5 flow kept the school address only in Stripe, and the new code cannot send them. Run this in the Supabase SQL editor. If it returns rows, send me the output before you deploy.
   ```sql
   select id, school_name, created_at from public.delivery_links where payment_status = 'pending';
   ```
5. After each push, make sure that production matches the migrations with `npx supabase db diff --remote --schema public`. On 2026-11-09 it showed only grant differences. Production gives the new tables to `service_role` only, while the local stack also grants them to the logged-in and anonymous roles. Production is stricter, and no code depends on those grants. Any other SQL in the output means a difference: send it to me.
6. Make sure that the Stripe webhook endpoint is `https://www.readmystudent.com/api/webhooks/stripe`. The apex domain answers with a 307 redirect, so do not use `https://readmystudent.com/...`. The endpoint must listen for these events: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `invoice.paid`, `invoice.upcoming`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted` and `charge.refunded`. School delivery no longer uses Stripe (Phase 3), so all of these serve memberships and credit purchases.
7. After the deploy, look at the webhook endpoint in the Stripe Dashboard for failed deliveries. The webhook now answers 500 when processing fails, so that Stripe retries. Stripe retries "for up to three days with an exponential back off in live mode" (https://docs.stripe.com/webhooks.md). Repeated failures for one event mean a real fault, so read the Vercel logs for `[webhook] Failed to process`.
8. Before memberships go live, set **Upcoming renewal events** in the Stripe Dashboard Billing settings. The code moves each membership to next year's price when `invoice.upcoming` arrives, and Stripe says that event is "Sent a few days prior to the renewal of the subscription. The number of days is based on the number set for Upcoming renewal events in the Dashboard" (https://docs.stripe.com/billing/subscriptions/webhooks.md). [OPINION] Pick 7 days or more: Stripe retries a failed webhook for up to three days, and a renewal that misses the switch charges last year's price.
9. Before memberships go live, test one UPI membership in test mode through a renewal. The Stripe docs do not say whether a UPI mandate created at the Year 1 price accepts the higher Year 2 price. The default mandate allows up to INR 15,000 ("This is the maximum amount that can be charged automatically with UPI AutoPay", https://docs.stripe.com/payments/upi/upi-autopay.md), which [INFERRED] should cover every BRD price, but nobody has tested it.
10. Before you deploy Phase 1 step 4 (credits on requests), enter the production catalog in the admin screen. From that deploy on, every letter request spends one credit. With an empty catalog, no student gets free credits and nobody can buy any, so nobody can send a request. Make sure that Vercel has the live Stripe keys first, because saving a paid row creates its Stripe Prices with that key.
11. Set the stage and year for each student who signed up before step 4. Production had 2 student rows on 2026-11-09. Until you set them, these students see "Year in school not set" and cannot request or buy (owner decision, 2026-11-09). Run this in the Supabase SQL editor for each one. `year_started_on` is the day their current year began: the year goes up by one on each anniversary of that date. For a PhD student, set `stage = 'phd'` and leave the other two columns null.
    ```sql
    update public.students set stage = 'ug', study_year = 2, year_started_on = '2026-09-01' where user_id = (select id from auth.users where email = 'student@example.com');
    ```
12. Set up the Stripe customer portal, once in the sandbox and once in live mode, at Customer portal settings (https://dashboard.stripe.com/settings/billing/portal). The dashboard button "Manage or cancel membership" opens it. Stripe says "Configure the portal separately for sandboxes ... and live mode" (https://docs.stripe.com/customer-management/integrate-customer-portal). Turn on subscription cancellation. [OPINION] Choose cancellation at the end of the billing period, so that a student keeps the year they paid for.

## Before real admins use the admin screen

1. Make yourself an admin after the push in item 4. Run this in the Supabase SQL editor for the production project, with your login email. Removing the row removes access on the next request.
   ```sql
   insert into public.admins (user_id) select id from auth.users where email = 'you@example.com';
   ```
2. Require MFA (an authenticator app) for the admin screen before anyone uses it with production data. BRD v2.0 §12.1 asks for "enhanced MFA for sensitive signing and administrative operations". The owner chose to ship the catalog screen with password login first (2026-11-09). Supabase marks an MFA session as `aal2` (https://supabase.com/docs/reference/javascript/auth-mfa-getauthenticatorassurancelevel).

## Stripe and tax

1. Turn on UPI in the Stripe Dashboard payment method settings. UPI is in INR only, and recurring UPI payments have a limit of INR 15,000 (https://docs.stripe.com/payments/upi/accept-a-payment.md?payment-ui=checkout).
2. Get an answer from an Indian tax advisor about GST registration. Stripe says that remote sellers of digital services to Indian consumers "must register for IGST purposes from the first sale" (https://docs.stripe.com/tax/supported-countries/asia-pacific/india). [UNVERIFIED] It is not settled whether this service is in that category.

## Business decisions

1. Decide the rest of BRD DEC-05: enrollment interruptions and repeat degrees (for example a second master's). Until then, an admin corrects a student's stage or year by hand.
2. Fix the PhD bulk price (BRD DEC-09: $259 for 100 credits costs more than 100 single credits at $2.55). This is a catalog value in the admin screen, so no code waits on it.
3. Enter the INR amount for each catalog item in the admin screen when it is built (Phase 1). The USD amounts come from BRD v2.0 §3. The BRD has no INR amounts.
4. Decide on professor identity checks beyond the minimum in the plan (domain shown to schools, free-mail warning, self-request block).
5. Update the BRD to "credit on request", which you confirmed on 2026-11-09 (sections 1.2, 5.2, 7.1-7.2, 9, 9.1, UAT-13, UAT-14 and DEC-10). BRD v2.0 still says one credit per delivery to one school.
6. Collect real testimonials, with written permission from each person, if you want a reviews section again. The placeholder reviews and user counts were removed on 2026-11-08. The old card layout is `src/components/marketing/SocialProof.tsx` in git history before that date.
7. Review the credit counts in the catalog for "credit on request". The BRD v2.0 counts (UG 20 to 50 a year, Master's 45 to 55) were set when one credit paid for one delivery to one school. [INFERRED] A student who asks 3 to 5 professors spends 3 to 5 credits, so with these counts most students would never run out and top-ups would rarely sell. Counts and prices are catalog values in the admin screen, so no code waits on this.

## Legal

1. Give your lawyer `docs/legal/privacy-and-consumer-brief.md` (written 2026-11-09). It covers India, Canada and Quebec, the UK, and Germany and the EU, with the facts from the code and a quote and source for each legal claim. Its quotes came through automated tools, so the lawyer must check them against the linked sources. Ask the lawyer to check the India DPDP start date first: if MeitY's proposed cut to 12 months was notified, most duties start on 13 November 2026 instead of 13 May 2027.
2. Decide the questions in section 4 of the brief. The biggest one: the UK, the EU, and probably Quebec give consumers a 14-day right to cancel, and Germany limits a yearly renewal to a monthly-cancellable term after the first year. "No refunds" cannot override those rights, so either the checkout and renewal terms change for those buyers, or you do not sell to them yet.
3. Have the lawyer review the new privacy page (`src/app/(marketing)/privacy/page.tsx`) and the new refunds page (`src/app/(marketing)/refunds/page.tsx`). Both are drafts written on 2026-11-09 from the code and the brief. On 2026-11-10 both pages got the privacy contact (Shawn Werber, 398 N 300 W, Cedar City, UT 84721) and the India Grievance Officer (Dr. Prosenjit Chatterjee, readmystudent@gmail.com). India's E-Commerce Rules say an e-commerce entity "shall display the name, contact details, and designation of such officer on its platform" (https://www.scconline.com/blog/post/2020/07/24/consumer-protection-e-commerce-rules-2020-comes-into-force-no-cancellation-charges-on-consumers-cancelling-after-confirming-purchase-read-notification/). The pages also offer the contact page with a "Grievance" subject, so make sure that those messages reach the officer in time to acknowledge them within 48 hours. The privacy page also promises answers to privacy requests within 30 days, and to tell users before a significant policy change. Make sure that you can keep both promises.
4. Get an Indian lawyer to review the high-school parental-consent flow before the HS launch. The brief (section 2.1) has the DPDP children rules: under 18 needs verifiable consent from an identifiable adult parent.
5. Have the terms and FERPA pages reviewed. The redesign on 2026-11-08 kept their wording word for word, but these statements do not match the code [INFERRED from a code search, not a legal opinion]:
   - Terms §4 says that every link expires after submission and cannot be reused. Only school links expire, and a verified school session can reopen its link until it expires (`src/app/view/[token]/actions.ts`).
   - Terms §1 and §3 describe "viewers (such as universities or employers)" as account holders. Schools have no accounts. They open an emailed link.
   - Terms §6 mentions "additional recommendation links and premium plans". The charges in the code are yearly memberships and extra credits. School delivery is free since Phase 3. Terms also says that payments are non-refundable. That matches the owner's no-refunds choice (2026-11-09), but the brief shows limits on it in the UK, the EU, and Quebec.
   - The Terms "Last updated" date is today's date on every page load. Set a real effective date.
   - The FERPA page claims "bank-grade", "end-to-end", and "AES-256" encryption, "immutable digital waivers", and "US-based data centers". The repo shows private storage buckets but no waiver step, and server-side storage is not end to end. Confirm each claim or remove it. "Is this compliant for University use? Yes" and "We act as a data processor" need a lawyer.

## Copy to confirm

1. School delivery is free since Phase 3, so the delivery-declined email no longer mentions a refund. The school email now ends with "ReadMyStudent is an independent service that students and professors use to deliver letters. It is not affiliated with or endorsed by [school]." (BRD 1.3). Approve that wording or send new wording.
2. The pricing and FAQ pages state these facts, which come from the code: a professor approves each school delivery, the school link is valid for 48 hours after approval, and only the first opening is logged. Confirm that you want them public. The Phase 3 copy pass (2026-11-09) replaced the $5 copy on the pricing, FAQ, for-students, and how-it-works pages and the closing section of the home page. Pricing now reads the catalog: India visitors see INR, and the page says "Prices are being set" until the catalog has items on sale. Review the new wording.
3. The for-faculty page heading says "Ten minutes. One link. Free." No data supports "ten minutes". Keep it as a promise, or measure it after launch.
4. The for-students page says "Many programs weigh a letter more when the student has not seen it." This is a general claim about admissions with no source. Keep it with a source, or cut it.
5. The membership consent box (BRD PAY-05) in `src/components/dashboard/CreditsPanel.tsx` says: "I agree that this membership renews automatically each year, charged at the price for my next year in school, until I cancel. I can cancel at any time from my dashboard." Approve it or send new wording. It may need to change after the decisions in Legal item 2, for example to add the 14-day cancellation acknowledgement for UK and EU buyers.

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
| What a credit buys | One request to one professor. The credit returns if the professor declines or does not answer in 7 days. Sending the finished letter to schools is free, with no limit (confirmed 2026-11-09, replacing BRD v2.0 §1.2 and §9). |
| No response | The credit returns after 7 days. The professor gets a reminder on day 3. |
| Region | Stay in the current Supabase region, `us-west-2`. |
