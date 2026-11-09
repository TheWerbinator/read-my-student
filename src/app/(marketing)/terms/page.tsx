import Link from "next/link";

export const metadata = {
  title: "Terms of Service",
  description:
    "ReadMyStudent's Terms of Service explain the rules, responsibilities, and acceptable use of our secure recommendation letter platform.",
};

const sections = [
  {
    id: "overview",
    title: "1. Overview",
    body: (
      <p>
        ReadMyStudent is a platform that helps students request, faculty submit,
        and authorized viewers securely access recommendation letters using
        consent-based, single-use links.
      </p>
    ),
  },
  {
    id: "eligibility-and-accounts",
    title: "2. Eligibility and accounts",
    body: (
      <p>
        You must provide accurate information when creating an account and use
        the platform only in accordance with these terms. You are responsible
        for activity that occurs under your account.
      </p>
    ),
  },
  {
    id: "roles-on-the-platform",
    title: "3. Roles on the platform",
    body: (
      <p>
        The platform supports multiple roles, including students, faculty, and
        authorized viewers (such as universities or employers). Each role has
        different permissions and responsibilities.
      </p>
    ),
  },
  {
    id: "recommendation-letters-and-links",
    title: "4. Recommendation letters and links",
    body: (
      <p>
        Recommendation letters are submitted through uniquely generated,
        single-use links. Each link expires after submission and cannot be
        reused, forwarded, or replayed.
      </p>
    ),
  },
  {
    id: "acceptable-use",
    title: "5. Acceptable use",
    body: (
      <>
        <p>You agree not to:</p>
        <ul>
          <li>Attempt to reuse, share, or bypass single-use links</li>
          <li>Submit false, misleading, or unauthorized information</li>
          <li>Access letters without explicit student authorization</li>
          <li>Interfere with or disrupt the platform’s security</li>
        </ul>
      </>
    ),
  },
  {
    id: "pricing-and-payments",
    title: "6. Pricing and payments",
    body: (
      <p>
        Some features require payment, including additional recommendation
        links and premium plans. Prices are clearly disclosed before purchase.
        Payments are non-refundable except where required by law.
      </p>
    ),
  },
  {
    id: "intellectual-property",
    title: "7. Intellectual property",
    body: (
      <p>
        Users retain ownership of their own content. ReadMyStudent does not
        claim ownership over recommendation letters. The platform software,
        design, and branding remain the property of ReadMyStudent.
      </p>
    ),
  },
  {
    id: "data-and-privacy",
    title: "8. Data and privacy",
    body: (
      <p>
        Your use of the platform is also governed by our{" "}
        <Link href='/privacy'>Privacy Policy</Link>. Please review it to
        understand how personal data is handled.
      </p>
    ),
  },
  {
    id: "availability-and-changes",
    title: "9. Availability and changes",
    body: (
      <p>
        We may modify, suspend, or discontinue parts of the platform to improve
        reliability or security. We may update these Terms from time to time and
        will provide notice of material changes where appropriate.
      </p>
    ),
  },
  {
    id: "disclaimer",
    title: "10. Disclaimer",
    body: (
      <p>
        The platform is provided “as is.” While we work to maintain uptime and
        security, we do not guarantee uninterrupted availability or error-free
        operation.
      </p>
    ),
  },
  {
    id: "limitation-of-liability",
    title: "11. Limitation of liability",
    body: (
      <p>
        To the extent permitted by law, ReadMyStudent is not liable for
        indirect, incidental, or consequential damages arising from use of the
        platform.
      </p>
    ),
  },
  {
    id: "termination",
    title: "12. Termination",
    body: (
      <p>
        We may suspend or terminate accounts that violate these Terms or misuse
        the platform. You may stop using the platform at any time.
      </p>
    ),
  },
  {
    id: "contact",
    title: "13. Contact",
    body: (
      <p>
        If you have questions about these Terms, please reach out through our{" "}
        <Link href='/contact'>contact page</Link>.
      </p>
    ),
  },
];

export default function TermsOfServicePage() {
  return (
    <div className='px-5 py-12 md:px-8 md:py-20'>
      <div className='mx-auto max-w-4xl'>
        <header>
          <h1 className='font-display text-5xl font-extrabold uppercase leading-[0.95] tracking-[0.02em] md:text-7xl'>
            Terms of Service
          </h1>
          <p className='mt-6 max-w-2xl text-lg leading-relaxed text-flap-ink/90'>
            These Terms of Service govern your use of ReadMyStudent. By creating
            an account or using the platform, you agree to the terms below.
          </p>
          <p className='caption mt-5 text-flap-dim'>
            Last updated: {new Date().toLocaleDateString()}
          </p>

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
