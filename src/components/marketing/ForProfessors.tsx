import { LinkButton } from "../ui/LinkButton";

/**
 * The page a professor opens from the request email, drawn as a paper sheet.
 * Sample content, labelled as such.
 */
export default function ForProfessors() {
  return (
    <section aria-labelledby='prof-heading' className='px-5 py-16 md:px-8 md:py-24'>
      <div className='mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-12'>
        <div className='lg:col-span-5'>
          <h2
            id='prof-heading'
            className='font-display text-4xl font-extrabold uppercase leading-[0.95] tracking-[0.02em] md:text-6xl'
          >
            Your professor answers from one link.
          </h2>
          <p className='mt-6 max-w-md text-lg leading-relaxed text-flap-ink/90'>
            Letters stall when writing one means another portal and another password. Here your professor opens the email, writes, signs, and is done.
          </p>
          <ul className='mt-6 space-y-3 text-base text-flap-ink/90'>
            <li className='flex gap-3'>
              <span aria-hidden='true' className='mt-2 size-2 shrink-0 bg-gold' />
              No account and no password. The link is the key.
            </li>
            <li className='flex gap-3'>
              <span aria-hidden='true' className='mt-2 size-2 shrink-0 bg-gold' />
              The draft saves on its own, so they can stop and come back.
            </li>
            <li className='flex gap-3'>
              <span aria-hidden='true' className='mt-2 size-2 shrink-0 bg-gold' />
              Free for professors, always.
            </li>
          </ul>
          <div className='mt-8'>
            <LinkButton href='/for-faculty' variant='board' size='md'>
              What professors see
            </LinkButton>
          </div>
        </div>

        <figure className='lg:col-span-7'>
          <div className='sheet relative px-6 py-7 md:px-10 md:py-10'>
            <span className='caption absolute right-4 top-4 text-ink-2'>Sample</span>
            <p className='font-display text-3xl font-extrabold uppercase leading-none tracking-[0.02em] text-ink md:text-4xl'>
              Priya Sharma asked you for a letter
            </p>
            <dl className='mt-6 grid gap-x-8 gap-y-4 border-t border-rule pt-5 text-sm sm:grid-cols-2'>
              <div>
                <dt className='caption text-ink-2'>Applying to</dt>
                <dd className='mt-1 text-base text-ink'>MS Computer Science, University of Toronto</dd>
              </div>
              <div>
                <dt className='caption text-ink-2'>Course</dt>
                <dd className='mt-1 text-base text-ink'>CS 344 Algorithms, Fall 2025</dd>
              </div>
              <div className='sm:col-span-2'>
                <dt className='caption text-ink-2'>Note from Priya</dt>
                <dd className='mt-1 text-base leading-relaxed text-ink'>
                  My project on graph search came out of your office hours. The deadline is December 15.
                </dd>
              </div>
            </dl>
            <div aria-hidden='true' className='mt-7 flex flex-wrap gap-3'>
              <span className='inline-flex h-11 items-center rounded-[2px] bg-forest px-5 font-display text-lg font-bold uppercase tracking-[0.06em] text-white'>
                Write letter
              </span>
              <span className='inline-flex h-11 items-center rounded-[2px] px-5 font-display text-lg font-bold uppercase tracking-[0.06em] text-forest-ink ring-1 ring-inset ring-ink/25'>
                Decline
              </span>
            </div>
            <p className='mt-5 text-sm text-ink-2'>Closes in 7 days if there is no answer. No login needed.</p>
          </div>
          <figcaption className='mt-3 text-sm text-flap-dim'>
            The page a professor opens from the email. Names and details are a sample.
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
