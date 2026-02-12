import Link from "next/link";
import { LinkButton } from "@/components/ui/LinkButton";
import { ShieldCheck, Lock, HeartHandshake, Sparkles } from "lucide-react";

export const metadata = {
  title: "About",
  description:
    "ReadMyStudent is a secure, consent-first platform for recommendation letters—built to reduce faculty burden and student stress while preserving academic integrity.",
};

export default function AboutPage() {
  return (
    <main className='bg-[#fbfbf8]'>
      {/* HERO */}
      <section className='mx-auto max-w-7xl px-6 pt-16 md:pt-24 pb-10 lg:pl-24'>
        <div className='max-w-3xl'>
          <div className='inline-flex items-center rounded-full bg-[#eaf3ee] px-4 py-2 text-xs font-semibold text-green-900 border border-green-900/10'>
            About ReadMyStudent
          </div>

          <h1 className='mt-6 font-serif text-4xl md:text-5xl font-semibold tracking-tight text-green-900 leading-tight'>
            Recommendation letters should feel{" "}
            <span className='italic text-amber-500'>human</span> — not like a
            scramble.
          </h1>

          <p className='mt-5 text-sm md:text-base leading-relaxed text-[#5f7f6f]'>
            ReadMyStudent is a secure recommendation letter platform built to
            reduce stress for students and overload for faculty—without
            compromising confidentiality or trust.
          </p>

          <div className='mt-8 flex flex-col sm:flex-row gap-3'>
            <LinkButton
              href='/signup?role=student'
              variant='gold'
              size='lg'
              className='rounded-xl justify-center'
            >
              Start as a Student
            </LinkButton>
            <LinkButton
              href='/signup?role=faculty'
              variant='green'
              size='lg'
              className='rounded-xl justify-center'
            >
              Join as Faculty
            </LinkButton>
          </div>

          <div className='mt-6 text-xs font-semibold text-green-900/60'>
            Consent-first • Secure by design • Built for academic trust
          </div>
        </div>
      </section>

      {/* STORY */}
      <section className='mx-auto max-w-7xl px-6 py-10 md:py-14 lg:pl-24'>
        <div className='grid grid-cols-1 lg:grid-cols-12 gap-8 items-start'>
          <div className='lg:col-span-7'>
            <h2 className='font-serif text-2xl md:text-3xl font-semibold text-[#0a2e1c]'>
              Why we built this
            </h2>

            <div className='mt-4 space-y-4 text-sm md:text-base leading-relaxed text-[#5f7f6f]'>
              <p>
                Recommendation letters sit at the intersection of trust,
                opportunity, and anxiety. Students are asking for support in a
                high-stakes moment, and faculty are trying to help while
                juggling dozens of competing demands.
              </p>
              <p>
                The current workflow wasn’t designed for today’s application
                volume: scattered portals, repeated reminders, mismatched
                deadlines, and sensitive files traveling through inboxes.
              </p>
              <p>
                ReadMyStudent exists to make the process calmer and more
                reliable—while preserving integrity and confidentiality.
              </p>
            </div>

            <div className='mt-7 rounded-2xl border border-green-900/10 bg-white px-6 py-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)]'>
              <div className='text-xs font-bold uppercase tracking-wide text-amber-600'>
                Our guiding principle
              </div>
              <div className='mt-2 text-sm md:text-base font-semibold text-[#0a2e1c]'>
                Every recommendation link should be uniquely generated and
                single-use—so access is clear, controlled, and auditable.
              </div>
              <div className='mt-2 text-sm text-[#5f7f6f]'>
                This closes link sharing, replay submissions, and accidental
                misuse—without adding complexity for faculty.
              </div>
            </div>
          </div>

          <div className='lg:col-span-5'>
            <div className='rounded-3xl border border-green-900/10 bg-white p-7 shadow-[0_10px_30px_rgba(15,23,42,0.04)]'>
              <div className='text-xs font-semibold tracking-wide text-black/45'>
                WHAT WE OPTIMIZE FOR
              </div>

              <ul className='mt-4 space-y-4'>
                <ValueRow
                  icon={<HeartHandshake className='h-5 w-5' />}
                  title='Human experience'
                  body='Reduce anxiety for students and reduce repetitive work for faculty.'
                />
                <ValueRow
                  icon={<ShieldCheck className='h-5 w-5' />}
                  title='Trust and integrity'
                  body='Consent-first sharing with clear ownership and auditability.'
                />
                <ValueRow
                  icon={<Lock className='h-5 w-5' />}
                  title='Security by default'
                  body='Sensitive letters belong behind strong controls, not email threads.'
                />
                <ValueRow
                  icon={<Sparkles className='h-5 w-5' />}
                  title='Practical workflows'
                  body='Simple flows that work in real application seasons.'
                />
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* SIMPLE FAQ / CLARITY */}
      <section className='mx-auto max-w-7xl px-6 py-10 md:py-14 lg:pl-24'>
        <div className='rounded-3xl border border-green-900/10 bg-white px-7 py-8 shadow-[0_10px_30px_rgba(15,23,42,0.04)]'>
          <h2 className='font-serif text-2xl md:text-3xl font-semibold text-[#0a2e1c]'>
            A few quick clarifications
          </h2>

          <div className='mt-6 grid grid-cols-1 md:grid-cols-2 gap-6'>
            <QA
              q='Is it free for faculty?'
              a='Yes. Faculty access is free. The goal is to reduce workload and friction, not add a new burden.'
            />
            <QA
              q='Who controls access to letters?'
              a='Students control who receives a link. Faculty control the letter content and can set sharing/approval rules.'
            />
            <QA
              q='Why single-use links?'
              a='Single-use links prevent forwarding, replay submissions, and ambiguity. It’s the simplest way to keep trust intact.'
            />
            <QA
              q='What’s the main benefit?'
              a='A calmer workflow: fewer reminders, fewer portal headaches, clearer deadlines, and safer sharing.'
            />
          </div>

          <div className='mt-8 flex flex-col sm:flex-row items-center gap-3'>
            <LinkButton
              href='/how-it-works'
              variant='secondary'
              size='md'
              className='rounded-xl bg-[#eaf3ee] border border-green-900/10 hover:bg-[#dff0e6]'
            >
              See how it works
            </LinkButton>

            <Link
              href='/contact'
              className='text-sm font-semibold text-green-900/75 hover:text-green-900 transition-colors'
            >
              Have questions? Contact us →
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER CTA */}
      <section className='mx-auto max-w-7xl px-6 pb-16 md:pb-24 lg:pl-24'>
        <div className='rounded-3xl border border-amber-200 bg-[#fff7e6] px-7 py-8'>
          <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-6'>
            <div>
              <div className='text-xs font-bold uppercase tracking-wide text-amber-700'>
                Ready when you are
              </div>
              <div className='mt-2 font-serif text-2xl md:text-3xl font-semibold text-[#0a2e1c]'>
                Start free, and upgrade only if you need more links.
              </div>
            </div>

            <div className='flex flex-col md:w-1/2 sm:flex-row gap-3'>
              <LinkButton
                href='/signup?role=student'
                variant='gold'
                size='lg'
                className='rounded-xl justify-center'
              >
                Start as a Student
              </LinkButton>
              <LinkButton
                href='/signup?role=faculty'
                variant='green'
                size='lg'
                className='rounded-xl justify-center'
              >
                Join as Faculty
              </LinkButton>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

/* ---------- UI bits ---------- */

function ValueRow({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <li className='flex items-start gap-3'>
      <div className='mt-0.5 h-11 w-11 rounded-2xl bg-green-900/10 text-green-900 grid place-items-center border border-green-900/10'>
        {icon}
      </div>
      <div>
        <div className='text-sm font-semibold text-[#0a2e1c]'>{title}</div>
        <div className='mt-1 text-sm text-[#5f7f6f] leading-relaxed'>
          {body}
        </div>
      </div>
    </li>
  );
}

function QA({ q, a }: { q: string; a: string }) {
  return (
    <div className='rounded-2xl border border-black/5 bg-[#fbfbf8] px-5 py-4'>
      <div className='text-sm font-semibold text-[#0a2e1c]'>{q}</div>
      <div className='mt-2 text-sm text-[#5f7f6f] leading-relaxed'>{a}</div>
    </div>
  );
}
