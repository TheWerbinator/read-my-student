import Link from "next/link";
import { LinkButton } from "@/components/ui/LinkButton";
import { FlapText } from "@/components/board/FlapText";
import { DepartureBoard, type DepartureRow } from "@/components/board/DepartureBoard";
import { lampOnBoard, type Lamp } from "@/components/board/status";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "How It Works",
  description:
    "Follow a letter request from the student's first note to the school's secure link: what you enter, what the professor sees, the reminder and close dates, sealing, and delivery.",
};

// Illustrative rows: invented names and times, labelled "Sample board" on the page.
const sampleRows: DepartureRow[] = [
  { time: "08:40", student: "Ananya K.", professor: "Dr. Mehta", school: "Waterloo", status: "Requested", lamp: "moving" },
  { time: "08:52", student: "Tom B.", professor: "Prof. Hale", school: "Michigan", status: "Opened", lamp: "moving" },
  { time: "09:30", student: "Lena W.", professor: "Dr. Brandt", school: "TU Munich", status: "Sealed", lamp: "done" },
  { time: "10:10", student: "Rohan G.", professor: "Prof. Das", school: "Edinburgh", status: "Reminded", lamp: "waiting" },
];

type Stop = { when: string; step: string; who: string; detail: string; status: string; lamp: Lamp };

// The real rules: no account for the professor, autosave, seal on finalize, one link per school.
const stops: Stop[] = [
  {
    when: "Day 0",
    step: "Request",
    who: "Student",
    detail: "Enter your professor's email, the course if you want, and a short personal note.",
    status: "Requested",
    lamp: "moving",
  },
  {
    when: "Day 0",
    step: "Open",
    who: "Professor",
    detail: "They get an email with one link. It opens a page with your note. No account, no password.",
    status: "Opened",
    lamp: "moving",
  },
  {
    when: "Any day",
    step: "Write",
    who: "Professor",
    detail: "Three steps: their details, letterhead and signature, then the letter. The draft saves as they go.",
    status: "In progress",
    lamp: "moving",
  },
  {
    when: "Any day",
    step: "Seal",
    who: "Professor",
    detail: "Finalizing turns the letter into a signed PDF. You see it only if they turn on a preview.",
    status: "Sealed",
    lamp: "done",
  },
  {
    when: "When ready",
    step: "Send",
    who: "Student",
    detail: "Pick a school and send. Your professor approves it, and the school gets its own secure link at no charge.",
    status: "Sent",
    lamp: "done",
  },
  {
    when: "On opening",
    step: "Read",
    who: "School",
    detail: "The reader confirms an email address, then opens the letter. The first opening is logged.",
    status: "Logged",
    lamp: "done",
  },
];

const ifQuiet = [
  {
    title: "Day 3",
    body: "No answer yet. We email the professor a reminder with the same link.",
  },
  {
    title: "Day 7",
    body: "Still nothing. The request closes as expired and shows that way on your dashboard, so you can ask someone else.",
  },
  {
    title: "Decline",
    body: "A professor can also decline from the same page. You see Declined on your board instead of waiting.",
  },
];

const schoolFacts = [
  {
    title: "Own link",
    body: "Every school gets its own secure link, so one school opening a letter tells you nothing about another.",
  },
  {
    title: "Email check",
    body: "The reader confirms an email address before the letter opens.",
  },
  {
    title: "Opening log",
    body: "When a school first opens its letter, the time is recorded. The link stays valid for 48 hours after the professor approves the delivery.",
  },
  {
    title: "Signature check",
    body: "The seal is an HMAC signature over the PDF. If a single byte changes, it no longer matches.",
  },
];

const h2 = "font-display text-4xl font-extrabold uppercase leading-[0.95] tracking-[0.02em] md:text-6xl";
const section = "px-5 py-16 md:px-8 md:py-24";

