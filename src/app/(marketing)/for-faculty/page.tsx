import Link from "next/link";
import { LinkButton } from "@/components/ui/LinkButton";
import { FlapText } from "@/components/board/FlapText";

export const metadata = {
  title: "For Professors",
  description:
    "Answer a student's letter request from one emailed link. No account, no password, free for professors. Write, sign, and seal the letter, or decline.",
};

const steps = [
  {
    title: "Open the link",
    body: "The student's email carries one link. It opens their note, the course, and what they are applying to.",
  },
  {
    title: "Write",
    body: "Three steps: your details, letterhead and signature, then the letter. The draft saves as you go, so you can close the tab and return.",
  },
  {
    title: "Finalize",
    body: "Finalizing signs the letter and seals it as a PDF. The student sees it only if you turn on a preview.",
  },
  {
    title: "Or decline",
    body: "If you cannot write it, decline from the same page. The student finds out now, not at the deadline.",
  },
];

const h2 = "font-display text-4xl font-extrabold uppercase leading-[0.95] tracking-[0.02em] md:text-6xl";
const section = "px-5 py-16 md:px-8 md:py-24";

export default function ForFacultyPage() {
  return (
    <div>
      {/* First viewport: flap heading + the request page */}
      <section className='relative overflow-hidden px-5 pb-16 pt-8 md:px-8 lg:pb-24 lg:pt-16'>
        <div className='mx-auto grid max-w-6xl items-start gap-12 lg:grid-cols-12 lg:gap-10'>
          <div className='lg:col-span-7'>
            <h1 className='@container font-display font-extrabold leading-none'>
              <span className='flex flex-col gap-[0.12em] text-[min(calc(100cqi/10.7),4.75rem)]'>
                <FlapText text='Ten minutes.' cascadeOnMount />
                <FlapText text='One link.' cascadeOnMount delay={250} />
                <FlapText text='Free.' cascadeOnMount delay={500} className='text-gold' />
              </span>
            </h1>
            <p className='mt-8 max-w-xl text-lg leading-relaxed text-flap-ink/90 md:text-xl'>
              A student asks, you get an email, and the link is all you need. No account, no password, no portal. Professors never pay.
            </p>
            <div className='mt-8'>
              <LinkButton href='/how-it-works' variant='board' size='lg'>
                See the whole journey
              </LinkButton>
            </div>
          </div>

          <figure className='lg:col-span-5 lg:pt-3'>
            <div className='sheet relative px-6 py-7 md:px-8 md:py-9'>
              <span className='caption absolute right-4 top-4 text-ink-2'>Sample</span>
              <p className='font-display text-3xl font-extrabold uppercase leading-none tracking-[0.02em] text-ink'>
                Chen Wei asked you for a letter
              </p>
              <dl className='mt-6 grid gap-y-4 border-t border-rule pt-5 text-sm'>
                <div>
                  <dt className='caption text-ink-2'>Applying to</dt>
                  <dd className='mt-1 text-base text-ink'>MSc Electrical Engineering, TU Munich</dd>
                </div>
                <div>
                  <dt className='caption text-ink-2'>Note from Chen</dt>
                  <dd className='mt-1 text-base leading-relaxed text-ink'>
                    I did my signals project with you in spring. The first deadline is January 10.
                  </dd>
                </div>
              </dl>
              <div aria-hidden='true' className='mt-6 flex flex-wrap gap-3'>
                <span className='inline-flex h-11 items-center bg-forest px-5 font-display text-lg font-bold uppercase tracking-[0.06em] text-white'>
                  Write letter
                </span>
                <span className='inline-flex h-11 items-center px-5 font-display text-lg font-bold uppercase tracking-[0.06em] text-forest-ink ring-1 ring-inset ring-ink/25'>
                  Decline
                </span>
              </div>
              <p className='mt-5 text-sm text-ink-2'>Closes in 7 days if there is no answer. No login needed.</p>
            </div>
            <figcaption className='mt-3 text-sm text-flap-dim'>
              The page you open from the email. Names and details are a sample.
            </figcaption>
          </figure>
        </div>
      </section>

      {/* What you do */}
      <section aria-labelledby='do-heading' className={section}>
        <div className='mx-auto grid max-w-6xl gap-10 lg:grid-cols-12'>
          <h2 id='do-heading' className={`${h2} lg:col-span-5`}>
            Four things <span className='text-gold'>you can do.</span>
          </h2>
          <dl className='divide-y divide-flap lg:col-span-7'>
            {steps.map((s) => (
              <div key={s.title} className='grid gap-1 py-4 first:pt-0 sm:grid-cols-[10rem_1fr] sm:gap-6'>
                <dt className='font-display text-xl font-bold uppercase tracking-[0.04em] text-flap-ink'>{s.title}</dt>
                <dd className='text-base leading-relaxed text-flap-ink/85'>{s.body}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* The sealed letter */}
      <section aria-labelledby='sealed-faculty-heading' className={section}>
        <div className='mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-12'>
          <figure className='order-2 lg:order-1 lg:col-span-6'>
            <div className='sheet relative overflow-hidden px-7 pb-8 pt-9 md:px-10'>
              <span className='caption absolute right-4 top-4 text-ink-2'>Sample</span>
              <div className='border-b-2 border-forest pb-3'>
                <p className='font-display text-xl font-extrabold uppercase tracking-[0.06em] text-forest-ink'>
                  Dr. Hannah Weiss
                </p>
                <p className='text-sm text-ink-2'>Professor of Electrical Engineering</p>
              </div>
              <div aria-hidden='true' className='mt-6 space-y-2.5'>
                <p className='text-sm text-ink'>To the Graduate Admissions Committee,</p>
                {[100, 94, 98, 90, 58].map((w, i) => (
                  <span key={i} className='block h-2 rounded-[1px] bg-paper-2' style={{ width: `${w}%` }} />
                ))}
                <span className='block h-3' />
                {[96, 92, 50].map((w, i) => (
                  <span key={`b${i}`} className='block h-2 rounded-[1px] bg-paper-2' style={{ width: `${w}%` }} />
                ))}
              </div>
              <div className='mt-8 flex items-end justify-between gap-6'>
                <div>
                  <p className='font-[cursive] text-3xl leading-none text-forest-ink' aria-hidden='true'>
                    H. Weiss
                  </p>
                  <p className='mt-2 border-t border-ink/40 pt-1 text-xs text-ink-2'>Signature</p>
                </div>
              </div>
            </div>
            <figcaption className='mt-3 text-sm text-flap-dim'>
              What your finished letter looks like to a school. The text is hidden here because letters are confidential.
            </figcaption>
          </figure>

          <div className='order-1 lg:order-2 lg:col-span-6 lg:pl-6'>
            <h2 id='sealed-faculty-heading' className={h2}>
              Sealed once. <span className='text-gold'>Readable by the school.</span>
            </h2>
            <p className='mt-6 max-w-md text-lg leading-relaxed text-flap-ink/90'>
              The signature shows if a single byte changes. The school gets its own link, confirms an email address, and the first opening is logged.
            </p>
            <p className='mt-4 max-w-md text-base leading-relaxed text-flap-dim'>
              Your name and letterhead stay on the letter. You do not email PDFs or fill in a school portal.
            </p>
            <p className='mt-4 text-sm text-flap-dim'>
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

      {/* Account is optional */}
      <section aria-labelledby='account-heading' className='px-5 pb-20 pt-8 md:px-8 md:pb-28'>
        <div className='mx-auto grid max-w-6xl gap-8 border-t border-flap pt-12 lg:grid-cols-12'>
          <h2 id='account-heading' className={`${h2} lg:col-span-5`}>
            The link is <span className='text-gold'>all you need.</span>
          </h2>
          <div className='lg:col-span-7'>
            <p className='max-w-xl text-lg leading-relaxed text-flap-ink/90'>
              You do not have to sign up to answer a request. If you want a profile that keeps your details for next time, you can create a free account later, and it attaches to the requests you have already answered.
            </p>
            <div className='mt-8 flex flex-col gap-3 sm:flex-row sm:items-center'>
              <LinkButton href='/signup?role=FACULTY' variant='board' size='lg'>
                Create a free account
              </LinkButton>
              <Link href='/contact' className='inline-flex min-h-11 items-center text-flap-ink underline'>
                Questions? Contact us
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
