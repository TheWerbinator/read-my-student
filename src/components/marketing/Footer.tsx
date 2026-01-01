import Link from "next/link";
import {
  Twitter,
  Linkedin,
  Github,
  Mail,
  ShieldCheck,
  Globe,
  Lock,
} from "lucide-react";

type FooterLink = { label: string; href: string };

export default function Footer() {
  const product: FooterLink[] = [
    { label: "Features", href: "#features" },
    { label: "Pricing", href: "#pricing" },
    { label: "Security", href: "#trust" },
    { label: "Integrations", href: "#integrations" },
  ];

  const company: FooterLink[] = [
    { label: "About Us", href: "/about" },
    { label: "Careers", href: "/careers" },
    { label: "Blog", href: "/blog" },
    { label: "Press", href: "/press" },
  ];

  const resources: FooterLink[] = [
    { label: "Documentation", href: "/docs" },
    { label: "Help Center", href: "/help" },
    { label: "Contact", href: "/contact" },
    { label: "Status", href: "/status" },
  ];

  const legal: FooterLink[] = [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
    { label: "GDPR", href: "/gdpr" },
    { label: "FERPA Compliance", href: "/ferpa" },
  ];

  return (
    <footer className="bg-[#071225] text-white">
      <div className="mx-auto max-w-7xl px-6 py-14 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-10">
          {/* Brand column */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-flex items-center gap-3">
              <span className="h-10 w-10 rounded-xl bg-amber-400 text-[#071225] grid place-items-center">
                {/* cap icon */}
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="text-[#071225]"
                >
                  <path
                    d="M12 3 2 8l10 5 10-5-10-5Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M6 10v6c0 2 4 4 6 4s6-2 6-4v-6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>

              <span className="font-serif text-lg font-semibold">
                ReadMyStudent
              </span>
            </Link>

            <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/70">
              The trusted global platform for academic recommendation letters. Secure,
              consent-driven, and built for privacy.
            </p>

            {/* Social icons */}
            <div className="mt-6 flex items-center gap-3">
              <SocialIcon href="#" label="Twitter">
                <Twitter className="h-4 w-4" />
              </SocialIcon>
              <SocialIcon href="#" label="LinkedIn">
                <Linkedin className="h-4 w-4" />
              </SocialIcon>
              <SocialIcon href="#" label="GitHub">
                <Github className="h-4 w-4" />
              </SocialIcon>
              <SocialIcon href="/contact" label="Email">
                <Mail className="h-4 w-4" />
              </SocialIcon>
            </div>
          </div>

          {/* Columns */}
          <FooterCol title="Product" links={product} />
          <FooterCol title="Company" links={company} />
          <FooterCol title="Resources" links={resources} />
          <FooterCol title="Legal" links={legal} />
        </div>

        {/* divider */}
        <div className="mt-12 h-px bg-white/10" />

        {/* bottom bar */}
        <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="text-xs text-white/50">
            © 2025 ReadMyStudent. Owned and operated by YS2PC Research Group LLC. All rights reserved.
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-semibold text-white/60">
            <span className="inline-flex items-center gap-2">
              <Lock className="h-4 w-4 text-amber-400" />
              SOC 2 Type II Certified
            </span>
            <span className="inline-flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-amber-400" />
              FERPA Compliant
            </span>
            <span className="inline-flex items-center gap-2">
              <Globe className="h-4 w-4 text-amber-400" />
              GDPR Ready
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: FooterLink[] }) {
  return (
    <div>
      <div className="font-serif text-sm font-semibold text-white/90">
        {title}
      </div>
      <ul className="mt-4 space-y-3">
        {links.map((l) => (
          <li key={l.label}>
            <Link
              href={l.href}
              className="text-sm text-white/65 hover:text-white transition-colors"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SocialIcon({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="h-10 w-10 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white grid place-items-center transition"
    >
      {children}
    </Link>
  );
}
