import Link from "next/link";

export const metadata = {
  title: "Accessibility",
  description:
    "ReadMyStudent's accessibility statement outlines our commitment to building an inclusive, usable experience for all users.",
};

export default function AccessibilityPage() {
  return (
    <div className='px-5 py-12 md:px-8 md:py-20'>
      <div className='mx-auto max-w-4xl'>
        <header>
          <h1 className='font-display text-5xl font-extrabold uppercase leading-[0.95] tracking-[0.02em] md:text-7xl'>
            Accessibility
          </h1>
          <p className='mt-6 max-w-2xl text-lg leading-relaxed text-flap-ink/90'>
            ReadMyStudent is committed to providing an accessible experience for
            all users, including students, faculty, and institutions with
            diverse needs and abilities.
          </p>
        </header>

        <article className='sheet mt-10 px-5 py-8 sm:px-10 md:mt-14 md:px-14 md:py-12'>
          <div className='prose-paper break-words text-base text-ink'>
            <h2 id='our-commitment' className='scroll-mt-6 mt-0!'>
              Our commitment
            </h2>
            <p>
              We strive to design and build ReadMyStudent in a way that is
              usable by as many people as possible. Accessibility is an ongoing
              effort, and we aim to incorporate inclusive design principles
              throughout the platform.
            </p>

            <h2 id='standards-and-guidelines' className='scroll-mt-6'>
              Standards and guidelines
            </h2>
            <p>
              We aim to align with the Web Content Accessibility Guidelines
              (WCAG) 2.1 Level AA where reasonably possible. While not every
              part of the platform may fully conform at all times, accessibility
              is considered during design and development.
            </p>

            <h2 id='accessibility-features' className='scroll-mt-6'>
              Accessibility features
            </h2>
            <p>Current accessibility considerations include:</p>
            <ul>
              <li>Semantic HTML and structured content</li>
              <li>Keyboard navigable interfaces</li>
              <li>Readable typography and sufficient color contrast</li>
              <li>Clear labels and instructions for forms</li>
            </ul>

            <h2 id='known-limitations' className='scroll-mt-6'>
              Known limitations
            </h2>
            <p>
              As the platform evolves, some areas may not yet fully meet all
              accessibility standards. We view this as an ongoing process and
              are committed to making improvements over time.
            </p>

            <h2 id='feedback-and-assistance' className='scroll-mt-6'>
              Feedback and assistance
            </h2>
            <p>
              If you encounter accessibility barriers or need assistance using
              ReadMyStudent, please contact us through our{" "}
              <Link href='/contact'>contact page</Link>. We welcome feedback and
              will do our best to address issues in a timely manner.
            </p>
          </div>
        </article>
      </div>
    </div>
  );
}
