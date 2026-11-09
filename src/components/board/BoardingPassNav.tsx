"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Plane } from "lucide-react";
import { cn } from "@/lib/utils";
import Logo from "../../../public/green_yellow_logo_sized.png";

export type PassItem = { label: string; href: string; note: string };

type BoardingPassNavProps = {
  items: PassItem[];
  /** The tear-off stub: the actions that matter most on this surface. */
  stub: React.ReactNode;
  /** Color behind the pass, so the punched notches show the page through. */
  notch?: string;
};

/**
 * Site navigation as a boarding pass: a vertical pass on the left at lg+,
 * and a sideways strip on top below that, which unfolds into the full pass.
 */
export function BoardingPassNav({ items, stub, notch = "var(--board)" }: BoardingPassNavProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on Escape, and lock scroll while unfolded. Links close it on click.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    panelRef.current?.querySelector<HTMLElement>("a,button")?.focus();
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  const nav = (
    <ul className='flex flex-col'>
      {items.map((item) => {
        const active = isActive(item.href);
        return (
          <li key={item.href} className='border-b border-rule last:border-b-0'>
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              onClick={() => setOpen(false)}
              className={cn(
                "group flex items-start gap-3 px-1 py-2.5 outline-offset-0",
                active ? "text-forest-ink" : "text-ink hover:text-forest",
              )}
            >
              <span
                aria-hidden='true'
                className={cn(
                  "mt-1.5 size-2.5 shrink-0 rounded-[1px] border",
                  active ? "border-gold-deep bg-gold" : "border-ink-2/50 group-hover:border-forest",
                )}
              />
              <span className='min-w-0'>
                <span className='block font-display text-xl font-bold uppercase leading-none tracking-[0.04em]'>
                  {item.label}
                </span>
                <span className='mt-1 block text-xs leading-snug text-ink-2'>{item.note}</span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );

  const route = (
    <div className='flex items-end justify-between gap-2 px-1'>
      <div>
        <div className='caption text-ink-2'>From</div>
        <div className='font-display text-2xl font-extrabold uppercase leading-none'>Request</div>
      </div>
      <Plane aria-hidden='true' className='mb-1 size-4 shrink-0 text-forest' />
      <div className='text-right'>
        <div className='caption text-ink-2'>To</div>
        <div className='font-display text-2xl font-extrabold uppercase leading-none'>School</div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop: the vertical pass. */}
      <nav
        aria-label='Main'
        style={{ ["--notch" as string]: notch }}
        // overflow-x-hidden: the perforation notches sit outside the pass and must clip, not scroll.
        className='sheet fixed inset-y-4 left-4 z-40 hidden w-60 flex-col overflow-y-auto overflow-x-hidden lg:flex'
      >
        <div className='px-5 pt-5'>
          <Link href='/' className='block' aria-label='ReadMyStudent home'>
            <Image src={Logo} alt='ReadMyStudent' className='h-auto w-36' priority />
          </Link>
        </div>
        <div className='mt-5 px-4'>{route}</div>
        <div className='mt-4 px-4'>{nav}</div>
        <div className='mt-auto pt-6'>
          <div className='perforation' />
          <div className='flex flex-col gap-3 px-5 py-5'>{stub}</div>
        </div>
      </nav>

      {/* Mobile: the pass turned sideways. */}
      <div className='sticky top-0 z-50 px-2 pt-2 lg:hidden'>
        <div
          style={{ ["--notch" as string]: notch }}
          className='sheet flex h-16 items-stretch'
        >
          <Link href='/' className='flex items-center px-3' aria-label='ReadMyStudent home'>
            <Image src={Logo} alt='ReadMyStudent' className='h-auto w-28' priority />
          </Link>
          <div className='ml-auto perforation-v' />
          <button
            type='button'
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls='pass-panel'
            className='flex min-w-24 flex-col items-center justify-center px-4 font-display text-lg font-bold uppercase leading-none tracking-[0.06em] text-forest-ink'
          >
            <span className='caption text-[0.625rem] text-ink-2'>Gate</span>
            {open ? "Close" : "Menu"}
          </button>
        </div>

        {open && (
          <>
            <div
              aria-hidden='true'
              onClick={() => setOpen(false)}
              className='fixed inset-0 top-[4.5rem] bg-board-deep/60'
            />
            <div
              id='pass-panel'
              ref={panelRef}
              style={{ ["--notch" as string]: notch }}
              className='sheet relative mt-1 max-h-[calc(100dvh-5.5rem)] overflow-y-auto overflow-x-hidden'
            >
              <nav aria-label='Main' className='px-4 pt-4'>
                {route}
                <div className='mt-3'>{nav}</div>
              </nav>
              <div className='mt-4 perforation' />
              <div className='flex flex-col gap-3 px-4 py-4'>{stub}</div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
