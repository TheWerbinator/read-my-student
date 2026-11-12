# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Students are the customers. They pay, they start every request, and they send finished letters to schools. They range from high school through PhD (stages HS, UG, Master's, PhD), plus working professionals, who sign up and pay under the PhD stage. High school students get free credits every year, and professors' children and dependents get free requests for 3 years (owner, 2026-11-11). India is the largest market, and Indian students mostly send letters to schools abroad (the US and other countries). The product serves students everywhere, not only in India.

Professors and other recommenders write the letters. They get an emailed link from a student's request and can write, sign, and finalize the letter, or decline, without an account. They pay nothing and owe the student nothing, so their time is the scarce resource.

Admissions offices and other receivers open a finished letter through a secure link that the student sends. They need to trust that the letter is authentic and unaltered.

Owners and admins manage the price catalog and accounts through an admin dashboard. The catalog screen (`/admin`) is built but not yet in production; account management is planned.

## Product Purpose

ReadMyStudent gets a student from "I need a letter" to "the school has my letter" with less effort and less waiting. Success is a student who requests a letter in minutes and gets it back fast, because the professor found it easy to write.

## Positioning

Easy for everyone, sold to students. The student is the buyer, so the main claim is a better result for the student: letters that are faster and easier to request. Ease for professors supports that claim, because a professor who can answer from one link with no account answers sooner.

Mechanisms a neighboring product cannot claim without building them:

- A professor answers from one emailed link, with no account, a reminder on day 3, and an automatic close on day 7.
- The finished letter is sealed and signed (an HMAC signature over the PDF). It is confidential: the student sees it only if the professor turns on a preview.
- Schools open the letter through a single secure link behind an email check, and each view is logged.

Interfolio is the reference competitor ("Send 50 applications anywhere for $59.99/year", https://www.interfolio.com/dossier/dossier-deliver/).

## Operating Context

- A student enters the professor's email, course context, and a personal note, and sends the request.
- The professor receives an email and opens `/r/<token>`. The writing dialog has three steps: recommender details, letterhead and signature, and the letter. The draft saves as the professor goes, and finalizing seals the letter.
- The student sees request status in the dashboard, previews the letter only if the professor allows it, and sends the letter to a school.
- The school opens `/view/<token>`, confirms an email address, and views or downloads the letter.
- Application deadlines cluster in a few months each year, so turnaround time matters to students. [INFERRED from the admissions calendar, not from product data]
- Many students in India use Android phones on mobile data. [INFERRED]

## Capabilities and Constraints

- Stack: Next.js 16 (App Router), Tailwind CSS, Supabase (auth, Postgres, storage), Stripe, Resend for email, Vercel hosting.
- Built: student requests, the no-account professor link with reminder and expiry, the letter editor, signed PDF letters, the student dashboard, the faculty dashboard and settings, and the school view.
- Planned, not built: a yearly membership with letter credits (one credit per request, returned on decline or expiry), INR prices shown to visitors detected in India by IP with USD elsewhere, a free Send to School, the rest of the admin dashboard, and a browser extension for professors. High school signup opened on 2026-11-11 with no parental consent step, pending the lawyer review in TODO.md.
- Live today: students pay $5 USD per school delivery (`DELIVERY_PRICE_CENTS` in `src/lib/stripe.ts`); professors and schools pay nothing. The site may state this.
- Decided on 2026-11-09, not yet built: USD prices from BRD v2.0, the expiry and stacking rules (DEC-01 to DEC-04), and the year in school advancing on each 12-month anniversary (the rules are in `TODO.md` under "Decided"). Undecided: INR price points, the PhD bulk price (DEC-09), and enrollment interruptions and repeat degrees (DEC-05). Do not show yearly plan prices or plan rules on the site until the plans are live.
- Terminology: "request" (a student asks one professor), "letter" (the professor's document), "finalize" or "seal" (the professor locks and signs it), "send to school" (the student shares it with one receiver).

## Brand Commitments

- Name: ReadMyStudent. The owner is YS2PC Research Group.
- Clearly an American company that serves students worldwide. Being visibly American builds trust with Indian students. Do not localize the brand into an India-only product.
- Keep the existing pen-and-book cursive logo (`public/Logo_Official*.png`), sized as a normal header mark.
- Privacy and legal trust: keep FERPA for US schools, and add India's DPDP Act for Indian users after the lawyer review in TODO.md.

## Evidence on Hand

- Real product screens: the professor request page `/r/<token>`, the student dashboard, the faculty dashboard and settings, the write dialog, and the school view `/view/<token>`.
- A sample letter template: `private/template_letter.md`.
- No testimonials, user counts, university partners, or press exist. The placeholder reviews and counts were removed on 2026-11-08. Do not invent quotes, people, logos, or numbers.
- The AI-generated illustrations in `src/assets/hero/` and the marketing pages are flagged for replacement because they contain garbled text.

## Product Principles

1. Every surface shortens the path from request to letter in the school's hands.
2. The professor owes nothing. Ask for the minimum and never require an account.
3. Show proof, not claims. The letter is sealed, signed, and confidential (a student preview only with the professor's consent), and the interface shows that instead of asserting it.
4. American company, global audience. India is the largest market, not the only one.
5. Nothing on the site states something that is not true today.

## Accessibility & Inclusion

The accessibility page commits to aiming for WCAG 2.1 Level AA "where reasonably possible" (`src/app/(marketing)/accessibility/page.tsx:43`). Names, examples, and forms must work for Indian and international users, for example PIN codes and non-US phone formats.
