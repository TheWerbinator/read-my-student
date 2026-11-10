import Link from "next/link";

export const metadata = {
  title: "Refunds and Cancellation",
  description:
    "How ReadMyStudent memberships renew, how to cancel, and when credits come back.",
};

// Draft for owner and lawyer review (TODO.md). The statutory-rights wording in
// "Refunds" depends on the research in docs/legal/privacy-and-consumer-brief.md.
const sections = [
  {
    id: "what-you-buy",
    title: "1. What you buy",
    body: (
      <>
        <p>
          A <strong>membership</strong> is a yearly plan for your year in
          school. Each paid year adds that year&apos;s credits to your balance.
        </p>
        <p>
          <strong>Extra credits</strong> and <strong>credit packs</strong> are
          one-time purchases. They do not renew.
        </p>
        <p>
          One credit pays for one letter request to one professor. Sending a
          finished letter to schools is free. See{" "}
          <Link href='/pricing'>pricing</Link> for the current prices and how
          long credits last.
        </p>
      </>
    ),
  },
  {
    id: "automatic-renewal",
    title: "2. Automatic renewal",
    body: (
      <>
        <p>
          A membership renews automatically each year on the date you bought
          it, until you cancel. You agree to this with a checkbox before you
          pay.
        </p>
        <p>
          Each renewal charges the price listed at that time for your next year
          in school, to the card or UPI mandate you paid with. After the last
          listed year (Year 5 for undergraduates, Year 2 for Master&apos;s
          students), each renewal charges the price for that last year, until
          you cancel.
        </p>
      </>
    ),
  },
  {
    id: "cancelling",
    title: "3. Cancelling",
    body: (
      <>
        <p>
          Cancel any time from your dashboard with{" "}
          <strong>Manage or cancel membership</strong>. Cancelling stops the next
          renewal. Your membership stays active until the end of the year you
          paid for, and you keep the credits you already have until they expire.
        </p>
        <p>One-time credit purchases have nothing to cancel.</p>
      </>
    ),
  },
  {
    id: "credits-that-come-back",
    title: "4. Credits that come back",
    body: (
      <p>
        If a professor declines your request, or does not answer within 7 days,
        the credit you used goes back to your balance automatically. The credit
        keeps its original end date.
      </p>
    ),
  },
  {
    id: "refunds",
    title: "5. Refunds",
    body: (
      <>
        <p>
          Payments for memberships and credits are not refundable, except where
          the law where you live gives you a right to cancel or a remedy, for
          example when a service does not work as described. Nothing on this
          page limits those rights.
        </p>
        <p>
          If you were charged twice or charged in error, contact us and we will
          fix it. When we refund a payment, the unused credits from that payment
          are removed from your balance.
        </p>
      </>
    ),
  },
  {
    id: "contact",
    title: "6. Contact",
    body: (
      <>
        <p>
          Questions about a charge? Reach us through the{" "}
          <Link href='/contact'>contact page</Link>.
        </p>
        <p>
          Grievance Officer for users in India: Dr. Prosenjit Chatterjee,{" "}
          <a href='mailto:readmystudent@gmail.com'>readmystudent@gmail.com</a>.
          You can also use the <Link href='/contact'>contact page</Link> and
          start the subject with &quot;Grievance&quot;. We acknowledge a
          complaint within 48 hours and resolve it within one month.
        </p>
      </>
    ),
  },
];

export default function RefundsPage() {
  return (
    <div className='px-5 py-12 md:px-8 md:py-20'>
      <div className='mx-auto max-w-4xl'>
        <header>
          <h1 className='font-display text-5xl font-extrabold uppercase leading-[0.95] tracking-[0.02em] md:text-7xl'>
            Refunds and Cancellation
          </h1>
          <p className='mt-6 max-w-2xl text-lg leading-relaxed text-flap-ink/90'>
            How memberships renew, how to cancel, and when a credit comes back.
          </p>
          <p className='caption mt-5 text-flap-dim'>Last updated: November 10, 2026</p>

          <nav aria-label='Contents' className='mt-10'>
            <p className='caption text-flap-dim'>Contents</p>
            <ol className='mt-2 grid border-t border-flap sm:grid-cols-2 sm:gap-x-10'>
              {sections.map((s) => (
                <li key={s.id} className='border-b border-flap'>
                  <a
                    href={`#${s.id}`}
                    className='flex min-h-11 items-center py-2 text-flap-ink hover:underline'
                  >
                    {s.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </header>

        <article className='sheet mt-10 px-5 py-8 sm:px-10 md:mt-14 md:px-14 md:py-12'>
          <div className='prose-paper break-words text-base text-ink'>
            {sections.map((s, i) => (
              <section key={s.id}>
                <h2 id={s.id} className={`scroll-mt-6${i === 0 ? " mt-0!" : ""}`}>
                  {s.title}
                </h2>
                {s.body}
              </section>
            ))}
          </div>
        </article>
      </div>
    </div>
  );
}
