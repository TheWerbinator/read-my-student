# ReadMyStudent: privacy and consumer law brief for counsel

Prepared 2026-11-09 for review by counsel. This is research, not legal advice. It covers India, Canada (federal and Quebec, with notes on Ontario), the United Kingdom, and Germany with the EU rules behind it.

## How to read this brief

Every legal claim carries its source. The research was done with automated web tools, and their limits matter:

- Quotes were returned by a fetch tool that runs a summarizing model over each page. Treat every quote as "excerpt as reported by the tool" until someone checks it against the linked page. Several quotes are fragments.
- Labels: SECONDARY means a law-firm, vendor, or news summary, not the statute or the regulator. [UNVERIFIED] means the researcher could not confirm it. [INFERRED] means a conclusion drawn from the sources, not stated by them. [OPINION] is a judgment call.
- Some primary sites could not be read by the tools. The ICO (ico.org.uk) blocks automated clients: curl with a browser user agent also received HTTP 403 on 2026-11-09. Légis Québec returned 403, and Ontario e-Laws needs JavaScript. The Indian government sites (meity.gov.in, indiacode.nic.in, egazette.gov.in) returned 403 to the fetch tool but 200 to curl on 2026-11-09, so their primary texts can be read directly. A person needs to read these pages.

## 1. The product and its data (from the code)

These facts come from a read of the repository on 2026-11-09. File paths refer to that repository.

### 1.1 The business

ReadMyStudent is owned and operated by YS2PC Research Group LLC, a US company (`src/components/marketing/Footer.tsx`). Students ask professors for recommendation letters. A professor writes and signs the letter on the site, with or without an account. The student then sends the sealed letter to schools. Each school gets a link that opens only after the reader types the school's email address.

Students pay for credits. One credit pays for one request to one professor, and it comes back if the professor declines or does not answer within 7 days. Students buy a yearly membership that renews automatically (card, or UPI AutoPay in India), or one-time credit packs. Prices show in INR for visitors whose IP is in India and in USD elsewhere. Sending a letter to schools is free. The owner's chosen refund policy is "no refunds; cancel any time to stop the next renewal; you keep your credits until they expire". The current draft of the refunds page is `src/app/(marketing)/refunds/page.tsx`.

Signup offers high school, undergraduate, Master's, and "PhD or working professional". Since 2026-11-11, high school students (mostly under 18) can sign up with no parental consent step, by the owner's decision. There is no age or date-of-birth field and no age gate (`src/components/auth/sign-up-form.tsx`, `src/lib/schemas.ts`). Also since 2026-11-11, an admin can invite a professor's child or dependent by name and email (`public.dependent_invites`), so the site keeps that data about a person who did not give it.

### 1.2 Where data is stored, and who receives it

| Recipient | What it receives | Location |
|---|---|---|
| Supabase (database, authentication, file storage) | All account data, letters, PDFs, logos, signatures, logs | AWS us-west-2, USA (`TODO.md`, the Supabase pooler host). Project ref `hzcubrhzoafrxwqrltjz`. |
| Vercel (hosting, daily cron) | All requests to the site. The code reads `x-forwarded-for`, `x-real-ip`, and `x-vercel-ip-country`. | Function region not set in the repo [UNVERIFIED]. |
| Stripe (payments) | Student email and internal student id on the Stripe customer. Checkout and subscription metadata: purpose, student id, catalog id, renewal consent time. Card details are entered in Stripe's own form. | Stripe's locations not checked [UNVERIFIED]. |
| Resend (email) | Professor request emails (student name, university, course, note), approval emails (school name and address), school delivery emails (student name, school name), student notices, and contact-form messages (sender address and text). | Not checked [UNVERIFIED]. |
| OpenAlex (university search) | The text a visitor types into the university search, the country code, and an optional contact email. No visitor IP is forwarded. | `src/app/api/universities/route.ts` |

No analytics, advertising, or error-reporting script was found in the code or the dependencies. Google Fonts are downloaded at build time and served by the site, so browsers do not contact Google (`node_modules/next/dist/docs/01-app/03-api-reference/02-components/font.md`, line 13). The only third-party script loaded in the browser is Stripe.js, inside the credits panel (`src/components/dashboard/CreditsPanel.tsx`).

### 1.3 Personal data by person

