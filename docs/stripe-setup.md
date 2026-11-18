# Stripe setup walkthrough

Written 2026-11-10 for the owner. These are the Stripe Dashboard steps that the code needs before memberships and credit packs go live. Each Stripe claim has a link to the Stripe page it comes from. The quotes came through an automated fetch tool on 2026-11-10, so the Dashboard can look different. If a label does not match, follow the linked page.

Stripe calls its test environment a "sandbox". Older pages and some Dashboard URLs still say "test mode" (`/test/` in the URL).

## Part 1: Account (live mode, once)

1. Finish business verification at https://dashboard.stripe.com/account/onboarding. Stripe says "To use a service in live mode, verify your business and complete its activation requirements" (https://docs.stripe.com/get-started/account/set-up).
2. Set the public details at https://dashboard.stripe.com/settings/public: business name, website, support email, and statement descriptor. Customers see these on receipts and card statements. "Statement descriptors are limited to between 5 and 22 characters. They must contain at least 5 letters" (https://docs.stripe.com/get-started/account/checklist).
3. Work through the rest of that checklist: two-step login for your Stripe account, notification emails, and bank details.

## Part 2: Settings in each environment

Do steps 1 to 3 in the sandbox first, then again in live mode. For the portal, Stripe says "Configure the portal separately for sandboxes ... and live mode" (https://docs.stripe.com/customer-management/integrate-customer-portal). [INFERRED] The other two settings do not carry over either: Stripe says objects "created in a sandbox environment ... aren't usable in live mode" (https://docs.stripe.com/get-started/checklist/go-live).

1. Turn on UPI at https://dashboard.stripe.com/settings/payment_methods. Checkout then shows UPI to buyers in India by itself, because the code does not fix a list of payment methods. Stripe says: "Enable UPI in your Dashboard. Stripe automatically displays UPI to eligible customers using dynamic payment methods" (https://docs.stripe.com/payments/upi/accept-a-payment.md?payment-ui=checkout).
   - A US Stripe account can accept UPI. The same page lists "Supported business locations: US, EU, CA, GB, AU, SG, CH" and "Subscription mode: Yes".
   - UPI works only for INR prices. "Recurring payments are limited to a maximum of 15,000 INR" (https://docs.stripe.com/payments/upi). Make sure that every INR membership price in the admin screen is 15,000 INR or less. [INFERRED] A yearly price above that cannot renew through UPI AutoPay.
2. Turn on the customer portal at https://dashboard.stripe.com/settings/billing/portal (sandbox: https://dashboard.stripe.com/test/settings/billing/portal). The dashboard button "Manage or cancel membership" opens it.
   - Click "Activate link" (https://docs.stripe.com/customer-management/activate-no-code-customer-portal).
   - Turn on "Cancel subscription". Stripe: "After canceling, customers can still renew subscriptions until the billing period ends" (https://docs.stripe.com/customer-management/configure-portal).
   - [OPINION] If the page offers "at the end of the billing period" or "immediately", pick the end of the period, so that a student keeps the year they paid for. [UNVERIFIED] The Stripe pages read on 2026-11-10 did not show this choice in the Dashboard.
3. Set "Upcoming renewal events" at https://dashboard.stripe.com/settings/billing/automatic, in the "Prevent failed payments" section. The code moves each membership to next year's price when the `invoice.upcoming` event arrives, and Stripe sends that event a number of days before renewal "based on the number set for Upcoming renewal events in the Dashboard" (https://docs.stripe.com/billing/subscriptions/webhooks).
   - [OPINION] Pick 7 days or more. Stripe retries a failed webhook "for up to three days with an exponential back off in live mode" (https://docs.stripe.com/webhooks), and a renewal that misses the switch charges last year's price.
   - [UNVERIFIED] The allowed range of days is not in the Stripe docs. Use what the field accepts.
   - A change "takes effect on the next billing period" for existing subscriptions (same page).

## Part 3: Webhook endpoint (live mode)

Local tests use the Stripe CLI instead of a sandbox endpoint (Part 4), because testing happens on the local stack only.

1. Open https://dashboard.stripe.com/webhooks and click "Create an event destination". Choose "Your account" (https://docs.stripe.com/webhooks).
2. Select these 8 events. They are the events that `src/lib/stripe-billing.ts` handles:
   - `checkout.session.completed`
   - `checkout.session.async_payment_succeeded`
   - `invoice.paid`
   - `invoice.upcoming`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `charge.refunded`
3. Choose the "Snapshot" payload, not "Thin". Stripe recommends Thin for new integrations, but the code reads the full object inside each event (`event.data.object`), and a Thin event does not carry it.
4. Choose "Webhook endpoint" and enter `https://www.readmystudent.com/api/webhooks/stripe`. Do not use the address without `www`: it answers with a redirect.
5. Reveal the signing secret (it starts with `whsec_`) and put it in Vercel as `STRIPE_WEBHOOK_SECRET` for Production. "If you use the same endpoint for both test and live API keys, the secret is different for each one" (https://docs.stripe.com/webhooks).
6. Make sure that Vercel Production has the live keys: `STRIPE_SECRET_KEY` (`sk_live_...`) and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (`pk_live_...`). Then redeploy, because Vercel applies an environment variable change only to new deployments.
7. After the first live purchase, open the endpoint in the Dashboard and look for failed deliveries. The webhook answers 500 when processing fails, so that Stripe retries. Repeated failures for one event mean a real fault. Read the Vercel logs for `[webhook] Failed to process`.

## Part 4: Renewal test in the sandbox (before memberships go live)

This test answers the open question in TODO.md: whether a UPI mandate made at the Year 1 price accepts the higher Year 2 price.

1. Start the local stack and the site on port 3100 with the sandbox keys in `.env.local`.
2. Run `stripe listen --forward-to localhost:3100/api/webhooks/stripe`. Put the `whsec_...` that it prints in `.env.local` as `STRIPE_WEBHOOK_SECRET`, then restart the site.
3. Log in as a test student with the country set to India, and buy a membership with UPI.
4. In the sandbox Dashboard, open Subscriptions, click the new subscription, click "Run simulation", set a date after the renewal date, and click "Advance time" (https://docs.stripe.com/billing/testing). The clock moves at most "two subscription intervals at a time".
5. Make sure that the renewal invoice uses the Year 2 price, that it was paid, and that the student got the Year 2 credits in the dashboard.
6. Repeat with a card, in USD.
