import Image from "next/image";
import Link from "next/link";
import { LinkButton } from "@/components/ui/LinkButton";
import HeroImage_01 from "@/assets/hero/HeroImage_01.png";
import HeroImage_02 from "@/assets/hero/HeroImage_03.png";
import HeroImage_03 from "@/assets/hero/HeroImage_04.png";

import {
  Check,
  Lock,
  ShieldCheck,
  Clock3,
  Layers,
  FileText,
  // eslint-disable-next-line
  GraduationCap,
  Sparkles,
} from "lucide-react";

export const metadata = {
  title: "For Students",
  description:
    "Request and track recommendation letters with confidence. Manage deadlines, control who sees your information, and stay organized throughout your application process.",
};

export default function ForStudentsPage() {
  return (
    <main className='bg-[#fbfbf8]'>
      {/* HERO */}
      <section className='relative overflow-hidden bg-[#0b4726] lg:pl-24'>
        <div className='absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.14)_0%,rgba(255,255,255,0)_55%)]' />
        <div className='absolute inset-0 opacity-[0.10] bg-[radial-gradient(rgba(255,255,255,0.35)_1px,transparent_1px)] bg-size-[44px_44px]' />

        <div className='relative mx-auto max-w-7xl px-6 py-10 sm:py-16 md:py-28 lg:py-40'>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-10 items-start'>
            {/* Hero image */}
            <div className='relative order-2 lg:order-1'>
              <div className='relative overflow-hidden rounded-3xl border border-white/15 bg-white/5 shadow-[0_30px_90px_rgba(0,0,0,0.25)]'>
                <div className='absolute inset-0 bg-linear-to-t from-black/25 to-transparent' />
                <Image
                  src={HeroImage_01}
                  alt='Students applying to programs'
                  className='h-80 md:h-105 w-full object-cover'
                  priority
                />
              </div>

              <div className='mt-4 flex flex-wrap gap-2'>
                <Pill icon={<Lock className='h-4 w-4' />} text='Encrypted' />
                <Pill
                  icon={<ShieldCheck className='h-4 w-4' />}
                  text='Consent-based'
                />
                <Pill
                  icon={<Clock3 className='h-4 w-4' />}
                  text='Deadline clarity'
                />
              </div>
            </div>

            {/* Text Part of Hero */}
            <div className='relative order-1 lg:order-2'>
              <div className='inline-flex items-center rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white/85 border border-white/15'>
                For Students
              </div>

              <h1 className='mt-6 font-serif text-4xl md:text-5xl font-semibold tracking-tight text-white'>
                Recommendation letters shouldn’t feel like{" "}
                <span className='italic text-amber-400'>begging</span>.
              </h1>

              <p className='mt-5 max-w-xl text-sm md:text-base leading-relaxed text-white/70'>
                Students don’t just need “a letter.” You need advocacy,
                continuity, and a system that preserves strong support while
                respecting confidentiality and academic integrity.
              </p>

              <div className='mt-8 flex flex-col sm:flex-row gap-3'>
                <LinkButton
                  href='/signup?role=student'
                  variant='gold'
                  size='lg'
                  className='rounded-xl justify-center'
                >
                  Start for Free
                </LinkButton>

                <LinkButton
                  href='/how-it-works'
                  variant='secondary'
                  size='lg'
                  className='rounded-xl bg-white/10 text-white hover:bg-white/15 border border-white/20 justify-center'
                >
                  See How It Works
                </LinkButton>
              </div>

              <div className='mt-6 text-xs font-semibold text-white/55'>
                Consent-first • Encrypted • Built for long-term opportunity
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PROGRAMS */}
      <section className='mx-auto max-w-7xl px-6 py-14 md:py-18 lg:pl-24'>
        <div className='rounded-3xl border border-amber-400/60 bg-[#0b5315] px-7 py-7 shadow-[0_18px_50px_rgba(0,0,0,0.25)]'>
          <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-6'>
            <div>
              <div className='text-xs font-bold text-amber-400 uppercase tracking-wide'>
                Common use cases
              </div>
              <div className='mt-2 font-serif text-2xl md:text-3xl font-semibold text-[#e9f6ec]'>
                Built for the programs that shape your future
              </div>
            </div>

            <div className='flex flex-wrap gap-2'>
              {[
                "Master’s programs",
                "PhD programs",
                "Medical school",
                "Law school",
                "MBA programs",
              ].map((x) => (
                <span
                  key={x}
                  className={[
                    "inline-flex items-center rounded-full px-4 py-2 text-xs font-semibold",
                    "bg-white/10 text-[#e9f6ec]",
                    "border border-amber-400/40",
                    "backdrop-blur-sm",
                  ].join(" ")}
                >
                  {x}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CORE PROBLEM: ONE LETTER → ONE PORTAL */}
      <section className='mx-auto max-w-7xl px-6 py-16 md:py-24 lg:pl-24'>
        <SectionHeader
          badge='The Hidden Reality'
          title={
            <>
              Students don’t “collect” letters —{" "}
              <span className='italic text-amber-500'>they disappear</span>.
            </>
          }
          subtitle='The dominant model is one letter, one portal, gone. That structure is why faculty get flooded and students panic every cycle.'
        />

        <div className='mt-12 grid grid-cols-1 lg:grid-cols-2 gap-6'>
          <SideBySideCard
            tone='pain'
            icon={<FileText className='h-5 w-5' />}
            title='Pain: One letter, one portal, disappears'
            bullets={[
              "The letter is context-specific",
              "The faculty member controls submission",
              "The student does not “own” the letter",
              "Reuse requires the professor to resubmit",
              "Nothing persists year to year",
            ]}
          />

          <SideBySideCard
            tone='solution'
            icon={<Layers className='h-5 w-5' />}
            title='Solution: Preserve value without breaking integrity'
            bullets={[
              "Securely store letters as long-lived assets",
              "Enable controlled reuse with explicit student consent",
              "Reduce re-requests by referencing prior work",
              "Keep faculty control over approvals & sharing rules",
              "Make the process durable across cycles",
            ]}
          />
        </div>
      </section>

      {/* IMAGE BREAK + CONFIDENTIALITY */}
      <section className='bg-white/40 border-y border-black/5 lg:pl-24'>
        <div className='mx-auto max-w-7xl px-6 py-16 md:py-20'>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-10 items-center'>
            <div className='relative'>
              <div className='relative overflow-hidden rounded-3xl border border-black/10 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.06)]'>
                <Image
                  src={HeroImage_02}
                  alt='Secure visibility and controlled sharing'
                  className='h-80 md:h-105 w-full object-cover'
                />
              </div>
            </div>

            <div>
              <div className='inline-flex items-center rounded-full bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-700 border border-black/5'>
                Why Students Rarely “See” the Letter
              </div>

              <h2 className='mt-6 font-serif text-3xl md:text-4xl font-semibold text-[#0b5315]'>
                The confusion is not your fault.
              </h2>

              <p className='mt-4 text-sm md:text-base leading-relaxed text-[#0b5315]'>
                Two reasons explain why letters often feel invisible:
              </p>

              <div className='mt-6 space-y-4'>
                <ReasonCard
                  number='1'
                  title='Confidentiality'
                  body='Programs trust letters more if students waive the right to see them. Letters are assumed to be more honest.'
                />
                <ReasonCard
                  number='2'
                  title='Integrity'
                  body='It prevents editing, pressure, or gaming. In practice, the letter exists only inside the receiving institution.'
                />
              </div>

              <div className='mt-8 rounded-2xl border border-black/10 bg-white px-6 py-5'>
                <div className='text-xs font-bold text-[#0b5315] uppercase tracking-wide'>
                  This confusion is a signal.
                </div>
                <ul className='mt-3 space-y-2 text-sm text-[#0b5315]'>
                  {[
                    "Students lack visibility",
                    "The system is archaic",
                    "Value is hidden",
                    "Ownership is unclear",
                  ].map((x) => (
                    <li key={x} className='flex items-start gap-3'>
                      <span className='mt-0.5 text-amber-500'>
                        <Check className='h-4 w-4' />
                      </span>
                      <span>{x}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PAIN → SOLUTION GRID */}
      <section className='mx-auto max-w-7xl px-6 py-16 md:py-24 lg:pl-24'>
        <SectionHeader
          badge='Pain Points → Solutions'
          title={
            <>
              Make the process{" "}
              <span className='italic text-amber-500'>understandable</span> and{" "}
              <span className='italic text-amber-500'>fair</span>.
            </>
          }
          subtitle='Brief, high-impact pain points with side-by-side product outcomes (the deeper dives can live on separate pages later).'
        />

        <div className='mt-12 grid grid-cols-1 gap-6'>
          <RowPair
            leftTitle='Emotionally hard asking'
            leftBody='Asking feels vulnerable. Students wonder if they’re bothering the professor.'
            rightTitle='Structured requests reduce anxiety'
            rightBody='A guided request form creates clarity and respect: context, deadlines, and purpose — without awkward follow-ups.'
          />

          <RowPair
            leftTitle='Fear of “lukewarm” letters'
            leftBody='Students fear a yes that results in a generic or weak letter.'
            rightTitle='Better inputs → better advocacy'
            rightBody='Provide achievement highlights, reminders, and talking points that help faculty write strong, specific letters.'
          />

          <RowPair
            leftTitle='No transparency'
            leftBody='Students don’t know if something is happening until it’s too late.'
            rightTitle='Status + deadline tracking'
            rightBody='Track Requested → In Progress → Completed, and keep deadlines visible to reduce panic.'
          />

          <RowPair
            leftTitle='Repeating the process every year'
            leftBody='Each cycle restarts from scratch: new portals, new links, new deadlines.'
            rightTitle='Consent-based reuse'
            rightBody='Reuse strong letters with explicit consent rules, reducing repeat work and preserving continuity.'
          />

          <RowPair
            leftTitle='Losing access after graduation'
            leftBody='After you leave, everything becomes scattered and hard to retrieve.'
            rightTitle='Central long-term archive'
            rightBody='Keep your recommendation history and approved letters securely stored (without breaking confidentiality).'
          />

          <RowPair
            leftTitle='Inequity in access'
            leftBody='Students with better relationships have an easier time navigating the system.'
            rightTitle='Standardization increases equity'
            rightBody='Structured requests and clear expectations reduce hidden advantages and make outcomes more fair.'
          />
        </div>
      </section>

      {/* WHY STUDENTS FAIL TO CAPTURE VALUE */}
      <section className='bg-[#0b5315] lg:pl-24'>
        <div className='mx-auto max-w-7xl px-6 py-16 md:py-24'>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-10 items-center'>
            <div>
              <div className='inline-flex items-center rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white/85 border border-white/15'>
                The Opportunity
              </div>

              <h2 className='mt-6 font-serif text-4xl md:text-5xl font-semibold text-white'>
                A great letter can change the{" "}
                <span className='italic text-amber-400'>trajectory</span> of
                your life.
              </h2>

              <p className='mt-4 text-sm md:text-base leading-relaxed text-white/70'>
                Many students underestimate letter quality and assume they can’t
                influence it. That belief leads to generic letters, missed
                opportunities, and wasted social capital.
              </p>

              <div className='mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4'>
                <DarkListCard
                  icon={<Sparkles className='h-5 w-5' />}
                  title='Students assume:'
                  items={[
                    "“Any letter is fine”",
                    "“I just need three”",
                    "“The content doesn’t matter”",
                    "“I can’t influence quality”",
                  ]}
                />
                <DarkListCard
                  icon={<ShieldCheck className='h-5 w-5' />}
                  title='This leads to:'
                  items={[
                    "Generic letters",
                    "Overworked faculty",
                    "Missed opportunities",
                    "Wasted social capital",
                  ]}
                />
              </div>
            </div>

            <div className='relative'>
              <div className='relative overflow-hidden rounded-3xl border border-white/15 bg-white/5 shadow-[0_30px_90px_rgba(0,0,0,0.25)]'>
                <div className='absolute inset-0 bg-linear-to-t from-black/25 to-transparent' />
                <Image
                  src={HeroImage_03}
                  alt='Opportunity and advocacy'
                  className='h-80 md:h-105 w-full object-cover'
                />
              </div>

              <div className='mt-4 rounded-2xl bg-white/10 border border-white/15 px-5 py-4'>
                <div className='text-xs font-bold text-amber-300 uppercase tracking-wide'>
                  What students actually want
                </div>
                <div className='mt-2 text-sm text-white/75'>
                  Not just a letter —{" "}
                  <span className='text-white font-semibold'>advocacy</span>,{" "}
                  <span className='text-white font-semibold'>continuity</span>,{" "}
                  <span className='text-white font-semibold'>trust</span>,{" "}
                  <span className='text-white font-semibold'>leverage</span>.
                </div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className='mt-14 flex flex-col sm:flex-row items-center justify-center gap-3'>
            <LinkButton
              href='/signup?role=student'
              variant='gold'
              size='lg'
              className='rounded-xl min-w-56 justify-center'
            >
              Start as a Student
            </LinkButton>

            <Link
              href='/contact'
              className='text-sm font-semibold text-white/75 hover:text-white transition-colors'
            >
              Questions? Contact us
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

/* ---------------- UI Components ---------------- */

function SectionHeader({
  badge,
  title,
  subtitle,
}: {
  badge: string;
  title: React.ReactNode;
  subtitle: string;
}) {
  return (
    <div className='text-center'>
      <div className='inline-flex items-center rounded-full bg-green-100 px-4 py-2 text-xs font-semibold text-[#0b5315]'>
        {badge}
      </div>
      <h2 className='mt-6 font-serif text-4xl md:text-5xl font-semibold text-[#0b5315]'>
        {title}
      </h2>
      <p className='mt-4 mx-auto max-w-3xl text-sm md:text-base leading-relaxed text-[#0b5315]'>
        {subtitle}
      </p>
    </div>
  );
}

function Pill({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className='inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-xs font-semibold text-white/85 border border-white/15'>
      <span className='text-amber-300'>{icon}</span>
      {text}
    </div>
  );
}

function SideBySideCard({
  tone,
  icon,
  title,
  bullets,
}: {
  tone: "pain" | "solution";
  icon: React.ReactNode;
  title: string;
  bullets: string[];
}) {
  const base = [
    "rounded-3xl border px-8 py-8",
    "shadow-[0_10px_30px_rgba(15,23,42,0.04)]",
    "transition-colors duration-300",
    "hover:border-amber-300 hover:bg-amber-50/40 hover:shadow-[0_18px_45px_rgba(245,197,66,0.20)]",
  ].join(" ");

  const styles =
    tone === "pain" ? "bg-white border-black/10" : "bg-white border-black/10";

  return (
    <div className={`${base} ${styles}`}>
      <div className='flex items-center gap-3'>
        <div
          className={[
            "h-12 w-12 rounded-2xl grid place-items-center border border-black/5 bg-amber-50 text-amber-600",
          ].join(" ")}
        >
          {icon}
        </div>
        <div className='font-serif text-xl font-semibold text-[#0b5315]'>
          {title}
        </div>
      </div>

      <ul className='mt-6 space-y-3 text-sm text-[#0b5315]'>
        {bullets.map((b) => (
          <li key={b} className='flex items-start gap-3'>
            <span className='mt-0.5 text-amber-500'>
              <Check className='h-4 w-4' />
            </span>
            <span>{b}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ReasonCard({
  number,
  title,
  body,
}: {
  number: string;
  title: string;
  body: string;
}) {
  return (
    <div className='rounded-2xl border border-black/10 bg-white px-6 py-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)] transition-colors duration-300 hover:border-amber-300 hover:bg-amber-50/40 hover:shadow-[0_18px_45px_rgba(245,197,66,0.18)]'>
      <div className='flex items-start gap-3'>
        <div className='h-9 w-9 rounded-xl bg-amber-500 text-white font-extrabold grid place-items-center'>
          {number}
        </div>
        <div>
          <div className='font-serif text-lg font-semibold text-amber-500'>
            {title}
          </div>
          <div className='mt-1 text-sm text-[#0b5315] leading-relaxed'>
            {body}
          </div>
        </div>
      </div>
    </div>
  );
}

function RowPair({
  leftTitle,
  leftBody,
  rightTitle,
  rightBody,
}: {
  leftTitle: string;
  leftBody: string;
  rightTitle: string;
  rightBody: string;
}) {
  return (
    <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
      <PairCard
        tone='pain'
        title={leftTitle}
        body={leftBody}
        icon={<FileText className='h-5 w-5' />}
      />
      <PairCard
        tone='solution'
        title={rightTitle}
        body={rightBody}
        icon={<ShieldCheck className='h-5 w-5' />}
      />
    </div>
  );
}

function PairCard({
  tone,
  title,
  body,
  icon,
}: {
  tone: "pain" | "solution";
  title: string;
  body: string;
  icon: React.ReactNode;
}) {
  const iconStyle =
    tone === "pain"
      ? "bg-[#0b5315] text-green-100"
      : "bg-amber-50 text-amber-600";

  return (
    <div className='rounded-3xl border border-black/10 bg-white px-8 py-7 shadow-[0_10px_30px_rgba(15,23,42,0.04)] transition-colors duration-300 hover:border-amber-300 hover:bg-amber-50/40 hover:shadow-[0_18px_45px_rgba(245,197,66,0.20)]'>
      <div className='flex items-start gap-3'>
        <div
          className={`h-12 w-12 rounded-2xl grid place-items-center border border-black/5 ${iconStyle}`}
        >
          {icon}
        </div>
        <div>
          <div className='font-serif text-xl font-semibold text-[#0b5315]'>
            {title}
          </div>
          <div className='mt-2 text-sm text-[#0b5315] leading-relaxed'>
            {body}
          </div>
        </div>
      </div>
    </div>
  );
}

function DarkListCard({
  icon,
  title,
  items,
}: {
  icon: React.ReactNode;
  title: string;
  items: string[];
}) {
  return (
    <div className='rounded-3xl bg-white/10 border border-white/15 px-7 py-7 transition-colors duration-300 hover:border-amber-300/60 hover:bg-white/15 hover:shadow-[0_18px_45px_rgba(245,197,66,0.18)]'>
      <div className='flex items-center gap-3'>
        <div className='h-12 w-12 rounded-2xl bg-white/10 text-amber-300 grid place-items-center border border-white/15'>
          {icon}
        </div>
        <div className='font-serif text-lg font-semibold text-white'>
          {title}
        </div>
      </div>

      <ul className='mt-5 space-y-3 text-sm text-white/75'>
        {items.map((i) => (
          <li key={i} className='flex items-start gap-3'>
            <span className='mt-0.5 text-amber-300'>
              <Check className='h-4 w-4' />
            </span>
            <span>{i}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
