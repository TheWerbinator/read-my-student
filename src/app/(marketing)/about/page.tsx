import Link from "next/link";
import { LinkButton } from "@/components/ui/LinkButton";

export const metadata = {
  title: "About",
  description:
    "ReadMyStudent is owned and operated by YS2PC Research Group LLC, an American company. It exists so a student's letter reaches the school on time.",
};

export default function AboutPage() {
  return (
    <>
      <section className='px-5 pb-12 pt-8 md:px-8 lg:pt-16'>
        <div className='mx-auto max-w-6xl'>
          <h1 className='max-w-4xl font-display text-5xl font-extrabold uppercase leading-[0.95] tracking-[0.02em] md:text-7xl'>
            A letter should not be <span className='text-gold'>the late part.</span>
          </h1>
        </div>
      </section>

      <section className='px-5 py-8 md:px-8 md:py-12'>
        <div className='mx-auto grid max-w-6xl gap-10 lg:grid-cols-12'>
          <div className='space-y-5 text-lg leading-relaxed text-flap-ink/90 lg:col-span-6'>
            <p>
              Most students have the grades and the essays done well before a deadline. The letter is the piece they cannot control. It sits with a professor who is busy, and the professor often faces another portal and another password just to write it.
            </p>
            <p>
              ReadMyStudent removes that wait. The student asks once. The professor answers from an emailed link, with no account, and seals the letter. The student then sends it to each school from one place.
            </p>
            <p>
              The student is the customer. Professors pay nothing and owe the student nothing, because a professor who finds it easy answers sooner.
            </p>
          </div>

          <aside aria-label='Who runs ReadMyStudent' className='lg:col-span-5 lg:col-start-8'>
            <div className='sheet px-6 py-7 md:px-9 md:py-9'>
              <p className='caption text-ink-2'>Owner and operator</p>
              <p className='mt-2 font-display text-3xl font-extrabold uppercase leading-none tracking-[0.02em] text-ink md:text-4xl'>
                YS2PC Research Group LLC
              </p>
              <p className='mt-4 text-base leading-relaxed text-ink-2'>
                An American company. ReadMyStudent serves students everywhere, from high school through a PhD, and sends letters to schools in the US and abroad.
              </p>
              <dl className='mt-6 divide-y divide-rule border-t border-rule text-base'>
                <div className='py-3'>
                  <dt className='caption text-ink-2'>Questions</dt>
                  <dd className='mt-1'>
                    <Link href='/contact' className='text-forest underline'>
                      Use the contact form
                    </Link>
                  </dd>
                </div>
                <div className='py-3'>
                  <dt className='caption text-ink-2'>Student data and FERPA</dt>
                  <dd className='mt-1'>
                    <Link href='/ferpa' className='text-forest underline'>
                      FERPA and US schools
                    </Link>
                  </dd>
                </div>
              </dl>
            </div>
          </aside>
        </div>
      </section>

      <section className='px-5 pb-20 pt-10 md:px-8 md:pb-28'>
        <div className='mx-auto flex max-w-6xl flex-col items-start gap-6 border-t border-flap pt-10 md:flex-row md:items-center md:justify-between'>
          <p className='font-display text-3xl font-extrabold uppercase leading-none tracking-[0.02em]'>
            Next departure: your letter
          </p>
          <div className='flex flex-col gap-3 sm:flex-row'>
            <LinkButton href='/signup?role=student' variant='gold' size='lg'>
              Request a letter
            </LinkButton>
            <LinkButton href='/how-it-works' variant='board' size='lg'>
              How it works
            </LinkButton>
          </div>
        </div>
      </section>
    </>
  );
}
