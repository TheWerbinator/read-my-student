import Link from "next/link";
import { LinkButton } from "../ui/LinkButton";
import { FlapText } from "../board/FlapText";

/** The close: the fare, then the next departure. */
export default function CTASection() {
  return (
    <section aria-labelledby='fare-heading' className='px-5 pb-20 pt-8 md:px-8 md:pb-28'>
      <div className='mx-auto max-w-6xl'>
        <div className='grid gap-6 border-y border-flap py-8 md:grid-cols-2 md:gap-10'>
          <h2 id='fare-heading' className='font-display text-3xl font-extrabold uppercase leading-none tracking-[0.02em]'>
            Professors never pay.
          </h2>
          <div>
            <p className='text-lg leading-relaxed text-flap-ink/90'>
              Students use one credit for each professor they ask, and get it back if the professor declines. Sending the letter to schools is free.{" "}
              <Link href='/pricing' className='text-flap-ink underline'>
                See pricing
              </Link>
            </p>
          </div>
        </div>

        <div className='mt-16 flex flex-col items-start gap-8 md:flex-row md:items-end md:justify-between'>
          <p className='@container w-full max-w-2xl font-display font-extrabold'>
            <span className='block text-[min(calc(100cqi/13.3),3.5rem)]'>
              <FlapText text='Next departure:' />
              <span className='mt-[0.12em] block'>
                <FlapText text='your letter' className='text-gold' />
              </span>
            </span>
          </p>
          <LinkButton href='/signup?role=student' variant='gold' size='lg' className='shrink-0'>
            Request a letter
          </LinkButton>
        </div>
      </div>
    </section>
  );
}
