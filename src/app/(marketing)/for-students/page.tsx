import Link from "next/link";
import { LinkButton } from "@/components/ui/LinkButton";
import { FlapText } from "@/components/board/FlapText";
import { DepartureBoard, type DepartureRow } from "@/components/board/DepartureBoard";
import { lampOnPaper, type Lamp } from "@/components/board/status";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "For Students",
  description:
    "Ask a professor once. They answer from one emailed link with no account, so letters come back faster. Send the sealed letter to schools in any country for free. High school students get free credits every year.",
};

// Illustrative rows: invented names and times, labelled "Sample board" on the page.
const sampleRows: DepartureRow[] = [
  { time: "07:55", student: "Kavya R.", professor: "Dr. Nair", school: "Purdue", status: "Sealed", lamp: "done" },
  { time: "08:20", student: "Hugo T.", professor: "Prof. Lang", school: "Toronto", status: "Opened", lamp: "moving" },
  { time: "09:05", student: "Aditi V.", professor: "Dr. Shah", school: "TU Munich", status: "Requested", lamp: "moving" },
  { time: "09:48", student: "Sam O.", professor: "Prof. Reid", school: "UCL", status: "Reminded", lamp: "waiting" },
];

type SheetRow = { professor: string; course: string; status: string; lamp: Lamp };

const requests: SheetRow[] = [
  { professor: "Dr. Nair", course: "CS 344 Algorithms", status: "Complete", lamp: "done" },
  { professor: "Prof. Lang", course: "MATH 210 Linear Algebra", status: "In progress", lamp: "moving" },
  { professor: "Dr. Shah", course: "PHYS 301 Optics", status: "Requested", lamp: "moving" },
  { professor: "Prof. Reid", course: "ECON 150 Intro", status: "Expired", lamp: "stopped" },
];

const steps = [
  {
    title: "Ask",
    body: "Enter the professor's email and a short note. It takes a few minutes, and you do not have to find a form or portal for them.",
  },
  {
    title: "They answer",
    body: "They open one emailed link and write. No account and no password, so there is nothing to put off.",
  },
  {
    title: "You watch",
    body: "Your dashboard shows each request. On day 3 we remind the professor. On day 7 an unanswered request closes, so you find out in time to ask someone else.",
  },
  {
    title: "You send",
    body: "When the letter is sealed, send it to each school. Each school gets its own secure link.",
  },
];

const sendFacts = [
  {
    title: "Any country",
    body: "Schools open the letter in a browser, so it works for programs in the US, Canada, the UK, Germany, and elsewhere.",
  },
  {
    title: "Email check",
    body: "The reader confirms an email address before the letter opens, and the first opening is logged.",
  },
  {
    title: "Free to send",
    body: "Your credit paid for the request. Sending the letter to each school costs nothing, and professors never pay.",
  },
];

const h2 = "font-display text-4xl font-extrabold uppercase leading-[0.95] tracking-[0.02em] md:text-6xl";
const section = "px-5 py-16 md:px-8 md:py-24";

