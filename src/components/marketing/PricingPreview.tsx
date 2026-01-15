import React, { useId } from "react";
import {
  Sparkles,
  Crown,
  Building2,
  Briefcase,
  Check,
  Link2,
  ShieldCheck,
} from "lucide-react";
import { LinkButton } from "../ui/LinkButton";

type Plan = {
  tag: string;
  tagTone: "neutral" | "gold";
  icon: React.ReactNode;
  name: string;
  description: string;
  price: string;
  priceSuffix?: string;
  bullets: string[];
  //eslint-disable-next-line
  cta: { label: string; href: string; variant?: any };
  featured?: boolean;
};

export default function PricingSection() {
  const studentPlans: Plan[] = [
    {
      tag: "Free to start",
      tagTone: "neutral",
      icon: <Sparkles className="h-5 w-5" />,
      name: "Free Tier",
      description: "Create an account and send your first requests at no cost.",
      price: "$0",
      bullets: [
        "Free signup for everyone",
        "First 3 recommendation links included",
        "Each link is single-use and expires after submission",
        "Consent-based sharing (student controls access)",
        "Audit trail for when links are accessed",
      ],
      cta: { label: "Start Free", href: "/signup?role=student" },
    },
    {
      tag: "Flexible & simple",
      tagTone: "neutral",
      icon: <Link2 className="h-5 w-5" />,
      name: "Pay-As-You-Go",
      description: "Only pay when you need more application submissions.",
      price: "$5",
      priceSuffix: "/ link",
      bullets: [
        "Starts after your first 3 free links",
        "Every link is fresh, unique, and single-use",
        "Once submitted → link expires automatically",
        "Stops link sharing and unauthorized reuse",
        "Perfect for small application cycles",
      ],
      cta: { label: "Buy Links", href: "/signup?role=student" },
    },
    {
      tag: "Best for heavy applications",
      tagTone: "gold",
      icon: <Crown className="h-5 w-5" />,
      name: "Application Sprint",
      description:
        "Premium plan for application season — built to be abuse-resistant and admissions-grade.",
      price: "$399",
      priceSuffix: "/ month",
      bullets: [
        "Up to 100 single-use recommendation links",
        "Ends when 100 links are generated OR 30 days pass",
        "Every submission burns one link credit (no replays)",
        "No forwarding, reuse, or duplicate submissions",
        "Best for grad, med, law, PhD, or multi-school cycles",
      ],
      cta: { label: "Start Sprint", href: "/signup?role=student&plan=sprint" },
      featured: true,
    },
  ];

  const viewerPlans: Plan[] = [
    {
      tag: "For verified institutions",
      tagTone: "neutral",
      icon: <Building2 className="h-5 w-5" />,
      name: "University Access",
      description:
        "Secure, read-only access to student-approved recommendation letters.",
      price: "Free",
      bullets: [
        "Free access for verified university domains",
        "View only after student consent",
        "No PDFs or email attachments",
        "Audit trail for access events",
        "Simple, frictionless viewer UI",
      ],
      cta: { label: "Verify University Email", href: "/signup?role=university" },
    },
    {
      tag: "For recruiters & hiring managers",
      tagTone: "neutral",
      icon: <Briefcase className="h-5 w-5" />,
      name: "Employer Access",
      description: "Fast, secure preview of student-approved recommendations.",
      price: "Free",
      bullets: [
        "Free access for verified company emails",
        "Secure links shared by candidates",
        "Minimal data retention",
        "Compliance-friendly audit trail",
        "Instant viewer UI",
      ],
      cta: { label: "Verify Work Email", href: "/signup?role=employer" },
    },
  ];

  return (
    <section id="pricing" className="bg-[#fbfbf8]">
      <div className="mx-auto max-w-7xl px-6 py-16 md:py-24">
        {/* Heading */}
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-serif text-4xl md:text-5xl font-semibold tracking-tight text-[#0b4726] leading-tight">
            Simple Pricing for{" "}
            <span className="italic text-amber-500">Single-Use</span>{" "}
            Recommendation Links.
          </h2>
          <p className="mt-4 text-sm md:text-base leading-relaxed text-[#5f7f6f]">
            Start free. Pay per link when you need more. Sprint when you’re
            applying everywhere.
          </p>

          {/* Core Rule callout */}
          <div className="mt-6 rounded-2xl border border-[#0b4726]/15 bg-[#eaf3ee] px-5 py-4 text-left shadow-sm">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-[#0b4726]/10 text-[#0b4726]">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <div>
                <div className="text-sm font-semibold text-[#0a2e1c]">
                  Core Rule: every recommendation requires a freshly generated,
                  one-time-use link.
                </div>
                <div className="mt-1 text-sm text-[#5f7f6f]">
                  Links can never be reused. Once submitted, they expire
                  automatically — closing link sharing, replay submissions, and
                  unauthorized reuse.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* STUDENTS HEADER */}
        <div className="mt-14 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold tracking-wide text-black/45">
              FOR STUDENTS
            </div>
            <div className="mt-1 text-xl font-serif font-semibold text-[#0a2e1c]">
              Student Plans
            </div>
          </div>
        </div>

        {/* Student plans grid (equal height) */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {studentPlans.map((p) => (
            <PlanCard key={p.name} plan={p} />
          ))}
        </div>

        {/* VIEWERS HEADER */}
        <div className="mt-14 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold tracking-wide text-black/45">
              FOR FACULTY / VIEWERS
            </div>
            <div className="mt-1 text-xl font-serif font-semibold text-[#0a2e1c]">
              Viewer Access
            </div>
          </div>
        </div>

        {/* Viewer plans grid (equal height) */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          {viewerPlans.map((p) => (
            <PlanCard key={p.name} plan={p} />
          ))}
        </div>

        {/* footer note */}
        <div className="mt-14 text-center">
          <p className="text-sm text-[#5f7f6f]">
            <span className="font-semibold text-[#0b4726]">Faculty members</span>{" "}
            — your access is completely free. Join to manage recommendation
            requests with less follow-up and fewer portals.
          </p>

          <div className="mt-6 flex justify-center">
            <LinkButton
              href="/signup?role=faculty"
              variant="secondary"
              className="rounded-xl px-6 bg-white border border-[#0b4726]/15 hover:bg-[#f3faf6]"
            >
              Register as Faculty
            </LinkButton>
          </div>
        </div>
      </div>
    </section>
  );
}

function PlanCard({ plan }: { plan: Plan }) {
  const isFeatured = !!plan.featured;

  return (
    <div className="relative h-full">

      {/* card */}
      <div
        className={[
          "relative z-10 h-full rounded-2xl bg-white px-7 py-8 flex flex-col",
          "border border-[#0b4726]/10",
          "shadow-[0_10px_30px_rgba(15,23,42,0.04)]",
          "transition-all duration-300 ease-out",
          "hover:shadow-[0_20px_50px_rgba(11,71,38,0.18)]",
        ].join(" ")}
      >
        {/* tag */}
        <div
          className={[
            "inline-flex w-fit items-center rounded-full px-3 py-1 text-[11px] font-bold",
            plan.tagTone === "gold"
              ? "bg-amber-400/90 text-[#0b4726]"
              : "bg-[#eaf3ee] text-[#0b4726] border border-[#0b4726]/10",
          ].join(" ")}
        >
          {plan.tag}
        </div>

        {/* icon */}
        <div className="mt-4">
          <div className="h-12 w-12 rounded-2xl grid place-items-center bg-[#eaf3ee] text-[#0b4726] border border-[#0b4726]/10">
            {plan.icon}
          </div>
        </div>

        {/* content */}
        <div className="mt-6 font-serif text-xl font-semibold text-[#0a2e1c]">
          {plan.name}
        </div>
        <div className="mt-2 text-sm leading-relaxed text-[#5f7f6f]">
          {plan.description}
        </div>

        <div className="mt-6 font-serif text-3xl font-semibold text-[#0b4726]">
          {plan.price}
          {plan.priceSuffix ? (
            <span className="ml-1 text-sm font-semibold text-[#5f7f6f]">
              {plan.priceSuffix}
            </span>
          ) : null}
        </div>

        <ul className="mt-6 space-y-3 text-sm text-[#5f7f6f]">
          {plan.bullets.map((b) => (
            <li key={b} className="flex items-start gap-3">
              <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full text-amber-500">
                <Check className="h-4 w-4" />
              </span>
              <span>{b}</span>
            </li>
          ))}
        </ul>

        {/* CTA pinned to bottom for equal heights */}
        <div className="mt-auto pt-8">
          <LinkButton
            href={plan.cta.href}
            variant={isFeatured ? "gold" : "green"}
            className={[
              "w-full justify-center rounded-xl",
              isFeatured
                ? "bg-amber-500 text-[#0b4726] hover:bg-amber-400"
                : "bg-[#0b4726] text-white hover:opacity-95",
            ].join(" ")}
          >
            {plan.cta.label}
          </LinkButton>
        </div>
      </div>
    </div>
  );
}
