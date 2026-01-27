import Image from "next/image";
import Link from "next/link";
import { LinkButton } from "@/components/ui/LinkButton";

// Optional: swap with your own image
import HowItWorksImage from "@/assets/hero/HeroImage_02.png";

import {
  AlertTriangle,
  Clock3,
  ShieldCheck,
  Lock,
  Check,
  GraduationCap,
  Users,
  Building2,
} from "lucide-react";

export const metadata = {
  title: "How It Works",
  description:
    "See how ReadMyStudent simplifies the recommendation letter process for both students and faculty with secure sharing, deadline tracking, and streamlined communication.",
};

export default function HowItWorksPage() {
  return (
    <main className='bg-[#fbfbf8]'>
      {/* Hero */}
      <section className='relative overflow-hidden bg-[#0b4726] lg:pl-24'>
        <div className='absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.14)_0%,rgba(255,255,255,0)_55%)]' />
        <div className='absolute inset-0 opacity-[0.10] bg-[radial-gradient(rgba(255,255,255,0.35)_1px,transparent_1px)] bg-size-[44px_44px]' />

        <div className='relative mx-auto max-w-7xl px-6 py-10 sm:py-16 md:py-28 lg:py-40'>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-10 items-start'>
            {/* Image panel */}
            <div className='relative order-2 lg:order-1'>
              <div className='relative overflow-hidden rounded-3xl border border-white/15 bg-white/5 shadow-[0_30px_90px_rgba(0,0,0,0.25)]'>
                <div className='absolute inset-0 bg-linear-to-t from-black/30 to-transparent' />
                <Image
                  src={HowItWorksImage}
                  alt='How ReadMyStudent works'
                  className='h-80 md:h-105 w-full object-cover'
                  priority
                />
              </div>

              <div className='mt-4 flex flex-wrap gap-2'>
                <Pill
                  icon={<Lock className='h-4 w-4' />}
                  text='Encrypted storage'
                />
                <Pill
                  icon={<ShieldCheck className='h-4 w-4' />}
                  text='Consent-based access'
                />
                <Pill
                  icon={<Clock3 className='h-4 w-4' />}
                  text='Deadline tracking'
                />
              </div>
            </div>

            <div className='relative order-1 lg:order-2'>
              <div className='inline-flex items-center rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white/85 border border-white/15'>
                How It Works
              </div>

              <h1 className='mt-6 font-serif text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-white'>
                Recommendation letters are{" "}
                <span className='italic text-amber-400'>hard</span> —
                <br className='hidden md:block' /> for reasons nobody designed
                for.
              </h1>

              <p className='mt-5 max-w-xl text-sm md:text-base leading-relaxed text-white/70'>
                Traditional recommendation letters rely on manual trust,
                scattered portals, and emotional friction. We built
                ReadMyStudent to preserve integrity, protect privacy, and make
                the experience human.
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
                  variant='secondary'
                  size='lg'
                  className='rounded-xl bg-white/10 text-white hover:bg-white/15 border border-white/20 justify-center'
                >
                  Join as Faculty
                </LinkButton>
              </div>

              <div className='mt-6 text-xs font-semibold text-white/55'>
                Secure by design • Consent-first sharing • Built for academic
                trust
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problems */}
      <section className='mx-auto max-w-7xl px-6 py-16 md:py-24 lg:pl-24'>
        <div className='text-center'>
          <div className='inline-flex items-center rounded-full bg-green-100 px-4 py-2 text-xs font-semibold text-[#0b5315]'>
            The Problem
          </div>
          <h2 className='mt-6 font-serif text-4xl md:text-5xl font-semibold text-[#0b4726]'>
            The traditional process is{" "}
            <span className='italic text-amber-500'>emotionally</span> and{" "}
            <span className='italic text-amber-500'>logistically</span> broken.
          </h2>
          <p className='mt-4 mx-auto max-w-3xl text-sm md:text-base leading-relaxed text-[#0b4726]'>
            Students feel vulnerable asking. Faculty are overloaded.
            Institutions struggle with fraud risk and compliance.
          </p>
        </div>

        <div className='mt-14 grid grid-cols-1 lg:grid-cols-2 gap-6'>
          <ProblemCard
            icon={<GraduationCap className='h-5 w-5' />}
            title='For Students: Emotionally hard'
            subtitle='Asking feels vulnerable'
            bullets={[
              "Fear of rejection",
              "Fear of “lukewarm” letters",
              "Power imbalance",
              "Long response times",
              "Unclear expectations",
            ]}
            quotes={[
              "“Do they even remember me?”",
              "“Am I bothering them?”",
              "“What if they say yes but write a bad letter?”",
            ]}
            href='/for-students'
          />

          <ProblemCard
            icon={<Users className='h-5 w-5' />}
            title='For Faculty: Time-expensive'
            subtitle='Most faculty want to help — but are overloaded.'
            bullets={[
              "1 strong letter = 30–90 minutes",
              "Busy seasons = dozens of requests",
              "Deadlines vary",
              "Submission portals differ",
              "Repeated reminders",
              "Zero compensation",
            ]}
            href='/for-faculty'
          />
        </div>
      </section>

      {/* Pain Points */}
      <section className='bg-white/40 border-y border-black/5 lg:pl-24'>
        <div className='mx-auto max-w-7xl px-6 py-16 md:py-20'>
          <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
            <MiniListCard
              icon={<GraduationCap className='h-5 w-5' />}
              title='Student Pain Points'
              items={[
                "Anxiety asking",
                "Fear of bad letters",
                "No transparency",
                "Repeating the process every year",
                "Losing access after graduation",
                "Inequity in access",
                "No central storage",
                "Deadline tracking nightmare",
              ]}
            />

            <MiniListCard
              icon={<Users className='h-5 w-5' />}
              title='Faculty Pain Points'
              items={[
                "Rewriting similar letters",
                "Deadline overload",
                "Portal fatigue",
                "No central archive",
                "No way to “approve once, reuse many”",
                "No secure ownership",
                "No compensation or recognition",
              ]}
            />

            <MiniListCard
              icon={<Building2 className='h-5 w-5' />}
              title='Institutional Pain Points'
              items={[
                "Fraud risk",
                "Ghostwritten letters",
                "Identity verification",
                "Inconsistent standards",
                "Compliance headaches",
              ]}
            />
          </div>
        </div>
      </section>

      {/* Structural broken */}
      <section className='mx-auto max-w-7xl px-6 py-16 md:py-24 lg:pl-24'>
        <div className='rounded-3xl border border-black/10 bg-[#fbfbf8] shadow-[0_20px_60px_rgba(15,23,42,0.06)] overflow-hidden'>
          <div className='p-8 md:p-12'>
            <div className='inline-flex items-center gap-2 rounded-full bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-700'>
              <AlertTriangle className='h-4 w-4' />
              Why the System Is Broken (Structurally)
            </div>

            <h3 className='mt-6 font-serif text-3xl md:text-4xl font-semibold text-[#0b4726]'>
              The current model assumes things that are no longer true.
            </h3>

            <div className='mt-8 grid grid-cols-1 md:grid-cols-2 gap-4'>
              <AssumptionRow left='Small applicant pools' right='❌' />
              <AssumptionRow left='Low application volume' right='❌' />
              <AssumptionRow left='Long faculty availability' right='❌' />
              <AssumptionRow left='Manual trust' right='❌' />
            </div>

            <p className='mt-8 text-sm md:text-base text-[#0b4726] leading-relaxed'>
              Modern application volume and verification needs demand a system
              that is secure, auditable, and respectful of everyone’s time and
              emotional load.
            </p>
          </div>
        </div>
      </section>

      {/* Solutions */}
      <section className='bg-[#0b5315] lg:pl-24'>
        <div className='mx-auto max-w-7xl px-6 py-16 md:py-24'>
          <div className='text-center'>
            <div className='inline-flex items-center rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white/85 border border-white/15'>
              Our Approach
            </div>

            <h2 className='mt-6 font-serif text-4xl md:text-5xl font-semibold text-white'>
              A better system:{" "}
              <span className='italic text-amber-400'>secure</span>,{" "}
              <span className='italic text-amber-400'>consent-first</span>,{" "}
              <span className='italic text-amber-400'>human</span>.
            </h2>

            <p className='mt-4 mx-auto max-w-3xl text-sm md:text-base leading-relaxed text-white/70'>
              ReadMyStudent modernizes the workflow while preserving academic
              integrity and confidentiality.
            </p>
          </div>

          <div className='mt-14 grid grid-cols-1 md:grid-cols-2 gap-6'>
            <SolutionCard
              title='Design Principles'
              items={[
                "Be student-initiated but faculty-controlled",
                "Feel human, not bureaucratic",
                "Preserve academic integrity",
                "Respect confidentiality by default",
              ]}
            />
            <SolutionCard
              title='What We Enable'
              items={[
                "Store letters securely",
                "Allow consent-based reuse",
                "Track deadlines automatically",
                "Provide verification & encryption",
                "Reduce duplicate effort",
              ]}
            />
          </div>

          <div className='mt-10 grid grid-cols-1 md:grid-cols-3 gap-6'>
            <FeatureTile
              icon={<Lock className='h-5 w-5' />}
              title='Secure storage'
              body='Encrypted at rest and in transit. Sensitive documents belong behind strong controls.'
            />
            <FeatureTile
              icon={<ShieldCheck className='h-5 w-5' />}
              title='Consent-based sharing'
              body='Letters are shared only when a student explicitly approves access.'
            />
            <FeatureTile
              icon={<Clock3 className='h-5 w-5' />}
              title='Deadline clarity'
              body='Deadlines and status tracking reduce anxiety and eliminate reminder loops.'
            />
          </div>

          <div className='mt-14 flex flex-col sm:flex-row items-center justify-center gap-3'>
            <LinkButton
              href='/signup?role=student'
              variant='gold'
              size='lg'
              className='rounded-xl min-w-56 justify-center'
            >
              Start as a Student
            </LinkButton>

            <LinkButton
              href='/signup?role=faculty'
              variant='secondary'
              size='lg'
              className='rounded-xl min-w-56 justify-center bg-white/10 text-white hover:bg-white/15 border border-white/20'
            >
              Join as Faculty
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

/* ---------- UI bits ---------- */

function Pill({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className='inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-xs font-semibold text-white/85 border border-white/15'>
      <span className='text-amber-300'>{icon}</span>
      {text}
    </div>
  );
}

function ProblemCard({
  icon,
  title,
  subtitle,
  bullets,
  quotes,
  href,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  bullets: string[];
  quotes?: string[];
  href?: string;
}) {
  const cardClassName = [
    "group rounded-3xl border border-black/10 bg-white px-8 py-8",
    "shadow-[0_10px_30px_rgba(15,23,42,0.04)]",
    "transition-colors duration-300",
    "hover:border-amber-300 hover:bg-amber-50/40 hover:shadow-[0_18px_45px_rgba(245,197,66,0.20)]",
    href ? "cursor-pointer" : "",
  ].join(" ");

  const Card = (
    <div className={cardClassName}>
      <div className='flex items-center gap-3'>
        <div className='h-12 w-12 rounded-2xl bg-amber-50 text-[#0b4726] grid place-items-center border border-black/5'>
          {icon}
        </div>
        <div>
          <div className='font-serif text-xl font-semibold text-[#0b4726]'>
            {title}
          </div>
          <div className='text-sm font-semibold text-amber-600'>{subtitle}</div>
        </div>
      </div>

      <ul className='mt-6 space-y-3 text-sm text-[#0b4726]'>
        {bullets.map((b) => (
          <li key={b} className='flex items-start gap-3'>
            <span className='mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full text-amber-500'>
              <Check className='h-4 w-4' />
            </span>
            <span>{b}</span>
          </li>
        ))}
      </ul>

      {quotes?.length ? (
        <div className='mt-7 rounded-2xl bg-[#fbfbf8] border border-black/5 px-5 py-4'>
          <div className='text-xs font-bold text-amber-600 uppercase tracking-wide'>
            Students often wonder
          </div>
          <div className='mt-2 space-y-2 text-sm italic text-[#0b4726]'>
            {quotes.map((q) => (
              <div key={q}>{q}</div>
            ))}
          </div>
        </div>
      ) : null}

      {href ? (
        <div className='mt-6 text-sm font-semibold text-amber-600 opacity-0 group-hover:opacity-100 transition-opacity'>
          Learn more →
        </div>
      ) : null}
    </div>
  );

  return href ? (
    <Link href={href} className='block'>
      {Card}
    </Link>
  ) : (
    Card
  );
}

function MiniListCard({
  icon,
  title,
  items,
}: {
  icon: React.ReactNode;
  title: string;
  items: string[];
}) {
  const cardClassName = [
    "rounded-3xl border border-black/10 bg-white px-7 py-8",
    "shadow-[0_10px_30px_rgba(15,23,42,0.04)]",
    "transition-colors duration-300",
    "hover:border-amber-300 hover:bg-amber-50/40 hover:shadow-[0_18px_45px_rgba(245,197,66,0.20)]",
  ].join(" ");

  return (
    <div className={cardClassName}>
      <div className='flex items-center gap-3'>
        <div className='h-11 w-11 rounded-2xl bg-amber-50 text-amber-600 grid place-items-center border border-black/5'>
          {icon}
        </div>
        <div className='font-serif text-xl font-semibold text-[#0b4726]'>
          {title}
        </div>
      </div>

      <ul className='mt-6 space-y-3 text-sm text-[#0b4726]'>
        {items.map((i) => (
          <li key={i} className='flex items-start gap-3'>
            <span className='mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full text-amber-500'>
              <Check className='h-4 w-4' />
            </span>
            <span>{i}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function AssumptionRow({ left, right }: { left: string; right: string }) {
  return (
    <div className='flex items-center justify-between rounded-2xl bg-white px-5 py-4 border border-black/5'>
      <span className='font-semibold text-red-600'>{left}</span>
      <span className='text-lg'>{right}</span>
    </div>
  );
}

function SolutionCard({ title, items }: { title: string; items: string[] }) {
  const cardClassName = [
    "rounded-3xl bg-white/10 border border-white/15 px-8 py-8",
    "transition-colors duration-300",
    "hover:border-amber-300/60 hover:bg-white/15 hover:shadow-[0_18px_45px_rgba(245,197,66,0.18)]",
  ].join(" ");

  return (
    <div className={cardClassName}>
      <div className='font-serif text-xl font-semibold text-white'>{title}</div>
      <ul className='mt-6 space-y-3 text-sm text-white/75'>
        {items.map((i) => (
          <li key={i} className='flex items-start gap-3'>
            <span className='mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full text-amber-300'>
              <Check className='h-4 w-4' />
            </span>
            <span>{i}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FeatureTile({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  const tileClassName = [
    "rounded-3xl bg-white/10 border border-white/15 px-7 py-7",
    "transition-colors duration-300",
    "hover:border-amber-300/60 hover:bg-white/15 hover:shadow-[0_18px_45px_rgba(245,197,66,0.18)]",
  ].join(" ");

  return (
    <div className={tileClassName}>
      <div className='h-12 w-12 rounded-2xl bg-white/10 text-amber-300 grid place-items-center border border-white/15'>
        {icon}
      </div>
      <div className='mt-5 font-serif text-lg font-semibold text-white'>
        {title}
      </div>
      <p className='mt-2 text-sm leading-relaxed text-white/70'>{body}</p>
    </div>
  );
}