export default function ForStudentsPage() {
  return (
    <div>
      {/* First viewport: flap heading + sample board */}
      <section className='relative overflow-hidden px-5 pb-16 pt-8 md:px-8 lg:pb-24 lg:pt-16'>
        <div className='mx-auto grid max-w-6xl items-start gap-12 xl:grid-cols-12 xl:gap-10'>
          <div className='xl:col-span-6'>
            <h1 className='@container font-display font-extrabold leading-none'>
              <span className='flex flex-col gap-[0.12em] text-[min(calc(100cqi/10.7),4.75rem)]'>
                <FlapText text='Letters' cascadeOnMount />
                <FlapText text='come back' cascadeOnMount delay={250} />
                <FlapText text='faster.' cascadeOnMount delay={500} className='text-gold' />
              </span>
            </h1>
            <p className='mt-8 max-w-xl text-lg leading-relaxed text-flap-ink/90 md:text-xl'>
              Your professor answers from one link, with no account to make and no portal to learn. That makes the letter easier to ask for and quicker to arrive.
            </p>
            <div className='mt-8 flex flex-col gap-3 sm:flex-row'>
              <LinkButton href='/signup?role=student' variant='gold' size='lg'>
                Request a letter
              </LinkButton>
              <LinkButton href='/how-it-works' variant='board' size='lg'>
                See how it works
              </LinkButton>
            </div>
          </div>

          <div className='min-w-0 max-w-xl xl:col-span-6 xl:max-w-none xl:pt-3'>
            <DepartureBoard title='Letter departures' note='Sample board' rows={sampleRows} mobileRows={3} />
          </div>
        </div>
      </section>

      {/* Four steps beside the student's own dashboard */}
      <section aria-labelledby='fast-heading' className={section}>
        <div className='mx-auto grid max-w-6xl items-start gap-12 lg:grid-cols-12'>
          <div className='lg:col-span-6'>
            <h2 id='fast-heading' className={h2}>
              Easier to ask. Easier to answer.
            </h2>
            <dl className='mt-10 divide-y divide-flap'>
              {steps.map((s) => (
                <div key={s.title} className='grid gap-1 py-4 sm:grid-cols-[9rem_1fr] sm:gap-6'>
                  <dt className='font-display text-xl font-bold uppercase tracking-[0.04em] text-flap-ink'>{s.title}</dt>
                  <dd className='text-base leading-relaxed text-flap-ink/85'>{s.body}</dd>
                </div>
              ))}
            </dl>
          </div>

          <figure className='lg:col-span-6'>
            <div className='sheet relative px-6 py-7 md:px-8 md:py-9'>
              <span className='caption absolute right-4 top-4 text-ink-2'>Sample</span>
              <p className='font-display text-3xl font-extrabold uppercase leading-none tracking-[0.02em] text-ink md:text-4xl'>
                Your requests
              </p>
              <ul className='mt-6 divide-y divide-rule border-t border-rule'>
                {requests.map((r) => (
                  <li key={r.professor} className='flex items-baseline justify-between gap-4 py-3'>
                    <span>
                      <span className='block text-base font-semibold text-ink'>{r.professor}</span>
                      <span className='block text-sm text-ink-2'>{r.course}</span>
                    </span>
                    <span
                      className={cn(
                        "font-display text-lg font-bold uppercase tracking-[0.08em]",
                        lampOnPaper[r.lamp],
                      )}
                    >
                      {r.status}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <figcaption className='mt-3 text-sm text-flap-dim'>
              One line per professor, in your dashboard. Names and courses are a sample.
            </figcaption>
          </figure>
        </div>
      </section>

      {/* Quiet passage: why the letter is hidden */}
      <section aria-labelledby='hidden-heading' className={section}>
        <div className='mx-auto grid max-w-6xl gap-10 lg:grid-cols-12'>
          <h2 id='hidden-heading' className={cn(h2, "lg:col-span-5")}>
            You may not read it.
          </h2>
          <div className='max-w-xl space-y-4 text-lg leading-relaxed text-flap-ink/90 lg:col-span-7'>
            <p>
              Letters are confidential by default. You see the text only if your professor turns on a preview for you. Many programs weigh a letter more when the student has not seen it.
            </p>
            <p>
              You still see the status of every request: requested, in progress, complete, declined, or expired. Then you decide which schools get it.
            </p>
          </div>
        </div>
      </section>

      {/* Sending */}
      <section aria-labelledby='send-heading' className={section}>
        <div className='mx-auto grid max-w-6xl gap-10 lg:grid-cols-12'>
          <h2 id='send-heading' className={cn(h2, "lg:col-span-5")}>
            Send it to every school.
          </h2>
          <dl className='divide-y divide-flap lg:col-span-7'>
            {sendFacts.map((f) => (
              <div key={f.title} className='grid gap-1 py-4 first:pt-0 sm:grid-cols-[9rem_1fr] sm:gap-6'>
                <dt className='font-display text-xl font-bold uppercase tracking-[0.04em] text-flap-ink'>{f.title}</dt>
                <dd className='text-base leading-relaxed text-flap-ink/85'>{f.body}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Close: the one gold action */}
      <section aria-labelledby='students-close-heading' className='px-5 pb-20 pt-8 md:px-8 md:pb-28'>
        <div className='mx-auto max-w-6xl'>
          <div className='flex flex-col items-start gap-8 border-t border-flap pt-12 md:flex-row md:items-end md:justify-between'>
            <h2 id='students-close-heading' className='@container w-full max-w-2xl font-display font-extrabold'>
              <span className='block text-[min(calc(100cqi/13.3),3.5rem)]'>
                <FlapText text='Next departure:' />
                <span className='mt-[0.12em] block'>
                  <FlapText text='your letter' className='text-gold' />
                </span>
              </span>
            </h2>
            <LinkButton href='/signup?role=student' variant='gold' size='lg' className='shrink-0'>
              Request a letter
            </LinkButton>
          </div>
          <p className='mt-8 text-sm text-flap-dim'>
            <Link href='/pricing' className='text-flap-ink underline'>
              See pricing
            </Link>
            <span aria-hidden='true'> · </span>
            <Link href='/contact' className='text-flap-ink underline'>
              Questions? Contact us
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
