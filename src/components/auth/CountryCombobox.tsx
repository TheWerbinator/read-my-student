"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { COUNTRIES } from "@/lib/countries";

type Props = {
  label?: string;
  required?: boolean;
  value: string; // country code, e.g. "US"
  onChange: (code: string) => void;
};

export function CountryCombobox({
  label = "Country / region",
  required,
  value,
  onChange,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const wrapRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const selected = useMemo(
    () => COUNTRIES.find((c) => c.code === value) ?? null,
    [value],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COUNTRIES;

    return COUNTRIES.filter((c) => {
      const name = c.name.toLowerCase();
      const code = c.code.toLowerCase();
      return name.includes(q) || code.includes(q);
    });
  }, [query]);

  const safeActiveIndex =
    filtered.length === 0 ? 0 : Math.min(activeIndex, filtered.length - 1);

  // close on outside click
  useEffect(() => {
    function onDocMouseDown(e: MouseEvent) {
      const el = wrapRef.current;
      if (!el) return;
      if (!el.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, []);

  function selectCountry(code: string) {
    onChange(code);
    setQuery("");
    setOpen(false);
  }

  function openAndFocus() {
    setOpen(true);
    // focus next tick so the input exists
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) return openAndFocus();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) return openAndFocus();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      if (!open) return;
      e.preventDefault();
      const item = filtered[safeActiveIndex];
      if (item) selectCountry(item.code);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    }
  }

  return (
    <div
      ref={wrapRef}
      className='grid grid-cols-1 gap-4 md:grid-cols-3 md:items-center'
    >
      <label className='text-sm font-medium text-gray-800'>
        {label}
        {required ? <span className='text-red-600'> *</span> : null}
      </label>

      <div className='relative md:col-span-2'>
        {/* Button/Trigger */}
        <button
          type='button'
          onClick={() => (open ? setOpen(false) : openAndFocus())}
          className={[
            "w-full rounded border border-gray-300 bg-white px-3 py-2 text-left text-sm text-gray-700",
            "flex items-center justify-between gap-3",
            "focus:outline-none focus:ring-2 focus:ring-green-900/30",
          ].join(" ")}
          aria-haspopup='listbox'
          aria-expanded={open}
        >
          <span className={selected ? "" : "text-gray-400"}>
            {selected ? selected.name : "Select a country..."}
          </span>

          <span className='text-gray-400'>▾</span>
        </button>

        {/* Dropdown */}
        {open && (
          <div
            className='absolute z-50 mt-2 w-full rounded-xl border border-black/10 bg-white shadow-xl shadow-black/10'
            role='listbox'
          >
            <div className='p-2'>
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActiveIndex(0);
                }}
                onKeyDown={onKeyDown}
                placeholder='Search countries...'
                className='w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-900/30'
              />
            </div>

            <div className='max-h-72 overflow-auto p-1'>
              {filtered.length === 0 ? (
                <div className='px-3 py-3 text-sm text-gray-500'>
                  No results.
                </div>
              ) : (
                filtered.map((c, idx) => {
                  const isSelected = c.code === value;
                  const isActive = idx === safeActiveIndex;

                  return (
                    <button
                      type='button'
                      key={c.code}
                      onMouseEnter={() => setActiveIndex(idx)}
                      onClick={() => selectCountry(c.code)}
                      className={[
                        "w-full px-3 py-2 text-left text-sm flex items-center justify-between gap-3 rounded-lg",
                        isActive ? "bg-green-900/10" : "hover:bg-black/5",
                      ].join(" ")}
                      role='option'
                      aria-selected={isSelected}
                    >
                      <span className='text-gray-800'>{c.name}</span>
                      <span className='text-xs text-black/40 flex items-center gap-2'>
                        {c.code}
                        {isSelected ? (
                          <span className='text-green-900'>✓</span>
                        ) : null}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