| Person | Data | Notes |
|---|---|---|
| Student | Name, email, password (hashed by Supabase), university, program, graduation date, stage, year in school, signup date for the year, Stripe customer id, subscription state, credit ledger, the professor emails they enter, course context and personal notes, school names and admissions addresses they enter | Country is asked at signup but not saved. |
| Professor | Name, email, title, institution, department, mailing address, prefix, logo, signature image, the letter text, the IP address and user agent at finalization | A "recommender snapshot" saved with each letter also holds the professor's email and phone, which are not printed on the PDF. Professors without an account are stored by email only. |
| School reader | The admissions address typed by the student (kept in clear text until the professor approves or declines, then cleared), a hash of that address, and the IP address and user agent when the reader verifies the email and downloads the letter | The address the reader types at the gate is hashed and compared, not stored. |
| Visitor | No tracking. The IP address is used only as an in-memory rate-limit key for university search. | |
| Contact-form sender | Email, subject, message | Emailed to staff, not stored in the database. |

The letter is the most sensitive item. It is the professor's assessment of the student, and it may mention health, disability, or personal circumstances. That makes Article 9 (special category) questions live under the GDPR and UK GDPR.

### 1.4 Cookies and browser storage

- `rms-view-<hash>`: set after a school reader verifies the email. HttpOnly, Secure in production, SameSite Strict, 4 hours, scoped to that letter's path (`src/app/view/[token]/actions.ts`).
- Supabase sign-in cookies (`sb-...-auth-token`): set by the Supabase library with its defaults, which are a 400-day lifetime, SameSite Lax, and not HttpOnly (`node_modules/@supabase/ssr/dist/main/utils/constants.js`).
- Browser local storage: `rms_recent_schools` (up to five school names and addresses the student sent to, no expiry) and `letterDraft:<student name>` (a professor's unsent draft in one rare path).
- Stripe.js may set its own cookies during payment [UNVERIFIED which ones].

### 1.5 Retention and deletion

- Letters and their PDFs: deleted by a daily job 365 days after finalization (`src/app/api/cron/cleanup/route.ts`). Until migration `20261115000000` reaches production, the delete fails for any letter a school has opened, because a foreign key blocked the cascade. This was confirmed on the local database on 2026-11-09. The migration deletes the access events (with IP and user agent) along with the letter.
- Professor logos and signatures: deleted 365 days after upload, unless refreshed.
- School admissions address: cleared when the professor approves or declines. A delivery the professor never answers keeps the address with no time limit.
- Kept with no deletion path: accounts, letter requests, the credit ledger (`credit_grants`, `credit_events`, built append-only), the catalog change log, and the list of processed Stripe event ids.
- There is no self-service account deletion or data export. Requests go through the contact page. The database blocks deleting a sign-in account while its student or professor row exists, so deletion needs a manual procedure.

## 2. What each jurisdiction asks of a site like this

### 2.1 India

**Reach.** The DPDP Act s.3(b) applies outside India "in connection with any activity related to offering of goods or services to Data Principals" (third-party reproduction of the Act, https://www.prashantkanha.com/the-digital-personal-data-protection-act-2023/, not checked against the Gazette). Pricing in INR for Indian visitors points to offering services in India [INFERRED].

**Commencement.** The DPDP Rules were notified on 13 November 2025 (some sources say 14 November). Per the rule text as reproduced at https://www.dpdpa.com/dpdparules/rule1.html: "Rules 1, 2 and 17 to 21 shall come into force on the date of their publication", "Rule 4 shall come into force one year after", and "Rules 3, 5 to 16, 22 and 23 shall come into force eighteen months after". That puts notice, consent, children, breach, rights, and retention duties at about 13 May 2027. MeitY proposed cutting the 18 months to 12 in January 2026, which would make the date 13 November 2026. A search on 2026-11-09 found the proposal described as not notified, with one tracker saying so as of October 2026 (https://dpdprules.org/blog/dpdp-18-months-to-12-months-proposal, https://chambers.com/articles/meity-plans-to-cut-short-dpdp-compliance-timeline-and-notify-cross-border-restrictions-for-sdfs, both SECONDARY). **Counsel should check the Gazette first, because the shortened date would be days away.**

**Notice (s.5, Rule 3).** The notice must accompany or precede a consent request. Rule 3 asks that it "be presented and be understandable independently of any other information", give "an itemised description of such personal data", state "the specified purpose or purposes", and explain how to "withdraw her consent, with the ease of doing so being comparable to that with which such consent was given" (https://www.dpdpa.com/dpdparules/rule3.html, a reproduction by an advocate, to be checked against G.S.R. 846(E)). The principal may access the notice "in English or any language specified in the Eighth Schedule" (s.5(3)). English alone appears to satisfy this on its face [INFERRED].

**Consent and legitimate uses.** Consent must be "free, specific, informed, unconditional and unambiguous with a clear affirmative action" (s.6(1)). The fiduciary must be able to prove the notice was given (s.6(10)), so consent records should be kept. Whether the "voluntarily provided" legitimate use in s.7(a) covers the core letter flow is not settled [UNVERIFIED]. The researcher's view was to plan on notice plus consent [OPINION].

**Children.** A child is anyone under 18 (s.2(f)). Processing needs "verifiable consent of the parent" (s.9(1)), and the fiduciary "shall not undertake tracking or behavioural monitoring of children" (s.9(3)). Rule 10 requires due diligence that the parent "is an adult who is identifiable", for example through DigiLocker (https://www.dpdpa.com/dpdparules/rule10.html). An email checkbox is probably not enough [INFERRED]. Rule 12 exemptions were not read [UNVERIFIED]. This bites on undergraduates aged 17 as well as high-school students.

**Transfers.** Transfers abroad are allowed unless the government restricts them by notification (s.16(1); Rule 15). No restriction list was found as of about September 2026 (SECONDARY, https://www.mondaq.com/india/data-protection/1764976/from-localisation-debates-to-a-negative-list-making-cross-border-data-transfers-work-under-indias-dpdp-act).

**Contact, rights, breach, retention.** Publish "the business contact information" of a DPO or a person who can answer questions (s.8(9), Rule 9). Answer rights requests "within a reasonable period not exceeding ninety days" (Rule 14). Notify the Board and each affected person of a breach, with a detailed report to the Board "within seventy-two hours" (Rule 7). Erase data once its purpose ends (s.8(7)), and give at least 48 hours' warning before erasure (Rule 8). Rules 6 and 8 also require keeping logs for at least one year. All of these start with the 18-month group.

**Consumer law (in force now).** The Consumer Protection (E-Commerce) Rules 2020 apply to "a e-commerce entity which is not established in India" that systematically offers to Indian consumers (SCC Online reproduction, https://www.scconline.com/blog/post/2020/07/24/consumer-protection-e-commerce-rules-2020-comes-into-force-no-cancellation-charges-on-consumers-cancelling-after-confirming-purchase-read-notification/). A grievance officer must "acknowledge the receipt of any consumer complaint within forty-eight hours" and "redress the complaint within one month". The rules also ban cancellation charges on consumers who cancel after confirming purchase. No provision found forbids a no-refund term outright. A refusal to refund a deficient service can be an unfair trade practice under the Consumer Protection Act 2019 (SECONDARY, https://nishithdesai.com/default.aspx?id=4536). The CCPA dark-pattern guidelines (2023) list a "subscription trap", "making cancellation of a paid subscription impossible or a complex and lengthy process" (https://taxguru.in/?p=896142, a reproduction).

**Recurring payments.** The RBI Digital Payments E-mandate Framework 2026 (21 April 2026, https://www.rbi.org.in/Scripts/BS_ViewMasDirections.aspx?id=13374, read through the summarizer) requires a pre-debit notice "at least 24 hours prior to the actual charge / debit" with the merchant name, amount, and date. It lets recurring payments go through without extra authentication "up to ₹15,000/- per transaction". It binds banks and acquirers, so it reaches the site through Stripe. Whether Stripe supports these mandates for a US merchant selling in INR was not checked [UNVERIFIED].

### 2.2 Canada

**Federal law.** PIPEDA is the law in force. Bill C-27 died in January 2025 (SECONDARY, https://gowlingwlg.com/en/insights-resources/articles/2026/ottawa-tables-long-awaited-federal-privacy-reform-legislation). Its successor, Bill C-36, was "At second reading in the House of Commons" (https://www.parl.ca/legisinfo/en/bill/45-1/c-36). The OPC applies a "real and substantial connection" test to foreign sites, looking at the target audience and the operator's location (an OPC finding, https://www.priv.gc.ca/en/opc-actions-and-decisions/investigations/investigations-into-businesses/2026/pipeda-2026-004/).

**Policy contents (PIPEDA Schedule 1, https://laws-lois.justice.gc.ca/eng/acts/p-8.6/page-7.html).** The policy must include "the name or title, and the address, of the person who is accountable" (4.8.2(a)), "the means of gaining access to personal information" (4.8.2(b)), and "a description of the type of personal information held by the organization, including a general account of its use" (4.8.2(c)).

**Transfers to the US.** The OPC's 2009 guidance says "Organizations need to make it plain to individuals that their information may be processed in a foreign country" and that "it may be accessible to law enforcement and national security authorities of that jurisdiction" (https://www.priv.gc.ca/en/privacy-topics/personal-information-transferred-across-borders/gl_dab_090127/).

**Minors.** The OPC's position is that parental consent is needed for anyone unable to give meaningful consent, which "in all but exceptional circumstances, this includes anyone under the age of 13" (https://www.priv.gc.ca/en/privacy-topics/privacy-laws-in-canada/the-personal-information-protection-and-electronic-documents-act-pipeda/p_principle/principles/p_consent/). An OPC Children's Privacy Code launched on 20 October 2026 for comment until 20 January 2027. Its binding force is unclear (https://www.priv.gc.ca/en/opc-news/news-and-announcements/2026/nr-c_261020/).

**Rights and breaches.** Respond to access requests "not later than thirty days after receipt" (s.8(3), https://laws-lois.justice.gc.ca/eng/acts/p-8.6/page-2.html). Report breaches that create a real risk of significant harm, and keep "a record of every breach of security safeguards for 24 months" (SOR/2018-64 s.6(1), https://laws-lois.justice.gc.ca/eng/regulations/SOR-2018-64/page-1.html).

**Quebec privacy (Law 25).** The statute text could not be read (Légis Québec 403). The following comes from CAI guidance:
- The Act reaches organizations outside Quebec that deal in personal information through business activities there (https://www.cai.gouv.qc.ca/protection-renseignements-personnels/information-entreprises-privees/champ-application-loi_entreprises).
- "Le titre et les coordonnées du responsable doivent être publiés sur le site Web de l'entreprise" (https://cai.gouv.qc.ca/protection-renseignements-personnels/sujets-et-domaines-dinteret/principaux-changements-loi-25). By default the highest authority in the company is the person responsible.
- A privacy policy is mandatory when data is collected through technology (https://www.cai.gouv.qc.ca/protection-renseignements-personnels/information-entreprises-privees/collecte-renseignements-personnels_entreprises).
- Under 14, data cannot be collected from the minor without parental consent unless collection clearly benefits the child.
- A privacy impact assessment and a written agreement are required before communicating personal information outside Quebec (https://cai.gouv.qc.ca/evaluation-facteurs-relatifs-vie-privee/communication-renseignements-personnels-exterieur-quebec). Whether direct collection by a US company counts as "communicating outside Quebec" is arguable.
- Keep an incident register "pour une période minimale de cinq ans" (https://www.cai.gouv.qc.ca/protection-renseignements-personnels/information-entreprises-privees/incidents-confidentialite-mesures-securite-entreprises).
- Whether a non-Quebec merchant must publish a French version is unsettled. SECONDARY sources conflict (https://www.smartbiggar.ca/insights/publication/french-language-requirements-quebec-language-commercial-publications-websites-social-media).

**Quebec consumer law.**
- An online subscription cancel button has been required since 12 September 2026: "permettre au consommateur d'exercer aisément son droit de résiliation au moyen d'un bouton accessible en ligne et facilement repérable" (https://www.opc.gouv.qc.ca/commercant/nouvelles-obligations).
- OPC guidance for telecom says a consumer may cancel a remotely supplied continuing service "à tout moment", with a capped termination indemnity. It also says a fixed term over 60 days cannot auto-renew into another fixed term (https://www.opc.gouv.qc.ca/commercant/secteur/telephonie-television-internet/internet/changement/renouvellement). Whether this applies to a non-telecom digital membership is not settled.
- If it does, "no refund of the unused term" and "cancel stops only the next renewal" would conflict with it [INFERRED].

**Ontario.** The Consumer Protection Act 2002 governs internet agreements: clear disclosure before the contract, an express chance to accept or decline, and a copy within 15 days (SECONDARY, https://www.weirfoulds.com/online-protection). The 2023 replacement act, which would require explicit consent to each renewal, was not in force as of the latest sources found (SECONDARY, https://www.torys.com/our-latest-thinking/torys-quarterly/q4-2025/consumer-protection-in-canada). Counsel should check e-Laws.

### 2.3 United Kingdom

**Reach and representative.** UK GDPR Art. 3(2) covers offering services to people in the UK (https://www.legislation.gov.uk/eur/2016/679/article/3). Art. 27 requires a non-UK controller to "designate in writing a representative", unless processing "is occasional" and does not include special category data on a large scale (https://www.legislation.gov.uk/eur/2016/679/article/27). A continuous membership service that may hold health data in letters is unlikely to fit the exemption [INFERRED].

**Notice contents.** Articles 13 and 14 list the required items (https://www.legislation.gov.uk/eur/2016/679/article/13, https://www.legislation.gov.uk/eur/2016/679/article/14). Article 14 matters here, because professors supply data about students, and students supply professor and school addresses. Article 14 adds "the categories of personal data concerned" and "from which source the personal data originate".

**Lawful bases and special category data.** Contract (Art. 6(1)(b)) fits accounts, billing, and the letter flow. Legitimate interests (Art. 6(1)(f)) fits security. Consent fits optional cookies. A letter that mentions health needs an Article 9 condition. Explicit consent from the student is the likeliest, and the alternative is a design rule telling professors to leave health out (https://www.legislation.gov.uk/eur/2016/679/article/9). That choice is for counsel.

**Children.** The age for consent-based processing is 13 (UK GDPR Art. 8). The Children's code covers services "likely to be accessed" by under-18s, and its standards "are cumulative and interdependent" (ICO pages, read only through search summaries because ico.org.uk blocks automated clients). The code would apply if minors are accepted.

**Transfers.** Under the UK-US data bridge, "the relevant recipient must be certified to the UK Extension and appear on the DPF List" (https://www.gov.uk/government/publications/uk-us-data-bridge-supporting-documents/uk-us-data-bridge-factsheet-for-uk-organisations). Whether Supabase, Vercel, Stripe, and Resend are certified with the UK Extension was not checked [UNVERIFIED].

**Cookies.** Since 5 February 2026, PECR Schedule A1 allows storage for statistical purposes without consent if the user gets clear information and "a simple means of objecting, free of charge" (https://www.legislation.gov.uk/ukpga/2025/18/schedule/12). The site has no analytics today, and its cookies are strictly necessary [INFERRED].

**Rights and breach.** Report breaches to the regulator "not later than 72 hours after having become aware of it" (Art. 33). The regulator became the Information Commission on 30 September 2026 (SECONDARY, https://www.lexisnexis.co.uk/legal/news/duaa-2025-provisions-establishing-new-information-commission-come-into-force-on-30-september-2026).

**Consumer law.** The Consumer Contracts Regulations 2013 give a 14-day cancellation right: "the cancellation period ends at the end of 14 days after the day on which the contract is entered into" (reg 30, https://www.legislation.gov.uk/uksi/2013/3134/regulation/30). For digital content, the right is lost only if "the consumer has given express consent" and "has acknowledged that the right to cancel ... will be lost" (reg 37). For services, the right ends only when the service is "fully performed" after an express request (reg 36). A yearly membership is not fully performed within 14 days [INFERRED]. Missing cancellation information extends the period by 12 months (reg 31). The Consumer Rights Act 2015 makes a term "not binding on the consumer" to the extent it excludes remedies for faulty digital content or services (ss.47, 57). The DMCCA 2024 subscription rules (reminders, cooling-off after renewal) are not in force: the government "anticipate[s] that the regime will commence in spring 2027" (https://www.gov.uk/government/consultations/consultation-on-the-implementation-of-the-new-subscription-contracts-regime/outcome/government-response-to-consultation-on-the-implementation-of-the-new-subscription-contracts-regime-web-accessible-version).

### 2.4 Germany and the EU

**GDPR.** The notice items and the Article 27 representative rule match the UK text (https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32016R0679). Germany uses 16 as the age for consent-based processing (Art. 8, with no German derogation per SECONDARY https://childreninthedigitalworld.twobirds.com/home/germany). Whether the notice must be in German is not settled by any source found.

**Transfers.** The EU-US Data Privacy Framework rests on Implementing Decision (EU) 2023/1795. The General Court dismissed the annulment action (T-553/23) on 3 September 2025, and the appeal C-703/25 P was pending (SECONDARY sources, https://eur-lex.europa.eu/eli/C/2025/6610/oj/eng for the appeal notice). Counsel should check the live docket. Each US recipient must be on the DPF list [UNVERIFIED for all four].

**Cookies.** TDDDG § 25 requires consent for storage on the device unless it is "unbedingt erforderlich" for a service the user asked for (https://www.gesetze-im-internet.de/ttdsg/__25.html). The site's cookies appear to be strictly necessary [INFERRED].

**Impressum.** DDG § 5 requires provider details for commercial digital services (https://www.gesetze-im-internet.de/ddg/__5.html). Whether it binds a non-EU provider targeting Germany was not settled [UNVERIFIED].

**Consumer law.** These points carry the highest risk for the owner's policy:
- The 14-day withdrawal right applies to distance contracts (BGB § 312g, Directive 2011/83 Art. 9). Directive Art. 25 makes contract terms that waive or restrict these rights not binding on the consumer.
- For paid digital content, the right lapses only with express prior consent, acknowledgement, and confirmation on a durable medium (BGB § 356; counsel should confirm the current paragraph numbering, which the tool reported inconsistently).
- A cancellation button ("Verträge hier kündigen", then "jetzt kündigen") is required for online continuing contracts. Without it, the consumer may cancel "jederzeit und ohne Einhaltung einer Kündigungsfrist" (§ 312k, https://www.gesetze-im-internet.de/bgb/__312k.html).
- A withdrawal button ("Vertrag widerrufen") applies from 19 June 2026 under § 356a (https://www.gesetze-im-internet.de/bgb/__356a.html). The date comes from SECONDARY sources (https://www.freshfields.com/en/our-thinking/blogs/risk-and-compliance/pitfalls-for-e-commerce-how-the-new-eu-withdrawal-button-widerrufsbutton-wi-102ms91).
- Auto-renewal (§ 309 Nr. 9, https://www.gesetze-im-internet.de/bgb/__309.html): after the first term, a silent renewal is valid only into an indefinite term that the consumer can cancel with at most one month's notice. Renewing for another fixed year would be invalid. Counsel should confirm that this applies despite a US choice of law (Rome I Art. 6) [UNVERIFIED].

## 3. Gaps, ranked

These are [INFERRED] from the research above. The order reflects what can hurt soonest.

1. **The refund and renewal terms.** A blanket "no refunds" does not bind UK or EU consumers during the 14-day period, or for faulty services. Germany and probably Quebec restrict yearly renewal into another fixed year. The draft refunds page states the policy with an exception for statutory rights, but the checkout has no express-consent and acknowledgement step, and the membership renews for full years.
2. **Cancellation buttons.** Germany requires a labelled cancellation button and, since 19 June 2026, a withdrawal button. Quebec requires an easy-to-find cancel button. Today, cancellation runs through the Stripe customer portal from the dashboard.
3. **Minors.** There is no age gate. Thresholds differ: 13 in the UK and under the OPC position, 14 in Quebec, 16 in Germany, and 18 in India from May 2027 with verifiable adult parental consent.
4. **Named contact and representatives.** A named or titled privacy officer with an address is expected by PIPEDA and Quebec, a grievance officer by India's e-commerce rules, and Article 27 representatives may be needed in the UK and the EU.
5. **Transfer paperwork.** The DPF and UK Extension status of Supabase, Vercel, Stripe, and Resend is unchecked. Data processing agreements with each are needed, and a Quebec privacy impact assessment may be.
6. **Rights handling.** There is no self-service deletion or export. Deletion is blocked at the database level without a manual procedure. Response times run from 30 days (Canada, Quebec, UK one month) to 90 days (India).
7. **Retention claims.** The 365-day letter deletion only works once migration `20261115000000` is in production. Unanswered school deliveries keep the address forever.

## 4. Decisions for the owner and counsel

1. Sell to consumers in the UK, the EU, and Quebec now, or limit sales until the checkout and renewal terms comply.
2. How to handle the 14-day right: build a consent and acknowledgement step at checkout, or honor 14-day refunds.
3. Whether yearly renewal should become monthly-cancellable after the first year for German consumers (and possibly Quebec).
4. The age floor at signup, and whether to collect age.
5. Who the privacy officer and the India grievance officer are, and the postal address to publish.
6. Whether to appoint UK and EU representatives.
7. How letters that mention health should be handled: explicit student consent, or guidance to professors to leave it out.

## 5. Not covered or not verified

The full statute texts for Quebec, Ontario, and the German EGBGB templates. The ICO's current pages. The Children's code standards text. The DPF list entries. Stripe's support for Indian e-mandates. Rules on expiring prepaid credits in each jurisdiction. CASL. The current text of every regulation after September 2026 where noted.
