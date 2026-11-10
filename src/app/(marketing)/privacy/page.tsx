import Link from "next/link";

export const metadata = {
  title: "Privacy Policy",
  description:
    "What ReadMyStudent collects about students, professors, and schools, why, who receives it, how long we keep it, and your rights.",
};

// Draft for owner and lawyer review: see docs/legal/privacy-and-consumer-brief.md
// and TODO.md. Every factual statement here must match the code.
const sections = [
  {
    id: "who-we-are",
    title: "1. Who we are",
    body: (
      <>
        <p>
          ReadMyStudent is owned and operated by YS2PC Research Group LLC, a
          company in the United States. We decide how and why the personal
          information described here is used, so we are responsible for it
          (the &quot;controller&quot; or &quot;data fiduciary&quot; in some
          laws).
        </p>
        <p>
          To reach the person responsible for privacy at ReadMyStudent, use
          the <Link href='/contact'>contact page</Link> and start the subject
          with &quot;Privacy&quot;.
        </p>
      </>
    ),
  },
  {
    id: "what-we-collect",
    title: "2. What we collect",
    body: (
      <>
        <p>
          <span className='font-semibold'>Students.</span> Your name, email
          address, password (stored only as a secure hash), university,
          program, graduation date, stage and year in school, and the date
          your current year started. We keep the professor emails you enter,
          the course and personal note you write, and the names and admissions
          email addresses of the schools you send a letter to. If you pay, we
          keep your credit balance and history and the status of your
          membership. Payment card details go to Stripe, not to us.
        </p>
        <p>
          <span className='font-semibold'>Professors.</span> Your name, email
          address, title, institution, department, and the mailing address,
          letterhead logo, and signature you add. We keep the letters you
          write. When you seal a letter, we record your IP address and browser
          type as part of the signing record. Each letter also keeps a copy of
          the recommender details you entered for it, including the email
          address and phone number you gave. Those two are not printed on the
          letter.
        </p>
        <p>
          <span className='font-semibold'>School readers.</span> The
          admissions email address the student enters, until the professor
          approves or declines that school. When a reader confirms the email
          address and when they download the letter, we record their IP
          address and browser type. We do not store the address a reader types
          to open the letter. We compare it with a one-way fingerprint of the
          address the student gave.
        </p>
        <p>
          <span className='font-semibold'>Visitors.</span> We do not use
          analytics, advertising, or tracking tools. When you search for a
          university, the text you type goes to OpenAlex to find matching
          schools. Your country, as reported by our hosting provider, decides
          whether prices show in rupees or dollars. We do not store it.
        </p>
        <p>
          <span className='font-semibold'>Contact form.</span> Your email
          address, subject, and message. They are emailed to our staff and are
          not stored in our database.
        </p>
      </>
    ),
  },
  {
    id: "where-it-comes-from",
    title: "3. Where it comes from",
    body: (
      <p>
        Most information comes from the person it describes. Some comes from
        someone else: a professor writes a letter about a student, a student
        gives us a professor&apos;s email address to send a request, and a
        student gives us a school&apos;s admissions address. A recommendation
        letter is the professor&apos;s assessment. It may include anything the
        professor chooses to say about the student.
      </p>
    ),
  },
  {
    id: "how-we-use-it",
    title: "4. How we use it, and why we are allowed to",
    body: (
      <>
        <ul>
          <li>
            To run the service you asked for: accounts, letter requests,
            writing and sealing letters, sending letters to schools, and
            credits and memberships. This is needed to provide the service you
            signed up for.
          </li>
          <li>
            To send the emails the service depends on: requests and reminders
            to professors, approval requests, notices to students, and links
            to schools.
          </li>
          <li>
            To keep the service secure and prove what happened: signing
            records, the log of when a school opened a letter, and payment
            records. We have a legitimate interest in this, and some records
            are needed for tax and accounting law.
          </li>
          <li>To answer messages you send us.</li>
        </ul>
        <p>
          We do not sell personal information, use it for advertising, or make
          decisions about anyone by automated means.
        </p>
      </>
    ),
  },
  {
    id: "who-receives-it",
    title: "5. Who receives it",
    body: (
      <>
        <p>As part of the service:</p>
        <ul>
          <li>
            A professor sees the student&apos;s name, email address,
            university, program, course, and note, and the name and address of
            each school the student asks to send to.
          </li>
          <li>
            A school sees the letter, the student&apos;s name, and the
            professor&apos;s name and title, after the professor approves that
            school.
          </li>
          <li>
            A student sees the letter only if the professor turns on a
            preview.
          </li>
        </ul>
        <p>Service providers that process information for us:</p>
        <ul>
          <li>Supabase: database, sign-in, and file storage</li>
          <li>Vercel: website hosting</li>
          <li>Stripe: payments</li>
          <li>Resend: email delivery</li>
          <li>OpenAlex: university search (search text only)</li>
        </ul>
        <p>
          We also disclose information when the law requires it.
        </p>
      </>
    ),
  },
  {
    id: "international-transfers",
    title: "6. Where it is stored",
    body: (
      <p>
        Our database and files are stored in the United States (Oregon), and
        our service providers may process information in the United States
        and other countries. Information stored in the United States may be
        accessible to law enforcement and national security authorities
        there. Where the law of your country requires a safeguard for
        transfers, we rely on the safeguards our providers offer, such as
        standard contractual clauses or the EU-U.S. Data Privacy Framework and
        its UK extension where a provider is certified.
      </p>
    ),
  },
  {
    id: "how-long-we-keep-it",
    title: "7. How long we keep it",
    body: (
      <ul>
        <li>
          Sealed letters and their PDF files are deleted 365 days after the
          professor seals them, together with the school links and the record
          of when each school opened them.
        </li>
        <li>
          Letterhead logos and signatures are deleted 365 days after they are
          uploaded, unless the professor uploads them again.
        </li>
        <li>
          A school&apos;s admissions email address is deleted once the
          professor approves or declines that school.
        </li>
        <li>
          Accounts and letter requests are kept until you ask us to delete
          them.
        </li>
        <li>
          Payment and credit records are kept to meet tax, accounting, and
          consumer law, and to show the history of your credit balance.
        </li>
      </ul>
    ),
  },
  {
    id: "cookies",
    title: "8. Cookies and browser storage",
    body: (
      <>
        <p>We use only what the service needs to work:</p>
        <ul>
          <li>
            Sign-in cookies, which keep you logged in. They last up to 400
            days or until you log out.
          </li>
          <li>
            A school verification cookie, which lets a reader reopen a letter
            after confirming the email address. It lasts 4 hours.
          </li>
          <li>
            Browser storage on your own device that remembers the last five
            schools you sent a letter to, so you can pick them again.
          </li>
        </ul>
        <p>
          The student dashboard loads Stripe&apos;s payment script, which may
          set its own cookies to process payments and prevent fraud. See
          Stripe&apos;s privacy policy for details.
        </p>
      </>
    ),
  },
  {
    id: "children",
    title: "9. Children and young people",
    body: (
      <p>
        ReadMyStudent is for university students and is not directed at
        children. Do not sign up if you are under 13, or under the age at
        which you can consent for yourself where you live (14 in Quebec and
        16 in Germany, for example). Accounts for high school students, which
        will need a parent&apos;s consent, are not open yet.
      </p>
    ),
  },
  {
    id: "your-rights",
    title: "10. Your rights",
    body: (
      <>
        <p>
          Depending on where you live, you can ask us to tell you what we hold
          about you and give you a copy, correct it, delete it, limit or
          object to how we use it, or give it to you in a format you can move
          to another service. Where we rely on your consent, you can withdraw
          it at any time.
        </p>
        <p>
          Send requests through the <Link href='/contact'>contact page</Link>.
          We answer within 30 days. We may need to confirm your identity
          first.
        </p>
        <p>
          You can also complain to the data protection authority where you
          live, for example the Information Commission in the UK, your
          national authority in the European Union, the Office of the Privacy
          Commissioner of Canada or the Commission d&apos;accès à
          l&apos;information du Québec, or the Data Protection Board of India.
        </p>
      </>
    ),
  },
  {
    id: "security",
    title: "11. Security",
    body: (
      <p>
        Letters are stored in private storage that only our servers can read.
        A school opens a letter only through its own link, after confirming
        its email address. Sealed letters carry a digital signature so that
        changes can be detected. No system is perfectly secure. If a breach
        puts your information at risk, we will tell you and the authorities
        as the law requires.
      </p>
    ),
  },
  {
    id: "changes",
    title: "12. Changes to this policy",
    body: (
      <p>
        When we change this policy, we update the date below. If a change is
        significant, we tell you in the product or by email before it takes
        effect.
      </p>
    ),
  },
  {
    id: "contact",
    title: "13. Contact",
    body: (
      <p>
        Questions or requests about privacy: use the{" "}
        <Link href='/contact'>contact page</Link>.
      </p>
    ),
  },
];

export default function PrivacyPolicyPage() {
  return (
    <div className='px-5 py-12 md:px-8 md:py-20'>
      <div className='mx-auto max-w-4xl'>
        <header>
          <h1 className='font-display text-5xl font-extrabold uppercase leading-[0.95] tracking-[0.02em] md:text-7xl'>
            Privacy Policy
          </h1>
          <p className='mt-6 max-w-2xl text-lg leading-relaxed text-flap-ink/90'>
            What we collect about students, professors, and schools, why, who
            receives it, how long we keep it, and what you can ask us to do.
          </p>
          <p className='caption mt-5 text-flap-dim'>Last updated: November 9, 2026</p>

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
