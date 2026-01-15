"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LinkButton } from "../ui/LinkButton";

import {
  Home,
  Info,
  GraduationCap,
  UserRound,
  BadgeDollarSign,
  PanelLeftOpen,
  PanelLeftClose,
  LogIn,
  Sparkles,
} from "lucide-react";

const navLinks = [
  { label: "Home", href: "/", icon: Home },
  { label: "How it Works", href: "/how-it-works", icon: Info },
  { label: "For Students", href: "/for-students", icon: GraduationCap },
  { label: "For Faculty", href: "/for-faculty", icon: UserRound },
  { label: "Pricing", href: "/pricing", icon: BadgeDollarSign },
];

const BANNER_H = 150;
const NAV_INSET_Y = 120;

const COLLAPSED_W = 76;
const EXPANDED_W = 240;

export default function SideNavbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <aside
      className={[
        "hidden xl:flex fixed left-6 z-40",
        "rounded-3xl border border-black/10",
        "bg-white/70 backdrop-blur",
        "shadow-xl shadow-black/10",
        "overflow-visible transition-[width] duration-200 ease-out",
      ].join(" ")}
      style={{
        top: BANNER_H + NAV_INSET_Y,
        width: open ? EXPANDED_W : COLLAPSED_W,
        height: `calc(100vh - ${BANNER_H + NAV_INSET_Y * 2}px)`,
      }}
    >
      <div className="relative flex h-full w-full flex-col p-4">
        {/* Top: toggle + (optional) brand */}
        <div className="flex items-center justify-between gap-2">
          {/* Brand shows only when open; no hover expansion */}
          <div className="min-w-0">
            {open ? (
              <div className="text-sm font-semibold text-[#0b4726] whitespace-nowrap">
                ReadMyStudent
              </div>
            ) : null}
          </div>

        <div className="relative group">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="rounded-2xl p-2 hover:bg-black/10 transition-colors cursor-pointer"
            aria-label={open ? "Collapse sidebar" : "Expand sidebar"}
          >
            {open ? (
              <PanelLeftClose className="h-4 w-4 text-[#0b4726]" />
            ) : (
              <PanelLeftOpen className="h-4 w-4 text-[#0b4726]" />
            )}
          </button>

          {/* Expand pill tooltip */}
          {!open && (
            <span
              className={[
                "pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3",
                "whitespace-nowrap rounded-2xl px-4 py-2 text-sm font-semibold",
                "bg-white/90 text-[#0b4726]",
                "border border-black/10 shadow-lg shadow-black/10",
                "opacity-0 translate-x-1",
                "transition-all duration-200 ease-out",
                "group-hover:opacity-100 group-hover:translate-x-0",
              ].join(" ")}
            >
              Expand
            </span>
          )}
        </div>
      </div>

        <div className="h-px bg-black/10 my-4" />

        {/* Nav */}
        <nav className="flex flex-col gap-1">
          {navLinks.map((l) => {
            const Icon = l.icon;
            const isActive = pathname === l.href;

            const baseBg = isActive ? "bg-[#0b4726]/10" : "bg-transparent";
            const hoverBg = isActive ? "hover:bg-[#0b4726]/10" : "hover:bg-black/10";
            const textColor = isActive ? "text-[#0b4726]" : "text-[#247037]";
            const hoverText = "hover:text-[#0b4726]";

            return (
              <Link
                key={l.href}
                href={l.href}
                className={[
                  "group relative flex items-center",
                  "rounded-2xl px-3 py-2.5 text-sm font-semibold",
                  "transition-colors",
                  baseBg,
                  hoverBg,
                  textColor,
                  hoverText,
                ].join(" ")}
              >

                {/* Icon always visible */}
                <Icon className="h-4 w-4 shrink-0" />

                {/* Expanded mode label */}
                {open ? (
                  <span className="ml-3 whitespace-nowrap">{l.label}</span>
                ) : null}

                {/* Collapsed mode: pop-out pill label on hover */}
                {!open ? (
                  <span
                    className={[
                      "pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3",
                      "whitespace-nowrap rounded-2xl px-4 py-2 text-sm font-semibold",
                      "border border-black/10 shadow-lg shadow-black/10",
                      // same “feel” as the hovered item
                      isActive ? "bg-[#eaf3ee] text-[#0b4726]" : "bg-white/90 text-[#0b4726]",
                      "opacity-0 translate-x-1",
                      "transition-all duration-200 ease-out",
                      "group-hover:opacity-100 group-hover:translate-x-0",
                    ].join(" ")}
                  >
                    {l.label}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="mt-auto pt-6">
          <div className="h-px bg-black/10 mb-4" />

          {open ? (
            <div className="flex flex-col gap-3">
              <LinkButton
                href="/auth/login"
                variant="green"
                size="md"
                className="rounded-2xl w-full justify-center shadow-sm shadow-black/10 hover:shadow-md transition"
              >
                Log In
              </LinkButton>

              <LinkButton
                href="/auth/signup"
                variant="gold"
                size="md"
                className="rounded-2xl w-full justify-center shadow-sm shadow-black/10 hover:shadow-md transition"
              >
                Get Started
              </LinkButton>

              <div className="pt-2 text-xs text-black/45 leading-snug">
                Built for faculty speed and student clarity.
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
            {/* Sign In (icon only) */}
            <div className="relative group">
              <LinkButton
                href="/auth/login"
                variant="green"
                size="md"
                className={[
                  "w-full justify-center rounded-2xl",
                  "px-0", // icon-only
                  "shadow-sm shadow-black/10 hover:shadow-md transition",
                ].join(" ")}
                aria-label="Log In"
              >
                <LogIn className="h-4 w-4 scale-[1.35] transform" />
              </LinkButton>

              <span
                className={[
                  "pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3",
                  "whitespace-nowrap rounded-2xl px-4 py-2 text-sm font-semibold",
                  "bg-white/90 text-[#0b4726]",
                  "border border-black/10 shadow-lg shadow-black/10",
                  "opacity-0 translate-x-1",
                  "transition-all duration-200 ease-out",
                  "group-hover:opacity-100 group-hover:translate-x-0",
                ].join(" ")}
              >
                Log In
              </span>
            </div>

            {/* Get Started (icon only) */}
            <div className="relative group">
              <LinkButton
                href="/auth/signup"
                variant="gold"
                size="md"
                className={[
                  "w-full justify-center rounded-2xl",
                  "px-0", // icon-only
                  "shadow-sm shadow-black/10 hover:shadow-md transition",
                ].join(" ")}
                aria-label="Get Started"
              >
                <Sparkles className="h-4 w-4 scale-[1.35] transform" />
              </LinkButton>

              <span
                className={[
                  "pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3",
                  "whitespace-nowrap rounded-2xl px-4 py-2 text-sm font-semibold",
                  "bg-white/90 text-[#0b4726]",
                  "border border-black/10 shadow-lg shadow-black/10",
                  "opacity-0 translate-x-1",
                  "transition-all duration-200 ease-out",
                  "group-hover:opacity-100 group-hover:translate-x-0",
                ].join(" ")}
              >
                Get Started
              </span>
            </div>
          </div>
          )}
        </div>
      </div>
    </aside>
  );
}