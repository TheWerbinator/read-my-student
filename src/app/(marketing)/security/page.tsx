import Link from "next/link";

export const metadata = {
  title: "Security",
  description:
    "ReadMyStudent security overview: consent-first access, single-use links, encryption, and auditability for recommendation letters.",
};

export default function SecurityPage() {
  return (
    <main className='bg-[#fbfbf8]'>
      {/* HERO */}
      <section className='mx-auto max-w-7xl px-6 pt-16 md:pt-24 pb-10 lg:pl-24'>
        <div className='max-w-3xl'>
          <div className='inline-flex items-center rounded-full bg-[#eaf3ee] px-4 py-2 text-xs font-semibold text-[#0b4726] border border-[#0b4726]/10'>
            Security
          </div>

          <h1 className='mt-6 font-serif text-4xl md:text-5xl font-semibold tracking-tight text-[#0b4726] leading-tight'>
            Built for trust,{" "}
            <span className='italic text-amber-500'>by design</span>.
          </h1>

          <p className='mt-5 text-sm md:text-base leading-relaxed text-[#5f7f6f]'>
            Recommendation letters are sensitive academic documents.
            ReadMyStudent is designed to reduce risk, prevent misuse, and keep
            access clear, auditable, and consent-based.
          </p>
        </div>
      </section>

      {/* CONTENT */}
      <section className='mx-auto max-w-7xl px-6 pb-16 md:pb-24 lg:pl-24'>
        <div className='max-w-3xl space-y-10'>
          <SecuritySection title='Consent-first access'>
            Students explicitly control when and where recommendation links are
            generated. Viewers can only access letters through student-approved
            links. Faculty control the content they submit.
          </SecuritySection>

          <SecuritySection title='Single-use recommendation links'>
            Every recommendation submission requires a uniquely generated,
            one-time-use link. Once a link is used, it automatically expires and
            cannot be reused, forwarded, or replayed.
          </SecuritySection>

          <SecuritySection title='Access auditability'>
            The platform records access events such as link generation,
            submission timestamps, and viewing activity. This provides clarity
            and accountability without exposing letter content.
          </SecuritySection>

          <SecuritySection title='Data protection'>
            We use reasonable technical and organizational measures to protect
            personal information and sensitive documents. Recommendation letters
            are handled within the platform and are not requested or transmitted
            via email.
          </SecuritySection>

          <SecuritySection title='Minimized data exposure'>
            Access is limited to what is necessary for each role. Viewers
            receive read-only access. Links expire automatically. We avoid
            long-lived, broadly shareable URLs.
          </SecuritySection>

          <SecuritySection title='Responsible use'>
            Attempts to bypass access controls, reuse links, or access letters
            without authorization violate our{" "}
            <Link
              href='/terms'
              className='font-semibold text-[#0b4726] hover:underline'
            >
              Terms of Service
            </Link>
            .
          </SecuritySection>

          <SecuritySection title='Security questions or concerns'>
            If you are a faculty member, institution, or administrator with
            questions about security practices or responsible disclosure, please
            reach out through our{" "}
            <Link
              href='/contact'
              className='font-semibold text-[#0b4726] hover:underline'
            >
              contact page
            </Link>
            .
          </SecuritySection>
        </div>
      </section>
    </main>
  );
}

/* ---------- UI ---------- */

function SecuritySection({
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
