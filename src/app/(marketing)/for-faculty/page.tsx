import Image from "next/image";
import Link from "next/link";
import { LinkButton } from "@/components/ui/LinkButton";
import {
  Check,
  Clock3,
  ShieldCheck,
  Lock,
  FileText,
  Inbox,
  Layers,
  Sparkles,
  Users,
  Building2,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";

import FacultyImg1 from "@/assets/hero/FacultyImage_01.png";
import FacultyImg2 from "@/assets/faculty/faculty-02.png";
import FacultyImg3 from "@/assets/faculty/faculty-03.png";

export default function ForFacultyPage() {
  return (
    <main className="bg-[#fbfbf8]">
      {/* HERO (slightly different layout: text + stats row + image) */}
      <section className="relative overflow-hidden bg-[#0b1553]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.14)_0%,rgba(255,255,255,0)_55%)]" />
        <div className="absolute inset-0 opacity-[0.10] bg-[radial-gradient(rgba(255,255,255,0.35)_1px,transparent_1px)] bg-size-[44px_44px]" />

        <div className="relative mx-auto max-w-7xl px-6 py-16 md:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7">
              <div className="inline-flex items-center rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white/85 border border-white/15">
                For Faculty
              </div>

              <h1 className="mt-6 font-serif text-4xl md:text-5xl font-semibold tracking-tight text-white">
                Help students without drowning in{" "}
                <span className="italic text-amber-400">repeat work</span>.
              </h1>

              <p className="mt-5 max-w-2xl text-sm md:text-base leading-relaxed text-white/70">
                Most faculty want to advocate for students — but the current system
                multiplies effort, scatters documents, and turns deadlines into inbox chaos.
                ReadMyStudent keeps integrity intact while reducing friction.
              </p>

              {/* Quick stats row */}
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <StatPill label="1 strong letter" value="30–90 min" icon={<Clock3 className="h-4 w-4" />} />
                <StatPill label="Busy seasons" value="dozens of requests" icon={<Inbox className="h-4 w-4" />} />
                <StatPill label="Portals + deadlines" value="always different" icon={<Layers className="h-4 w-4" />} />
              </div>

              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <LinkButton
                  href="/signup?role=faculty"
                  variant="gold"
                  size="lg"
                  className="rounded-xl justify-center"
                >
                  Join as Faculty <ArrowRight className="ml-2 h-4 w-4" />
                </LinkButton>

                <LinkButton
                  href="/how-it-works"
                  variant="secondary"
                  size="lg"
                  className="rounded-xl bg-white/10 text-white hover:bg-white/15 border border-white/20 justify-center"
                >
                  See How It Works
                </LinkButton>
              </div>

              <div className="mt-6 text-xs font-semibold text-white/55">
                Always free for faculty • Consent-first • Secure by design
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-white/5 shadow-[0_30px_90px_rgba(0,0,0,0.25)]">
                <div className="absolute inset-0 bg-linear-to-t from-black/25 to-transparent" />
                <Image
                  src={FacultyImg1}
                  alt="Faculty writing recommendation letters"
                  className="h-80 md:h-105 w-full object-cover"
                  priority
                />
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Pill icon={<Sparkles className="h-4 w-4" />} text="AI drafting tools" />
                <Pill icon={<Lock className="h-4 w-4" />} text="Encrypted storage" />
                <Pill icon={<ShieldCheck className="h-4 w-4" />} text="Integrity preserved" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION: The Workflow is Split + Broken */}
      <section className="mx-auto max-w-7xl px-6 py-16 md:py-24">
        <SectionHeader
          badge="The Workflow"
          title={
            <>
              Two jobs, both broken:{" "}
              <span className="italic text-amber-500">writing</span> +{" "}
              <span className="italic text-amber-500">submitting</span>.
            </>
          }
          subtitle="Faculty write locally (Word, Google Docs, email drafts), then re-submit repeatedly to different systems with different rules."
        />

        <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card
            tone="light"
            icon={<FileText className="h-5 w-5" />}
            title="Faculty writes letters"
            subtitle="Often reused with customization"
            bullets={[
              "Stored locally (Word, Google Docs, email drafts)",
              "No centralized system",
              "No version control",
              "No encryption standard",
              "No ownership clarity",
            ]}
            footer="ReadMyStudent adds a secure home + versioned drafting workflow."
          />

          <Card
            tone="light"
            icon={<Inbox className="h-5 w-5" />}
            title="Faculty submits (repeatedly)"
            subtitle="Every portal is different"
            bullets={[
              "Different portals",
              "Different logins",
              "Different formats",
              "Different deadlines",
              "Reminder emails flood inboxes",
              "Missed deadlines happen all the time",
            ]}
            footer="ReadMyStudent reduces rework by managing links + approvals with auditability."
          />
        </div>
      </section>

      {/* IMAGE + Modern Reality Callout */}
      <section className="bg-white/40 border-y border-black/5">
        <div className="mx-auto max-w-7xl px-6 py-16 md:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div className="relative">
              <div className="relative overflow-hidden rounded-3xl border border-black/10 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
                <Image
                  src={FacultyImg1}
                  alt="Modern volume and overlapping deadlines"
                  className="h-80 md:h-105 w-full object-cover"
                />
              </div>
            </div>

            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-700 border border-black/5">
                <AlertTriangle className="h-4 w-4" />
                Modern reality
              </div>

              <h2 className="mt-6 font-serif text-3xl md:text-4xl font-semibold text-[#0a154a]">
                The old model collapses under modern volume.
              </h2>

              <ul className="mt-6 space-y-3 text-sm md:text-base text-[#56608b]">
                {[
                  "Students apply to 10–30 programs",
                  "Faculty write dozens of letters",
                  "Deadlines overlap",
                  "Systems don’t talk to each other",
                  "Everything resets every cycle",
                ].map((x) => (
                  <li key={x} className="flex items-start gap-3">
                    <span className="mt-0.5 text-amber-500">
                      <Check className="h-4 w-4" />
                    </span>
                    <span>{x}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8 rounded-2xl border border-black/10 bg-white px-6 py-5">
                <div className="text-xs font-bold text-[#0b1553] uppercase tracking-wide">
                  This is why:
                </div>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-[#56608b]">
                  <MiniBullet text="Letters are delayed" />
                  <MiniBullet text="Students miss opportunities" />
                  <MiniBullet text="Faculty burn out" />
                  <MiniBullet text="Quality declines" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pain Points + Institutional */}
      <section className="mx-auto max-w-7xl px-6 py-16 md:py-24">
        <SectionHeader
          badge="Pain Points"
          title={
            <>
              Reduce the workload without compromising{" "}
              <span className="italic text-amber-500">integrity</span>.
            </>
          }
          subtitle="A brief list here (you can expand into deeper subpages later): faculty pain points + institutional concerns."
        />

        <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ListCard
            icon={<Users className="h-5 w-5" />}
            title="Faculty Pain Points"
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

          <ListCard
            icon={<Building2 className="h-5 w-5" />}
            title="Institutional Pain Points"
            items={[
              "Fraud risk",
              "Ghostwritten letters",
              "Identity verification",
              "Inconsistent standards",
              "Compliance headaches",
            ]}
          />

          <ListCard
            icon={<ShieldCheck className="h-5 w-5" />}
            title="What a modern system must do"
            items={[
              "Preserve strong letters securely",
              "Enable reuse with consent",
              "Reduce duplicate effort",
              "Provide verification & encryption",
              "Maintain confidentiality",
            ]}
          />
        </div>
      </section>

      {/* Solutions: side-by-side, faculty-focused (slightly different layout: stacked “Pain vs Solution” rows) */}
      <section className="bg-[#0b1553]">
        <div className="mx-auto max-w-7xl px-6 py-16 md:py-24">
          <div className="text-center">
            <div className="inline-flex items-center rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white/85 border border-white/15">
              Our Solutions for Faculty
            </div>

            <h2 className="mt-6 font-serif text-4xl md:text-5xl font-semibold text-white">
              Less repetition. More{" "}
              <span className="italic text-amber-400">advocacy</span>.
            </h2>

            <p className="mt-4 mx-auto max-w-3xl text-sm md:text-base leading-relaxed text-white/70">
              Students don’t just want a letter — they want advocacy, continuity, trust, and leverage.
              A system that preserves strong letters and reduces friction amplifies opportunity.
            </p>
          </div>

          <div className="mt-12 space-y-6">
            <PainSolutionRow
              painTitle="Rewriting similar letters"
              painBody="You end up retyping the same structure, only swapping details."
              solutionTitle="AI-assisted drafting + reusable templates"
              solutionBody="Start from a strong base, pull in student-provided highlights, and keep consistency without losing personalization."
            />

            <PainSolutionRow
              painTitle="Deadline overload + reminders"
              painBody="Overlapping deadlines create constant inbox pressure."
              solutionTitle="Clear status + deadline tracking"
              solutionBody="A structured workflow that shows what’s due, what’s drafted, and what’s approved — without email chaos."
            />

            <PainSolutionRow
              painTitle="Portal fatigue"
              painBody="Every program uses a different portal with different formats."
              solutionTitle="Centralized requests + controlled sharing"
              solutionBody="Students initiate requests; faculty approve and share through secure links and verifiable access rules."
            />

            <PainSolutionRow
              painTitle="No archive, no ownership clarity"
              painBody="Letters live across files, drafts, and inboxes with no standard."
              solutionTitle="Secure archive + version history"
              solutionBody="A consistent home for letters with encryption, audit trails, and clear consent rules."
            />
          </div>

          <div className="mt-14 grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
            <div className="rounded-3xl bg-white/10 border border-white/15 px-8 py-8 transition-colors duration-300 hover:border-amber-300/60 hover:bg-white/15 hover:shadow-[0_18px_45px_rgba(245,197,66,0.18)]">
              <div className="font-serif text-2xl font-semibold text-white">
                Your time is valuable.
              </div>
              <p className="mt-3 text-sm md:text-base text-white/70 leading-relaxed">
                ReadMyStudent is built to respect faculty workload while preserving confidentiality and integrity —
                so strong letters can remain strong, without burning you out.
              </p>

              <div className="mt-7 flex flex-col sm:flex-row gap-3">
                <LinkButton
                  href="/signup?role=faculty"
                  variant="gold"
                  size="lg"
                  className="rounded-xl justify-center min-w-52"
                >
                  Join as Faculty →
                </LinkButton>

                <Link href="/contact" className="text-sm font-semibold text-white/75 hover:text-white transition-colors self-center">
                  Questions? Contact us
                </Link>
              </div>
            </div>

            <div className="relative">
              <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-white/5 shadow-[0_30px_90px_rgba(0,0,0,0.25)]">
                <div className="absolute inset-0 bg-linear-to-t from-black/25 to-transparent" />
                <Image
                  src={FacultyImg1}
                  alt="Faculty tools, workflow, and verification"
                  className="h-80 md:h-105 w-full object-cover"
                />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Pill icon={<Sparkles className="h-4 w-4" />} text="Faster drafting" />
                <Pill icon={<ShieldCheck className="h-4 w-4" />} text="Verification" />
                <Pill icon={<Lock className="h-4 w-4" />} text="Encryption" />
              </div>
            </div>
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
    <div className="text-center">
      <div className="inline-flex items-center rounded-full bg-[#e9e9ef] px-4 py-2 text-xs font-semibold text-[#101c5a]">
        {badge}
      </div>
      <h2 className="mt-6 font-serif text-4xl md:text-5xl font-semibold text-[#0a154a]">
        {title}
      </h2>
      <p className="mt-4 mx-auto max-w-3xl text-sm md:text-base leading-relaxed text-[#56608b]">
        {subtitle}
      </p>
    </div>
  );
}

function Pill({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-xs font-semibold text-white/85 border border-white/15">
      <span className="text-amber-300">{icon}</span>
      {text}
    </div>
  );
}

function StatPill({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-white/10 border border-white/15 px-4 py-4">
      <div className="flex items-center gap-2 text-amber-300 text-xs font-bold uppercase tracking-wide">
        {icon}
        {label}
      </div>
      <div className="mt-2 font-serif text-lg font-semibold text-white">
        {value}
      </div>
    </div>
  );
}

function Card({
  tone,
  icon,
  title,
  subtitle,
  bullets,
  footer,
}: {
  tone: "light" | "dark";
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  bullets: string[];
  footer?: string;
}) {
  const base =
    "rounded-3xl border px-8 py-8 shadow-[0_10px_30px_rgba(15,23,42,0.04)] transition-colors duration-300 hover:border-amber-300 hover:bg-amber-50/40 hover:shadow-[0_18px_45px_rgba(245,197,66,0.20)]";

  const styles =
    tone === "light"
      ? "bg-white border-black/10"
      : "bg-white/10 border-white/15";

  const titleColor = tone === "light" ? "text-[#0a154a]" : "text-white";
  const subtitleColor = tone === "light" ? "text-amber-600" : "text-white/70";
  const textColor = tone === "light" ? "text-[#56608b]" : "text-white/75";

  return (
    <div className={`${base} ${styles}`}>
      <div className="flex items-start gap-3">
        <div
          className={[
            "h-12 w-12 rounded-2xl grid place-items-center border border-black/5",
            tone === "light" ? "bg-[#eef0f8] text-[#0b1553]" : "bg-white/10 text-amber-300 border-white/15",
          ].join(" ")}
        >
          {icon}
        </div>

        <div>
          <div className={`font-serif text-xl font-semibold ${titleColor}`}>
            {title}
          </div>
          {subtitle ? (
            <div className={`mt-1 text-sm font-semibold ${subtitleColor}`}>
              {subtitle}
            </div>
          ) : null}
        </div>
      </div>

      <ul className={`mt-6 space-y-3 text-sm ${textColor}`}>
        {bullets.map((b) => (
          <li key={b} className="flex items-start gap-3">
            <span className="mt-0.5 text-amber-500">
              <Check className="h-4 w-4" />
            </span>
            <span>{b}</span>
          </li>
        ))}
      </ul>

      {footer ? (
        <div className={`mt-7 rounded-2xl border border-black/5 bg-[#fbfbf8] px-5 py-4 text-sm ${tone === "light" ? "text-[#3c466a]" : "text-white/75"}`}>
          {footer}
        </div>
      ) : null}
    </div>
  );
}

function ListCard({
  icon,
  title,
  items,
}: {
  icon: React.ReactNode;
  title: string;
  items: string[];
}) {
  return (
    <div className="rounded-3xl border border-black/10 bg-white px-7 py-8 shadow-[0_10px_30px_rgba(15,23,42,0.04)] transition-colors duration-300 hover:border-amber-300 hover:bg-amber-50/40 hover:shadow-[0_18px_45px_rgba(245,197,66,0.20)]">
      <div className="flex items-center gap-3">
        <div className="h-11 w-11 rounded-2xl bg-amber-50 text-amber-600 grid place-items-center border border-black/5">
          {icon}
        </div>
        <div className="font-serif text-xl font-semibold text-[#0a154a]">
          {title}
        </div>
      </div>

      <ul className="mt-6 space-y-3 text-sm text-[#56608b]">
        {items.map((i) => (
          <li key={i} className="flex items-start gap-3">
            <span className="mt-0.5 text-amber-500">
              <Check className="h-4 w-4" />
            </span>
            <span>{i}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function MiniBullet({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-black/5 bg-[#fbfbf8] px-4 py-3 flex items-center gap-3">
      <span className="text-amber-500">
        <Check className="h-4 w-4" />
      </span>
      <span className="text-sm text-[#56608b]">{text}</span>
    </div>
  );
}

function PainSolutionRow({
  painTitle,
  painBody,
  solutionTitle,
  solutionBody,
}: {
  painTitle: string;
  painBody: string;
  solutionTitle: string;
  solutionBody: string;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <DarkPairCard
        tone="pain"
        icon={<Inbox className="h-5 w-5" />}
        title={painTitle}
        body={painBody}
      />
      <DarkPairCard
        tone="solution"
        icon={<Sparkles className="h-5 w-5" />}
        title={solutionTitle}
        body={solutionBody}
      />
    </div>
  );
}

function DarkPairCard({
  tone,
  icon,
  title,
  body,
}: {
  tone: "pain" | "solution";
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  const iconStyle =
    tone === "pain"
      ? "bg-white/10 text-white/80 border-white/15"
      : "bg-amber-400/15 text-amber-300 border-amber-300/20";

  return (
    <div className="rounded-3xl bg-white/10 border border-white/15 px-8 py-7 transition-colors duration-300 hover:border-amber-300/60 hover:bg-white/15 hover:shadow-[0_18px_45px_rgba(245,197,66,0.18)]">
      <div className="flex items-start gap-3">
        <div className={`h-12 w-12 rounded-2xl grid place-items-center border ${iconStyle}`}>
          {icon}
        </div>
        <div>
          <div className="font-serif text-xl font-semibold text-white">
            {title}
          </div>
          <div className="mt-2 text-sm text-white/70 leading-relaxed">{body}</div>
        </div>
      </div>
    </div>
  );
}
