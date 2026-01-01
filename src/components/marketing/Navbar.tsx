"use client";

import Link from "next/link";
import { useState } from "react";
import { LinkButton } from "../ui/LinkButton";

const navLinks = [
  { label: "How it Works", href: "/how-it-works" },
  { label: "For Students", href: "/for-students" },
  { label: "For Faculty", href: "/for-faculty" },
  { label: "Pricing", href: "/pricing" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-[#d9dbe3]">
      <div className="mx-auto max-w-7xl px-6">
        <div className="h-16 flex items-center justify-between">
          {/* Left: Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#0b1553] grid place-items-center shadow-sm">
              {/* simple cap icon */}
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                className="text-amber-400"
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
            </div>
            <span className="font-serif text-lg font-semibold text-[#0b1553]">
              ReadMyStudent
            </span>
          </Link>

          {/* Center: Nav links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-[#5a6487]">
            {navLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="hover:text-[#0b1553] transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </nav>

          {/* Right: Actions */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/signin"
              className="text-sm font-semibold text-[#0b1553]/80 hover:text-[#0b1553] transition-colors"
            >
              Sign In
            </Link>

            <LinkButton
              href="/signup"
              variant="primary"
              size="md"
              className="rounded-xl px-6 bg-[#0b1553] hover:opacity-95"
            >
              Get Started
            </LinkButton>
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            className="md:hidden inline-flex items-center justify-center h-10 w-10 rounded-xl border border-black/10 bg-white/40 text-[#0b1553]"
            aria-label="Open menu"
            onClick={() => setOpen((v) => !v)}
          >
            <div className="flex flex-col gap-1.5">
              <span className="h-0.5 w-5 bg-[#0b1553]" />
              <span className="h-0.5 w-5 bg-[#0b1553]" />
              <span className="h-0.5 w-5 bg-[#0b1553]" />
            </div>
          </button>
        </div>

        {/* Mobile dropdown */}
        {open ? (
          <div className="md:hidden pb-5">
            <div className="mt-2 rounded-2xl bg-white/50 border border-black/10 backdrop-blur px-4 py-4">
              <nav className="flex flex-col gap-3 text-sm font-semibold text-[#5a6487]">
                {navLinks.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className="py-2 hover:text-[#0b1553] transition-colors"
                  >
                    {l.label}
                  </Link>
                ))}
              </nav>

              <div className="mt-4 flex items-center gap-3">
                <Link
                  href="/signin"
                  onClick={() => setOpen(false)}
                  className="text-sm font-semibold text-[#0b1553]/80 hover:text-[#0b1553] transition-colors"
                >
                  Sign In
                </Link>

                <LinkButton
                  href="/signup"
                  variant="primary"
                  size="md"
                  className="rounded-xl px-6 bg-[#0b1553] hover:opacity-95"
                >
                  Get Started
                </LinkButton>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* subtle bottom divider like the screenshot */}
      <div className="h-px bg-black/10" />
    </header>
  );
}
