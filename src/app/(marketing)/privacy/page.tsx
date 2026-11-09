import Link from "next/link";

export const metadata = {
  title: "Privacy Policy",
  description:
    "ReadMyStudent's privacy policy explains how we collect, use, and protect personal data in a secure, consent-first recommendation letter platform.",
};

const sections = [
  {
    id: "who-we-are",
    title: "1. Who we are",
    body: (
      <p>
        ReadMyStudent is a platform designed to help students request, faculty
        write, and institutions securely view recommendation letters using
        consent-based, single-use access links.
      </p>
    ),
  },
  {
    id: "information-we-collect",
    title: "2. Information we collect",
    body: (
      <ul>
        <li>
          <span className='font-semibold'>Account information:</span> name,
          email address, role (student, faculty, viewer)
        </li>
        <li>
          <span className='font-semibold'>Usage data:</span> timestamps, link
          creation events, submission status, and access logs
        </li>
        <li>
          <span className='font-semibold'>Communications:</span> messages sent
          through our contact form
        </li>
      </ul>
    ),
  },
  {
    id: "recommendation-letters",
    title: "3. Recommendation letters",
    body: (
      <p>
        Recommendation letters are sensitive documents. We do not ask for or
        accept recommendation letter content via email or support messages.
        Letters submitted through the platform are handled using controlled
        access mechanisms and are only shared based on explicit consent.
      </p>
    ),
  },
  {
    id: "how-we-use-information",
    title: "4. How we use information",
    body: (
      <>
        <p>We use collected information to:</p>
        <ul>
          <li>Provide and operate the platform</li>
          <li>Generate and enforce single-use access links</li>
          <li>Maintain audit trails for security and integrity</li>
          <li>Respond to support or contact inquiries</li>
          <li>Improve reliability and user experience</li>
        </ul>
      </>
    ),
  },
  {
    id: "consent-and-access-control",
    title: "5. Consent and access control",
    body: (
      <p>
        Students control when and where recommendation links are generated.
        Faculty control the content they submit. Viewers can only access
        letters through student-approved links. Links are single-use and expire
        after submission.
      </p>
    ),
  },
  {
    id: "data-sharing",
    title: "6. Data sharing",
    body: (
      <>
        <p>We do not sell personal data. Information is only shared:</p>
        <ul>
          <li>With authorized viewers through student-approved links</li>
          <li>When required to comply with applicable laws</li>
          <li>
            With trusted infrastructure providers necessary to operate the
            service
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "data-retention",
    title: "7. Data retention",
    body: (
      <p>
        We retain personal data only as long as necessary to operate the
        platform, meet legal obligations, and preserve auditability. Retention
        periods may vary based on account role and usage.
      </p>
    ),
  },
  {
    id: "security",
    title: "8. Security",
    body: (
      <p>
        We take reasonable technical and organizational measures to protect
        personal information. No system is perfectly secure, but we design the
        platform to minimize exposure and prevent unauthorized reuse.
      </p>
    ),
  },
  {
    id: "your-rights",
    title: "9. Your rights",
    body: (
      <p>
        Depending on your location, you may have rights to access, correct, or
        delete your personal data. Requests can be made through our contact
        page.
      </p>
    ),
  },
  {
    id: "changes-to-this-policy",
    title: "10. Changes to this policy",
    body: (
      <p>
        We may update this Privacy Policy from time to time. If changes are
        material, we will provide appropriate notice within the platform.
      </p>
    ),
  },
  {
    id: "contact",
    title: "11. Contact",
    body: (
      <p>
        If you have questions about this Privacy Policy or data protection,
        please contact us through the <Link href='/contact'>contact page</Link>.
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
            This Privacy Policy explains how ReadMyStudent collects, uses, and
            protects personal information. Our goal is to be transparent,
            respectful, and consent-first.
          </p>
          <p className='caption mt-5 text-flap-dim'>Last updated: 01/02/2026</p>

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