export default function HowItWorksPage() {
  return (
    <div>
      {/* First viewport: flap heading + sample board */}
      <section className='relative overflow-hidden px-5 pb-16 pt-8 md:px-8 lg:pb-24 lg:pt-16'>
        <div className='mx-auto grid max-w-6xl items-start gap-12 xl:grid-cols-12 xl:gap-10'>
          <div className='xl:col-span-6'>
            <h1 className='@container font-display font-extrabold leading-none'>
              <span className='flex flex-col gap-[0.12em] text-[min(calc(100cqi/10.7),4.75rem)]'>
                <FlapText text='Request to' cascadeOnMount />
                <FlapText text='school in' cascadeOnMount delay={250} />
                <FlapText text='six stops.' cascadeOnMount delay={500} className='text-gold' />
              </span>
            </h1>
            <p className='mt-8 max-w-xl text-lg leading-relaxed text-flap-ink/90 md:text-xl'>
              This is the whole trip for a student, a professor, and a school: what each person enters, what they see, and what happens when nobody answers.
            </p>
            <div className='mt-8 flex flex-col gap-3 sm:flex-row'>
              <LinkButton href='/signup?role=student' variant='gold' size='lg'>
                Request a letter
              </LinkButton>
              <LinkButton href='/for-faculty' variant='board' size='lg'>
                I am a professor
              </LinkButton>
            </div>
          </div>

          <div className='min-w-0 max-w-xl xl:col-span-6 xl:max-w-none xl:pt-3'>
            <DepartureBoard title='Letter departures' note='Sample board' rows={sampleRows} mobileRows={3} />
          </div>
        </div>
      </section>

      {/* The six stops */}
      <section aria-labelledby='stops-heading' className={section}>
        <div className='mx-auto max-w-6xl'>
          <h2 id='stops-heading' className={cn(h2, "max-w-3xl")}>
            Six stops. Each one shows on your board.
          </h2>
          <ol className='board-frame mt-12 space-y-[3px]'>
            {stops.map((s) => (
              <li
                key={s.step}
                className='flap-row grid grid-cols-[5.5rem_1fr] gap-x-4 gap-y-1 rounded-[2px] px-3 py-4 md:grid-cols-[7rem_10rem_1fr_9rem] md:items-center md:py-5'
              >
                <span className='font-display text-lg font-bold uppercase tracking-[0.06em] text-flap-dim'>{s.when}</span>
                <span className='font-display text-2xl font-extrabold uppercase leading-none tracking-[0.04em] text-flap-ink md:text-3xl'>
                  {s.step}
                </span>
                <span className='col-start-2 text-base leading-snug text-flap-ink/90 md:col-start-auto'>
                  <span className='caption mr-2 text-flap-dim'>{s.who}</span>
                  {s.detail}
                </span>
                <span
                  className={cn(
                    "col-start-2 font-display text-lg font-bold uppercase tracking-[0.08em] md:col-start-auto md:text-right",
                    lampOnBoard[s.lamp],
                  )}
                >
                  {s.status}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* What the student enters */}
      <section aria-labelledby='enter-heading' className={section}>
        <div className='mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-12'>
          <div className='lg:col-span-5'>
            <h2 id='enter-heading' className={h2}>
              You fill in three fields.
            </h2>
            <p className='mt-6 max-w-md text-lg leading-relaxed text-flap-ink/90'>
              The professor&apos;s email, the course (optional), and a personal note. Say what you are applying to and when it is due, because the professor reads this note first.
            </p>
            <p className='mt-4 max-w-md text-base leading-relaxed text-flap-dim'>
              One request goes to one professor. Ask three professors and you get three lines on your board.
            </p>
          </div>

          <figure className='lg:col-span-7'>
            <div className='sheet relative px-6 py-7 md:px-10 md:py-10'>
              <span className='caption absolute right-4 top-4 text-ink-2'>Sample</span>
              <p className='font-display text-3xl font-extrabold uppercase leading-none tracking-[0.02em] text-ink md:text-4xl'>
                New request
              </p>
              <div aria-hidden='true' className='mt-6 space-y-5'>
                <div>
                  <p className='caption text-ink-2'>Professor&apos;s email</p>
                  <p className='mt-1.5 border border-rule px-3 py-2.5 text-base text-ink'>professor@university.edu</p>
                </div>
                <div>
                  <p className='caption text-ink-2'>Course / context (optional)</p>
                  <p className='mt-1.5 border border-rule px-3 py-2.5 text-base text-ink'>CS 344 Algorithms, Fall 2025</p>
                </div>
                <div>
                  <p className='caption text-ink-2'>Personal note</p>
                  <p className='mt-1.5 border border-rule px-3 py-2.5 text-base leading-relaxed text-ink'>
                    I am applying to MS programs in Canada and Germany. The first deadline is December 15. Thank you for considering it.
                  </p>
                </div>
                <span className='inline-flex h-11 items-center bg-forest px-5 font-display text-lg font-bold uppercase tracking-[0.06em] text-white'>
                  Send request
                </span>
              </div>
            </div>
            <figcaption className='mt-3 text-sm text-flap-dim'>The request form. The values are a sample.</figcaption>
          </figure>
        </div>
      </section>

      {/* What the professor sees */}
      <section aria-labelledby='write-heading' className={section}>
        <div className='mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-12'>
          <figure className='order-2 lg:order-1 lg:col-span-7'>
            <div className='sheet relative px-6 pb-8 pt-9 md:px-10'>
              <span className='caption absolute right-4 top-4 text-ink-2'>Sample</span>
              <ol aria-hidden='true' className='grid grid-cols-3 gap-2 text-center'>
                {["Your details", "Letterhead and signature", "Letter"].map((label, i) => (
                  <li
                    key={label}
                    className={cn(
                      "border-b-4 pb-2 caption",
                      i === 2 ? "border-forest text-forest-ink" : "border-rule text-ink-2",
                    )}
                  >
                    {i + 1}. {label}
                  </li>
                ))}
              </ol>
              <div aria-hidden='true' className='mt-6 space-y-2.5'>
                <p className='text-sm text-ink'>To the Graduate Admissions Committee,</p>
                {[100, 95, 98, 90, 60].map((w, i) => (
                  <span key={i} className='block h-2 rounded-[1px] bg-paper-2' style={{ width: `${w}%` }} />
                ))}
              </div>
              <div className='mt-7 flex flex-wrap items-center justify-between gap-4'>
                <p className='text-sm font-semibold text-sealed'>Draft saved</p>
                <span
                  aria-hidden='true'
                  className='inline-flex h-11 items-center bg-forest px-5 font-display text-lg font-bold uppercase tracking-[0.06em] text-white'
                >
                  Finalize and seal
                </span>
              </div>
            </div>
            <figcaption className='mt-3 text-sm text-flap-dim'>
              The writing window a professor sees. The letter text is a placeholder.
            </figcaption>
          </figure>

          <div className='order-1 lg:order-2 lg:col-span-5 lg:pl-6'>
            <h2 id='write-heading' className={h2}>
              Your professor never makes an account.
            </h2>
            <p className='mt-6 max-w-md text-lg leading-relaxed text-flap-ink/90'>
              The email link opens your note and a writing window. The draft saves on its own, so they can stop and come back from the same link.
            </p>
            <p className='mt-4 max-w-md text-base leading-relaxed text-flap-dim'>
              Finalizing turns the letter into a signed PDF. If anyone changes it afterward, the signature check fails.
            </p>
          </div>
        </div>
      </section>

      {/* If nobody answers */}
      <section aria-labelledby='quiet-heading' className={section}>
        <div className='mx-auto grid max-w-6xl gap-10 lg:grid-cols-12'>
          <h2 id='quiet-heading' className={cn(h2, "lg:col-span-5")}>
            If nobody answers, you still know.
          </h2>
          <dl className='divide-y divide-flap lg:col-span-7'>
            {ifQuiet.map((f) => (
              <div key={f.title} className='grid gap-1 py-4 first:pt-0 sm:grid-cols-[8rem_1fr] sm:gap-6'>
                <dt className='font-display text-xl font-bold uppercase tracking-[0.04em] text-flap-ink'>{f.title}</dt>
                <dd className='text-base leading-relaxed text-flap-ink/85'>{f.body}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* What the school sees */}
      <section aria-labelledby='school-heading' className={section}>
        <div className='mx-auto grid max-w-6xl items-start gap-12 lg:grid-cols-12'>
          <div className='lg:col-span-6'>
            <h2 id='school-heading' className={h2}>
              The school gets a link, not an attachment.
            </h2>
            <dl className='mt-10 divide-y divide-flap'>
              {schoolFacts.map((f) => (
                <div key={f.title} className='grid gap-1 py-4 sm:grid-cols-[10rem_1fr] sm:gap-6'>
                  <dt className='font-display text-xl font-bold uppercase tracking-[0.04em] text-flap-ink'>{f.title}</dt>
                  <dd className='text-base leading-relaxed text-flap-ink/85'>{f.body}</dd>
                </div>
              ))}
            </dl>
          </div>

          <figure className='lg:col-span-6'>
            <div className='sheet relative px-7 py-9 md:px-10'>
              <span className='caption absolute right-4 top-4 text-ink-2'>Sample</span>
              <p className='font-display text-3xl font-extrabold uppercase leading-none tracking-[0.02em] text-ink md:text-4xl'>
                Confirm your email to open
              </p>
              <div aria-hidden='true' className='mt-6'>
                <p className='caption text-ink-2'>Your email</p>
                <p className='mt-1.5 border border-rule px-3 py-2.5 text-base text-ink'>admissions@university.edu</p>
                <span className='mt-5 inline-flex h-11 items-center bg-forest px-5 font-display text-lg font-bold uppercase tracking-[0.06em] text-white'>
                  Open letter
                </span>
              </div>
              <p className='mt-6 border-t border-dashed border-rule pt-3 text-sm text-ink-2'>
                This link was sent to one school. The first opening is logged.
              </p>
            </div>
            <figcaption className='mt-3 text-sm text-flap-dim'>The first page a school sees. The address is a sample.</figcaption>
          </figure>
        </div>
      </section>

      {/* Close */}
      <section aria-labelledby='how-close-heading' className='px-5 pb-20 pt-8 md:px-8 md:pb-28'>
        <div className='mx-auto max-w-6xl'>
          <div className='flex flex-col items-start gap-8 border-t border-flap pt-12 md:flex-row md:items-end md:justify-between'>
            <h2 id='how-close-heading' className='@container w-full max-w-2xl font-display font-extrabold'>
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
            Professors never pay. Students use one credit per professor, and sending to schools is free.{" "}
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
