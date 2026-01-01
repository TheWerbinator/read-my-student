"use client";

import { useState } from "react";
import Link from "next/link";

export default function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button className="font-bold flex text-2xl text-orange-400 md:hidden" onClick={() => setIsOpen(!isOpen)}>☰</button>
      {isOpen && (
        <div className="absolute right-0 top-0 h-full w-full bg-white shadow-xl p-6">
          <div className="flex items-center justify-between text-black">
            <p className="font-semibold text-orange-400">Menu</p>
            <button className="rounded-md font-semibold border-2 px-3 py-2 border-orange-400 text-orange-400" type="button" onClick={() =>setIsOpen(false)} aria-label="Close menu">✕</button>
          </div>

          <nav className="mt-6 flex flex-col gap-2 text-black">
            <Link
              href="/pricing"
              onClick={() => setIsOpen(false)}
              className="group flex items-center justify-between rounded-xl px-4 py-3 text-base font-medium
                        bg-neutral-50 hover:bg-neutral-100 active:scale-[0.98]
                        transition"
            >
              Pricing
              <span className="text-neutral-400 group-hover:translate-x-1 transition">
                →
              </span>
            </Link>

            <Link
              href="/privacy"
              onClick={() => setIsOpen(false)}
              className="group flex items-center justify-between rounded-xl px-4 py-3 text-base font-medium
                        bg-neutral-50 hover:bg-neutral-100 active:scale-[0.98]
                        transition"
            >
              Privacy
              <span className="text-neutral-400 group-hover:translate-x-1 transition">
                →
              </span>
            </Link>

            <Link
              href="/terms"
              onClick={() => setIsOpen(false)}
              className="group flex items-center justify-between rounded-xl px-4 py-3 text-base font-medium
                        bg-neutral-50 hover:bg-neutral-100 active:scale-[0.98]
                        transition"
            >
              Terms
              <span className="text-neutral-400 group-hover:translate-x-1 transition">
                →
              </span>
            </Link>
          </nav>

        </div>
      )}
    </>
  )
}