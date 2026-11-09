import Link from "next/link";

const facts = [
  {
    title: "Sealed and signed",
    body: "When the professor finalizes, the letter becomes a PDF with a signature that shows if a single byte changes.",
  },
  {
    title: "Confidential",
    body: "The student does not see the letter unless the professor turns on a preview.",
  },
  {
    title: "One school, one link",
    body: "Each school gets its own secure link. The reader confirms an email address before the letter opens.",
  },
  {
    title: "Opening logged",
    body: "When a school first opens its letter, the time is recorded.",
  },
];

/** What a school receives: the sealed letter, drawn as paper, with the facts that make it trustworthy. */
export default function TrustSection() {
  return (
    <section aria-labelledby='sealed-heading' className='px-5 py-16 md:px-8 md:py-24'>
      <div className='mx-auto grid max-w-6xl gap-12 lg:grid-cols-12 lg:items-start'>
        <figure className='order-2 lg:order-1 lg:col-span-6'>
          <div className='sheet relative overflow-hidden px-7 pb-8 pt-9 md:px-10'>
            <span className='caption absolute right-4 top-4 text-ink-2'>Sample</span>
            <div className='border-b-2 border-forest pb-3'>
              <p className='font-display text-xl font-extrabold uppercase tracking-[0.06em] text-forest-ink'>
                Dr. Alan Reyes
              </p>
              <p className='text-sm text-ink-2'>Professor of Computer Science</p>
            </div>
            <div aria-hidden='true' className='mt-6 space-y-2.5'>
              <p className='text-sm text-ink'>To the Graduate Admissions Committee,</p>
              {[100, 96, 92, 98, 64].map((w, i) => (
                <span key={i} className='block h-2 rounded-[1px] bg-paper-2' style={{ width: `${w}%` }} />
              ))}
              <span className='block h-3' />
              {[94, 99, 88, 52].map((w, i) => (
                <span key={`b${i}`} className='block h-2 rounded-[1px] bg-paper-2' style={{ width: `${w}%` }} />
              ))}
            </div>
            <div className='mt-8 flex items-end justify-between gap-6'>
              <div>
                <p className='font-[cursive] text-3xl leading-none text-forest-ink' aria-hidden='true'>
                  A. Reyes
                </p>
                <p className='mt-2 border-t border-ink/40 pt-1 text-xs text-ink-2'>Signature</p>
              </div>
            </div>
          </div>
          <figcaption className='mt-3 text-sm text-flap-dim'>
            A sealed letter, as a sample. The text is hidden here because letters are confidential.
          </figcaption>
        </figure>

        <div className='order-1 lg:order-2 lg:col-span-6 lg:pl-6'>
          <h2
            id='sealed-heading'
            className='font-display text-4xl font-extrabold uppercase leading-[0.95] tracking-[0.02em] md:text-6xl'
          >
            Schools get a letter they can trust.
          </h2>
          <dl className='mt-10 divide-y divide-flap'>
            {facts.map((f) => (
              <div key={f.title} className='grid gap-1 py-4 sm:grid-cols-[12rem_1fr] sm:gap-6'>
                <dt className='font-display text-xl font-bold uppercase tracking-[0.04em] text-flap-ink'>{f.title}</dt>
                <dd className='text-base leading-relaxed text-flap-ink/85'>{f.body}</dd>
              </div>
            ))}
          </dl>
          <p className='mt-6 text-sm text-flap-dim'>
            <Link href='/security' className='text-flap-ink underline'>
              How we protect letters
            </Link>
            <span aria-hidden='true'> · </span>
            <Link href='/ferpa' className='text-flap-ink underline'>
              FERPA and US schools
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
