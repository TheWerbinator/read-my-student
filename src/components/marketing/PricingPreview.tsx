import { Sparkles, Crown, Building2, Briefcase, Check } from "lucide-react";
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
  // eslint-disable-next-line
  cta: { label: string; href: string; variant?: any };
  featured?: boolean;
};

export default function PricingSection() {
  const plans: Plan[] = [
    {
      tag: "Best for getting started",
      tagTone: "neutral",
      icon: <Sparkles className="h-5 w-5" />,
      name: "Student Free",
      description: "Perfect for students trying ReadMyStudent for the first time.",
      price: "$0",
      bullets: [
        "30-day free access",
        "2 faculty recommendation letters",
        "4 secure application links",
        "Consent-based sharing",
        "Trial ends when limits reached or 30 days pass",
      ],
      cta: { label: "Start Free Trial", href: "/signup?role=student", variant: "primary" },
    },
    {
      tag: "Coming Soon",
      tagTone: "gold",
      icon: <Crown className="h-5 w-5" />,
      name: "Student Plus",
      description: "For power users who need higher limits and priority help.",
      price: "$39",
      priceSuffix: "/ year",
      bullets: [
        "Higher recommendation letter limits",
        "More secure application links per year",
        "Longer access to stored RLs",
        "Extended application history",
        "Priority support",
      ],
      cta: { label: "Notify Me", href: "/contact?topic=student-plus", variant: "orange" },
      featured: true,
    },
    {
      tag: "For verified institutions",
      tagTone: "neutral",
      icon: <Building2 className="h-5 w-5" />,
      name: "University Access",
      description: "Secure, read-only access to student-approved recommendation letters.",
      price: "Free",
      bullets: [
        "Free access for verified university domains",
        "View RLs only after student consent",
        "No more managing PDFs & email attachments",
        "Audit trail for when links accessed",
        "Simple, frictionless viewer UI",
      ],
      cta: { label: "Verify University Email", href: "/signup?role=university", variant: "primary" },
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
        "Use secure links shared by candidates",
        "No storage of personal data beyond needed",
        "Simple, frictionless viewer UI",
        "Audit trail for compliance",
      ],
      cta: { label: "Verify Work Email", href: "/signup?role=employer", variant: "primary" },
    },
  ];

  return (
    <section id="pricing" className="bg-[#fbfbf8]">
      <div className="mx-auto max-w-7xl px-6 py-16 md:py-24">
        {/* badge */}
        <div className="flex justify-center">
          <span className="inline-flex items-center rounded-full bg-[#e9e9ef] px-4 py-2 text-xs font-semibold text-[#101c5a]">
            Pricing
          </span>
        </div>

        {/* heading */}
        <div className="mx-auto mt-6 max-w-3xl text-center">
          <h2 className="font-serif text-4xl md:text-5xl font-semibold tracking-tight text-[#0a154a] leading-tight">
            Start Free. <span className="italic text-amber-500">Upgrade When</span>{" "}
            <span className="italic text-amber-500">Ready.</span>
          </h2>
          <p className="mt-4 text-sm md:text-base leading-relaxed text-[#56608b]">
            Start free. Upgrade only when you need more recommendations and applications.
          </p>
        </div>

        {/* plans */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {plans.map((p) => (
            <PlanCard key={p.name} plan={p} />
          ))}
        </div>

        {/* footer note */}
        <div className="mt-14 text-center">
          <p className="text-sm text-[#56608b]">
            <span className="font-semibold text-[#0a154a]">Faculty members</span>{" "}
            — your access is completely free. Join to manage recommendation requests effortlessly.
          </p>

          <div className="mt-6 flex justify-center">
            <LinkButton
              href="/signup?role=faculty"
              variant="secondary"
              className="rounded-xl px-6 bg-white border border-black/10 hover:bg-[#f6f5ee]"
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

  const wrapperClass = [
    "rounded-2xl border border-black/10 shadow-[0_10px_30px_rgba(15,23,42,0.04)]",
    "px-7 py-8 flex flex-col",
    "transition-all duration-300 ease-out",
    isFeatured
      ? "bg-[#0b1553] text-white border-transparent scale-[1.02]"
      : "bg-white",
    !isFeatured ? "hover:scale-[1.02] hover:border-amber-300 hover:shadow-[0_20px_50px_rgba(245,197,66,0.18)]" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const tagClass = [
    "inline-flex items-center rounded-full px-3 py-1 text-[11px] font-bold",
    plan.tagTone === "gold"
      ? "bg-amber-400 text-[#0b1553]"
      : isFeatured
      ? "bg-white/10 text-white/85 border border-white/15"
      : "bg-[#eef0f8] text-[#101c5a]",
  ].join(" ");

  const iconTileClass = [
    "h-12 w-12 rounded-2xl grid place-items-center border border-black/5",
    isFeatured ? "bg-white/10 text-amber-300 border-white/15" : "bg-[#eef0f8] text-[#0b1553]",
  ].join(" ");

  const nameClass = [
    "mt-6 font-serif text-xl font-semibold",
    isFeatured ? "text-white" : "text-[#0a154a]",
  ].join(" ");

  const descClass = [
    "mt-2 text-sm leading-relaxed",
    isFeatured ? "text-white/70" : "text-[#5f6a93]",
  ].join(" ");

  const priceClass = [
    "mt-6 font-serif text-3xl font-semibold",
    isFeatured ? "text-white" : "text-[#0b1553]",
  ].join(" ");

  const listText = isFeatured ? "text-white/85" : "text-[#56608b]";

  return (
    <div className={wrapperClass}>
      {/* tag */}
      <div className={tagClass}>{plan.tag}</div>

      {/* icon */}
      <div className="mt-4">
        <div className={iconTileClass}>{plan.icon}</div>
      </div>

      {/* content */}
      <div className={nameClass}>{plan.name}</div>
      <div className={descClass}>{plan.description}</div>

      <div className={priceClass}>
        {plan.price}
        {plan.priceSuffix ? (
          <span className={`ml-1 text-sm font-semibold ${isFeatured ? "text-white/70" : "text-[#56608b]"}`}>
            {plan.priceSuffix}
          </span>
        ) : null}
      </div>

      <ul className={`mt-6 space-y-3 text-sm ${listText}`}>
        {plan.bullets.map((b) => (
          <li key={b} className="flex items-start gap-3">
            <span
              className={[
                "mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full",
                isFeatured ? "bg-amber-400/15 text-amber-300" : "text-amber-500",
              ].join(" ")}
            >
              <Check className="h-4 w-4" />
            </span>
            <span>{b}</span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <div className="mt-8">
        {isFeatured ? (
          <LinkButton
            href={plan.cta.href}
            variant="gold"
            className="w-full justify-center rounded-xl bg-amber-500 text-[#0b1553] hover:bg-amber-400"
          >
            {plan.cta.label}
          </LinkButton>
        ) : (
          <LinkButton
            href={plan.cta.href}
            variant="primary"
            className="w-full justify-center rounded-xl bg-[#0b1553] hover:opacity-95"
          >
            {plan.cta.label}
          </LinkButton>
        )}
      </div>
    </div>
  );
}
