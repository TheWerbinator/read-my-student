"use client";

import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import { COUNTRIES } from "@/lib/countries";

type Props = {
  label?: string;
  required?: boolean;
  value: string; // ISO-2 country code, e.g. "IN"
  onChange: (code: string) => void;
  invalid?: boolean;
  errorId?: string;
};

export function CountryCombobox({
  label = "Country / region",
  required,
  value,
  onChange,
  invalid,
  errorId,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const wrapRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const uid = useId();
  const triggerId = `${uid}-trigger`;
  const listId = `${uid}-list`;
  const optionId = (code: string) => `${uid}-opt-${code}`;

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
  const activeItem = filtered[safeActiveIndex];

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

  // keep the active option in view during arrow-key navigation
  useEffect(() => {
    if (!open || !activeItem) return;
    document
      .getElementById(optionId(activeItem.code))
      ?.scrollIntoView({ block: "nearest" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, activeItem]);

  function selectCountry(code: string) {
    onChange(code);
    setQuery("");
    setOpen(false);
    document.getElementById(triggerId)?.focus();
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
      document.getElementById(triggerId)?.focus();
    }
  }

  return (
    <div ref={wrapRef} className='grid gap-2'>
      <label htmlFor={triggerId} className='caption text-ink-2'>
        {label}
        {required ? <span className='text-declined'> *</span> : null}
      </label>

      <div className='relative'>
        <button
          id={triggerId}
          type='button'
          onClick={() => (open ? setOpen(false) : openAndFocus())}
          className={[
            "flex h-11 w-full items-center justify-between gap-3 rounded-[2px] border bg-white px-3 text-left text-base text-ink",
            "focus-visible:border-forest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold",
            invalid ? "border-destructive ring-1 ring-destructive" : "border-input",
          ].join(" ")}
          aria-haspopup='listbox'
          aria-expanded={open}
          aria-controls={open ? listId : undefined}
          aria-describedby={invalid ? errorId : undefined}
        >
          <span className={selected ? "" : "text-ink-2"}>
            {selected ? selected.name : "Select a country..."}
          </span>

          <span aria-hidden='true' className='text-ink-2'>▾</span>
        </button>

        {open && (
          <div className='absolute z-50 mt-1 w-full rounded-[2px] border border-rule bg-white shadow-lg'>
            <div className='p-2'>
              <input
                ref={inputRef}
                role='combobox'
                aria-expanded={open}
                aria-controls={listId}
                aria-autocomplete='list'
                aria-activedescendant={
                  activeItem ? optionId(activeItem.code) : undefined
                }
                aria-label='Search countries'
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActiveIndex(0);
                }}
                onKeyDown={onKeyDown}
                placeholder='Search countries...'
                className='h-11 w-full rounded-[2px] border border-input bg-white px-3 text-base text-ink placeholder:text-ink-2/80 focus-visible:border-forest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold'
              />
            </div>

            <div
              id={listId}
              role='listbox'
              aria-label={label}
              className='max-h-72 overflow-auto p-1'
            >
              {filtered.length === 0 ? (
                <div role='presentation' className='px-3 py-3 text-sm text-ink-2'>
                  No results.
                </div>
              ) : (
                filtered.map((c, idx) => {
                  const isSelected = c.code === value;
                  const isActive = idx === safeActiveIndex;

                  return (
                    <button
                      type='button'
                      id={optionId(c.code)}
                      key={c.code}
                      tabIndex={-1}
                      onMouseEnter={() => setActiveIndex(idx)}
                      onClick={() => selectCountry(c.code)}
                      className={[
                        "flex min-h-11 w-full items-center justify-between gap-3 rounded-[2px] px-3 py-2 text-left text-base",
                        isActive ? "bg-paper-2" : "hover:bg-paper-2",
                      ].join(" ")}
                      role='option'
                      aria-selected={isSelected}
                    >
                      <span className='text-ink'>{c.name}</span>
                      <span className='flex items-center gap-2 text-xs text-ink-2'>
                        {c.code}
                        {isSelected ? (
                          <span aria-hidden='true' className='text-sealed'>✓</span>
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
