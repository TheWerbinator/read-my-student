import Link from "next/link";

export const metadata = {
  title: "Privacy Policy",
  description:
    "ReadMyStudent's privacy policy explains how we collect, use, and protect personal data in a secure, consent-first recommendation letter platform.",
};

export default function PrivacyPolicyPage() {
  return (
    <main className='bg-[#fbfbf8]'>
      {/* HERO */}
      <section className='mx-auto max-w-7xl px-6 pt-16 md:pt-24 pb-10 lg:pl-24'>
        <div className='max-w-3xl'>
          <div className='inline-flex items-center rounded-full bg-[#eaf3ee] px-4 py-2 text-xs font-semibold text-[#0b4726] border border-[#0b4726]/10'>
            Privacy Policy
          </div>

          <h1 className='mt-6 font-serif text-4xl md:text-5xl font-semibold tracking-tight text-[#0b4726] leading-tight'>
            Your data deserves{" "}
            <span className='italic text-amber-500'>care and clarity</span>.
          </h1>

          <p className='mt-5 text-sm md:text-base leading-relaxed text-[#5f7f6f]'>
            This Privacy Policy explains how ReadMyStudent collects, uses, and
            protects personal information. Our goal is to be transparent,
            respectful, and consent-first.
          </p>

          <p className='mt-4 text-xs font-semibold text-[#0b4726]/60'>
            Last updated: 01/02/2026
          </p>
        </div>
      </section>

      {/* CONTENT */}
      <section className='mx-auto max-w-7xl px-6 pb-16 md:pb-24 lg:pl-24'>
        <div className='max-w-3xl space-y-10'>
          <PolicySection title='1. Who we are'>
            ReadMyStudent is a platform designed to help students request,
            faculty write, and institutions securely view recommendation letters
            using consent-based, single-use access links.
          </PolicySection>

          <PolicySection title='2. Information we collect'>
            <ul className='list-disc pl-5 space-y-2'>
              <li>
                <span className='font-semibold'>Account information:</span>{" "}
                name, email address, role (student, faculty, viewer)
              </li>
              <li>
                <span className='font-semibold'>Usage data:</span> timestamps,
                link creation events, submission status, and access logs
              </li>
              <li>
                <span className='font-semibold'>Communications:</span> messages
                sent through our contact form
              </li>
            </ul>
          </PolicySection>

          <PolicySection title='3. Recommendation letters'>
            Recommendation letters are sensitive documents. We do not ask for or
            accept recommendation letter content via email or support messages.
            Letters submitted through the platform are handled using controlled
            access mechanisms and are only shared based on explicit consent.
          </PolicySection>

          <PolicySection title='4. How we use information'>
            We use collected information to:
            <ul className='list-disc pl-5 mt-3 space-y-2'>
              <li>Provide and operate the platform</li>
              <li>Generate and enforce single-use access links</li>
              <li>Maintain audit trails for security and integrity</li>
              <li>Respond to support or contact inquiries</li>
              <li>Improve reliability and user experience</li>
            </ul>
          </PolicySection>

          <PolicySection title='5. Consent and access control'>
            Students control when and where recommendation links are generated.
            Faculty control the content they submit. Viewers can only access
            letters through student-approved links. Links are single-use and
            expire after submission.
          </PolicySection>

          <PolicySection title='6. Data sharing'>
            We do not sell personal data. Information is only shared:
            <ul className='list-disc pl-5 mt-3 space-y-2'>
              <li>With authorized viewers through student-approved links</li>
              <li>When required to comply with applicable laws</li>
              <li>
                With trusted infrastructure providers necessary to operate the
                service
              </li>
            </ul>
          </PolicySection>

          <PolicySection title='7. Data retention'>
            We retain personal data only as long as necessary to operate the
            platform, meet legal obligations, and preserve auditability.
            Retention periods may vary based on account role and usage.
          </PolicySection>

          <PolicySection title='8. Security'>
            We take reasonable technical and organizational measures to protect
            personal information. No system is perfectly secure, but we design
            the platform to minimize exposure and prevent unauthorized reuse.
          </PolicySection>

          <PolicySection title='9. Your rights'>
            Depending on your location, you may have rights to access, correct,
            or delete your personal data. Requests can be made through our
            contact page.
          </PolicySection>

          <PolicySection title='10. Changes to this policy'>
            We may update this Privacy Policy from time to time. If changes are
            material, we will provide appropriate notice within the platform.
          </PolicySection>

          <PolicySection title='11. Contact'>
            If you have questions about this Privacy Policy or data protection,
            please contact us through the{" "}
            <Link
              href='/contact'
              className='font-semibold text-[#0b4726] hover:underline'
            >
              contact page
            </Link>
            .
          </PolicySection>
        </div>
      </section>
    </main>
  );
}

/* ---------- UI ---------- */

function PolicySection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className='font-serif text-2xl font-semibold text-[#0a2e1c]'>
        {title}
      </h2>
      <div className='mt-3 text-sm md:text-base leading-relaxed text-[#5f7f6f]'>
        {children}
      </div>
    </section>
  );
}
