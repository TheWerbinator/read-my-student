import Link from "next/link";
import Image from "next/image";
import LogoOfficial from "../../../public/Logo_Official_White.png";

import {
  Twitter,
  Linkedin,
  Github,
  Mail,
} from "lucide-react";

type FooterLink = { label: string; href: string };

export default function Footer() {
  const product: FooterLink[] = [
    { label: "Features", href: "/how-it-works" },
    { label: "Pricing", href: "/pricing" },
  ];

  const company: FooterLink[] = [
    { label: "About Us", href: "/about-us" },
    { label: "Careers", href: "/careers" },
  ];

  const resources: FooterLink[] = [
    { label: "Contact", href: "/contact" },
    { label: "FAQ", href: "/faq" },
    { label: "Security", href: "/security" }
    // { label: "SiteMap", href: "/sitemap.xml" } // NEED TO CHANGE TO ACTUAL SITEMAP ONCE DEPLOYED
  ];

  const legal: FooterLink[] = [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
  ];

  return (
    <footer className="bg-[#07351c] text-white">
      <div className="mx-auto max-w-7xl px-6 py-14 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-10">
          {/* Brand column */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-flex items-center gap-3">
              <Image
                src={LogoOfficial}
                alt="ReadMyStudent logo"
                width={450}
                height={400}
                priority
                className="h-24 sm:h-36 lg:h-40 xl:h-48 w-auto"
              />
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
