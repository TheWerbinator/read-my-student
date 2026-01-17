import Link from "next/link";

export const metadata = {
  title: "Accessibility",
  description:
    "ReadMyStudent's accessibility statement outlines our commitment to building an inclusive, usable experience for all users.",
};

export default function AccessibilityPage() {
  return (
    <main className='bg-[#fbfbf8]'>
      {/* HERO */}
      <section className='mx-auto max-w-7xl px-6 pt-16 md:pt-24 pb-10'>
        <div className='max-w-3xl'>
          <div className='inline-flex items-center rounded-full bg-[#eaf3ee] px-4 py-2 text-xs font-semibold text-[#0b4726] border border-[#0b4726]/10'>
            Accessibility
          </div>

          <h1 className='mt-6 font-serif text-4xl md:text-5xl font-semibold tracking-tight text-[#0b4726] leading-tight'>
            Built to be{" "}
            <span className='italic text-amber-500'>usable and inclusive</span>.
          </h1>

          <p className='mt-5 text-sm md:text-base leading-relaxed text-[#5f7f6f]'>
            ReadMyStudent is committed to providing an accessible experience for
            all users, including students, faculty, and institutions with
            diverse needs and abilities.
          </p>
        </div>
      </section>

      {/* CONTENT */}
      <section className='mx-auto max-w-7xl px-6 pb-16 md:pb-24'>
        <div className='max-w-3xl space-y-10'>
          <Section title='Our commitment'>
            We strive to design and build ReadMyStudent in a way that is usable
            by as many people as possible. Accessibility is an ongoing effort,
            and we aim to incorporate inclusive design principles throughout the
            platform.
          </Section>

          <Section title='Standards and guidelines'>
            We aim to align with the Web Content Accessibility Guidelines (WCAG)
            2.1 Level AA where reasonably possible. While not every part of the
            platform may fully conform at all times, accessibility is considered
            during design and development.
          </Section>

          <Section title='Accessibility features'>
            Current accessibility considerations include:
            <ul className='list-disc pl-5 mt-3 space-y-2'>
              <li>Semantic HTML and structured content</li>
              <li>Keyboard navigable interfaces</li>
              <li>Readable typography and sufficient color contrast</li>
              <li>Clear labels and instructions for forms</li>
            </ul>
          </Section>

          <Section title='Known limitations'>
            As the platform evolves, some areas may not yet fully meet all
            accessibility standards. We view this as an ongoing process and are
            committed to making improvements over time.
          </Section>

          <Section title='Feedback and assistance'>
            If you encounter accessibility barriers or need assistance using
            ReadMyStudent, please contact us through our{" "}
            <Link
              href='/contact'
              className='font-semibold text-[#0b4726] hover:underline'
            >
              contact page
            </Link>
            . We welcome feedback and will do our best to address issues in a
            timely manner.
          </Section>
        </div>
      </section>
    </main>
  );
}

/* ---------- UI ---------- */

function Section({
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
