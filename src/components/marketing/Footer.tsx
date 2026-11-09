import Link from "next/link";
import Image from "next/image";
import LogoWhite from "../../../public/Logo_Official_White.png";
import { Mail } from "lucide-react";
import { BrandIcon } from "./BrandIcon";

type FooterLink = { label: string; href: string };

const columns: { title: string; links: FooterLink[] }[] = [
  {
    title: "Product",
    links: [
      { label: "How it works", href: "/how-it-works" },
      { label: "For students", href: "/for-students" },
      { label: "For professors", href: "/for-faculty" },
      { label: "Pricing", href: "/pricing" },
    ],
  },
  {
    title: "Help",
    links: [
      { label: "FAQ", href: "/faq" },
      { label: "Contact", href: "/contact" },
      { label: "About us", href: "/about" },
      { label: "Security", href: "/security" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "FERPA", href: "/ferpa" },
      { label: "Privacy policy", href: "/privacy" },
      { label: "Terms of service", href: "/terms" },
      { label: "Accessibility", href: "/accessibility" },
    ],
  },
];

const copyright = `© ${new Date().getFullYear()} ReadMyStudent. Owned and operated by YS2PC Research Group LLC.`;

/** `compact` is the one-line version for pages a professor or school opens from an email. */
export default function Footer({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <footer className='border-t border-flap px-4 py-6 text-center text-xs text-flap-dim'>
        <p>{copyright}</p>
        <p className='mt-1'>
          {[
            ["/privacy", "Privacy"],
            ["/terms", "Terms"],
            ["/contact", "Contact"],
          ].map(([href, label]) => (
            <Link key={href} href={href} className='inline-block px-2 py-3 text-flap-ink/85 underline'>
              {label}
            </Link>
          ))}
        </p>
      </footer>
    );
  }

  return (
    <footer className='board bg-board-deep'>
      <div className='mx-auto max-w-6xl px-5 py-12 md:px-8 md:py-16'>
        <div className='grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]'>
          <div>
            <Link href='/' className='inline-block' aria-label='ReadMyStudent home'>
              <Image src={LogoWhite} alt='ReadMyStudent' className='h-auto w-40' />
            </Link>
            <p className='mt-4 max-w-xs text-sm leading-relaxed text-flap-dim'>
              Recommendation letters, requested in minutes and sealed for the schools that read them.
            </p>
            <div className='mt-6 flex items-center gap-2'>
              <SocialIcon href='https://x.com/TheWerbinator' label='ReadMyStudent on X'>
                <BrandIcon className='size-4' name='twitter' />
              </SocialIcon>
              <SocialIcon href='https://www.linkedin.com/in/shawn-werber/' label='LinkedIn'>
                <BrandIcon className='size-4' name='linkedin' />
              </SocialIcon>
              <SocialIcon href='https://github.com/TheWerbinator' label='GitHub'>
                <BrandIcon className='size-4' name='github' />
              </SocialIcon>
              <SocialIcon href='/contact' label='Contact us'>
                <Mail className='size-4' />
              </SocialIcon>
            </div>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h2 className='caption text-flap-dim'>{col.title}</h2>
              <ul className='mt-4 space-y-1'>
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className='inline-block py-1.5 text-sm text-flap-ink/85 hover:text-flap-ink hover:underline'
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className='mt-12 border-t border-flap pt-6 text-xs text-flap-dim'>{copyright}</div>
      </div>
    </footer>
  );
}

function SocialIcon({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <Link href={href} aria-label={label} className='flap flap-roll size-11 text-flap-ink/85'>
      {children}
      {/* Flip layers: old top falls, old bottom holds, new (gold) bottom lands. */}
      <span aria-hidden='true' className='flap-roll-leaf flap-roll-hold'>{children}</span>
      <span aria-hidden='true' className='flap-roll-leaf flap-roll-top'>{children}</span>
      <span aria-hidden='true' className='flap-roll-leaf flap-roll-bottom'>{children}</span>
    </Link>
  );
}
