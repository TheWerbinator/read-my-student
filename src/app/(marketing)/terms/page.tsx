import Link from "next/link";

export const metadata = {
  title: "Terms of Service",
  description:
    "ReadMyStudent's Terms of Service explain the rules, responsibilities, and acceptable use of our secure recommendation letter platform.",
};

export default function TermsOfServicePage() {
  return (
    <main className='bg-[#fbfbf8]'>
      {/* HERO */}
      <section className='mx-auto max-w-7xl px-6 pt-16 md:pt-24 pb-10 lg:pl-24'>
        <div className='max-w-3xl'>
          <div className='inline-flex items-center rounded-full bg-[#eaf3ee] px-4 py-2 text-xs font-semibold text-[#0b4726] border border-[#0b4726]/10'>
            Terms of Service
          </div>

          <h1 className='mt-6 font-serif text-4xl md:text-5xl font-semibold tracking-tight text-[#0b4726] leading-tight'>
            Clear terms —{" "}
            <span className='italic text-amber-500'>no surprises</span>.
          </h1>

          <p className='mt-5 text-sm md:text-base leading-relaxed text-[#5f7f6f]'>
            These Terms of Service govern your use of ReadMyStudent. By creating
            an account or using the platform, you agree to the terms below.
          </p>

          <p className='mt-4 text-xs font-semibold text-[#0b4726]/60'>
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>
      </section>

      {/* CONTENT */}
      <section className='mx-auto max-w-7xl px-6 pb-16 md:pb-24 lg:pl-24'>
        <div className='max-w-3xl space-y-10'>
          <TermsSection title='1. Overview'>
            ReadMyStudent is a platform that helps students request, faculty
            submit, and authorized viewers securely access recommendation
            letters using consent-based, single-use links.
          </TermsSection>

          <TermsSection title='2. Eligibility and accounts'>
            You must provide accurate information when creating an account and
            use the platform only in accordance with these terms. You are
            responsible for activity that occurs under your account.
          </TermsSection>

          <TermsSection title='3. Roles on the platform'>
            The platform supports multiple roles, including students, faculty,
            and authorized viewers (such as universities or employers). Each
            role has different permissions and responsibilities.
          </TermsSection>

          <TermsSection title='4. Recommendation letters and links'>
            Recommendation letters are submitted through uniquely generated,
            single-use links. Each link expires after submission and cannot be
            reused, forwarded, or replayed.
          </TermsSection>

          <TermsSection title='5. Acceptable use'>
            You agree not to:
            <ul className='list-disc pl-5 mt-3 space-y-2'>
              <li>Attempt to reuse, share, or bypass single-use links</li>
              <li>Submit false, misleading, or unauthorized information</li>
              <li>Access letters without explicit student authorization</li>
              <li>Interfere with or disrupt the platform’s security</li>
            </ul>
          </TermsSection>

          <TermsSection title='6. Pricing and payments'>
            Some features require payment, including additional recommendation
            links and premium plans. Prices are clearly disclosed before
            purchase. Payments are non-refundable except where required by law.
          </TermsSection>

          <TermsSection title='7. Intellectual property'>
            Users retain ownership of their own content. ReadMyStudent does not
            claim ownership over recommendation letters. The platform software,
            design, and branding remain the property of ReadMyStudent.
          </TermsSection>

          <TermsSection title='8. Data and privacy'>
            Your use of the platform is also governed by our{" "}
            <Link
              href='/privacy'
              className='font-semibold text-[#0b4726] hover:underline'
            >
              Privacy Policy
            </Link>
            . Please review it to understand how personal data is handled.
          </TermsSection>

          <TermsSection title='9. Availability and changes'>
            We may modify, suspend, or discontinue parts of the platform to
            improve reliability or security. We may update these Terms from time
            to time and will provide notice of material changes where
            appropriate.
          </TermsSection>

          <TermsSection title='10. Disclaimer'>
            The platform is provided “as is.” While we work to maintain uptime
            and security, we do not guarantee uninterrupted availability or
            error-free operation.
          </TermsSection>

          <TermsSection title='11. Limitation of liability'>
            To the extent permitted by law, ReadMyStudent is not liable for
            indirect, incidental, or consequential damages arising from use of
            the platform.
          </TermsSection>

          <TermsSection title='12. Termination'>
            We may suspend or terminate accounts that violate these Terms or
            misuse the platform. You may stop using the platform at any time.
          </TermsSection>

          <TermsSection title='13. Contact'>
            If you have questions about these Terms, please reach out through
            our{" "}
            <Link
              href='/contact'
              className='font-semibold text-[#0b4726] hover:underline'
            >
              contact page
            </Link>
            .
          </TermsSection>
        </div>
      </section>
    </main>
  );
}

/* ---------- UI ---------- */

function TermsSection({
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
