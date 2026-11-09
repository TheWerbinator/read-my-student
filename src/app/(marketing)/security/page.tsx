import Link from "next/link";

export const metadata = {
  title: "Security",
  description:
    "ReadMyStudent security overview: consent-first access, one link per school, and auditability for recommendation letters.",
};

export default function SecurityPage() {
  return (
    <div className='px-5 py-12 md:px-8 md:py-20'>
      <div className='mx-auto max-w-4xl'>
        <header>
          <h1 className='font-display text-5xl font-extrabold uppercase leading-[0.95] tracking-[0.02em] md:text-7xl'>
            Security
          </h1>
          <p className='mt-6 max-w-2xl text-lg leading-relaxed text-flap-ink/90'>
            Recommendation letters are sensitive academic documents.
            ReadMyStudent is designed to reduce risk, prevent misuse, and keep
            access clear, auditable, and consent-based.
          </p>
        </header>

        <article className='sheet mt-10 px-5 py-8 sm:px-10 md:mt-14 md:px-14 md:py-12'>
          <div className='prose-paper break-words text-base text-ink'>
            <h2 id='consent-first-access' className='scroll-mt-6 mt-0!'>
              Consent-first access
            </h2>
            <p>
              Students explicitly control when and where recommendation links
              are generated. Viewers can only access letters through
              student-approved links. Faculty control the content they submit.
            </p>

            <h2 id='single-use-links' className='scroll-mt-6'>
              One link per school
            </h2>
            <p>
              Each school gets its own uniquely generated delivery link. The
              school confirms an email address before the letter opens, and the
              link stops working 48 hours after the professor approves the
              delivery. A professor’s request link
              is unique to that request and stops working when the request is
              declined or closes after 7 days with no answer.
            </p>

            <h2 id='access-auditability' className='scroll-mt-6'>
              Access auditability
            </h2>
            <p>
              The platform records access events such as link generation,
              submission timestamps, and viewing activity. This provides clarity
              and accountability without exposing letter content.
            </p>

            <h2 id='data-protection' className='scroll-mt-6'>
              Data protection
            </h2>
            <p>
              We use reasonable technical and organizational measures to protect
              personal information and sensitive documents. Recommendation
              letters are handled within the platform and are not requested or
              transmitted via email.
            </p>

            <h2 id='minimized-data-exposure' className='scroll-mt-6'>
              Minimized data exposure
            </h2>
            <p>
              Access is limited to what is necessary for each role. Viewers
              receive read-only access. Links expire automatically. We avoid
              long-lived, broadly shareable URLs.
            </p>

            <h2 id='responsible-use' className='scroll-mt-6'>
              Responsible use
            </h2>
            <p>
              Attempts to bypass access controls, reuse links, or access
              letters without authorization violate our{" "}
              <Link href='/terms'>Terms of Service</Link>.
            </p>

            <h2 id='security-questions' className='scroll-mt-6'>
              Security questions or concerns
            </h2>
            <p>
              If you are a faculty member, institution, or administrator with
              questions about security practices or responsible disclosure,
              please reach out through our <Link href='/contact'>contact page</Link>.
            </p>
          </div>
        </article>
      </div>
    </div>
  );
}
