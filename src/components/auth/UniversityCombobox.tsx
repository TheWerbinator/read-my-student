"use client";

import React, { useEffect, useId, useRef, useState } from "react";

type University = {
  id: string;
  name: string;
  countryCode: string;
  city?: string;
  region?: string;
  homepageUrl?: string;
  ror?: string | null;
};

type Props = {
  countryCode: string; // ISO-2, e.g. "IN"
  value: University | null; // selected university (store object or just id/name)
  onChange: (u: University | null) => void;
  required?: boolean;
  disabled?: boolean;
  label?: string;
  invalid?: boolean;
  errorId?: string;
};

export function UniversityCombobox({
  countryCode,
  value,
  onChange,
  required,
  disabled,
  label = "University",
  invalid,
  errorId,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<University[]>([]);
  const [error, setError] = useState<string>("");

  const wrapRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const uid = useId();
  const triggerId = `${uid}-trigger`;
  const listId = `${uid}-list`;
  const optionId = (id: string) => `${uid}-opt-${id}`;

  const safeActiveIndex =
    results.length === 0 ? 0 : Math.min(activeIndex, results.length - 1);
  const activeItem = results[safeActiveIndex];

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

  // Debounced fetch
  useEffect(() => {
    if (!open) return;
    if (disabled) return;

    const q = query.trim();
    if (q.length < 3) {
      setResults([]);
      setError("");
      return;
    }

    const t = window.setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(
          `/api/universities?countryCode=${encodeURIComponent(countryCode)}&q=${encodeURIComponent(q)}`,
        );
        const data = await res.json();
        if (!res.ok)
          throw new Error(data?.error ?? "Failed to load universities");
        setResults(data.results ?? []);
        setActiveIndex(0);
        // eslint-disable-next-line
      } catch (e: any) {
        setResults([]);
        setError(e?.message ?? "Failed to load universities");
      } finally {
        setLoading(false);
      }
    }, 750);

    return () => window.clearTimeout(t);
  }, [query, countryCode, open, disabled]);

  // keep the active option in view during arrow-key navigation
  useEffect(() => {
    if (!open || !activeItem) return;
    document
      .getElementById(optionId(activeItem.id))
      ?.scrollIntoView({ block: "nearest" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, activeItem]);

  function openAndFocus() {
    if (disabled) return;
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function selectUniversity(u: University) {
    onChange(u);
    setOpen(false);
    setQuery("");
    document.getElementById(triggerId)?.focus();
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = results[safeActiveIndex];
      if (item) selectUniversity(item);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      document.getElementById(triggerId)?.focus();
    }
  }

  const hasOptions = !loading && !error && results.length > 0;

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
          disabled={disabled}
          onClick={() => (open ? setOpen(false) : openAndFocus())}
          className={[
            "flex h-11 w-full items-center justify-between gap-3 rounded-[2px] border bg-white px-3 text-left text-base text-ink",
            "focus-visible:border-forest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold",
            invalid ? "border-destructive ring-1 ring-destructive" : "border-input",
            disabled ? "cursor-not-allowed bg-paper-2 opacity-60" : "",
          ].join(" ")}
          aria-haspopup='listbox'
          aria-expanded={open && !disabled}
          aria-controls={open && !disabled ? listId : undefined}
          aria-describedby={invalid ? errorId : undefined}
        >
          <span className={value ? "" : "text-ink-2"}>
            {value
              ? value.name
              : disabled
                ? "Select a country first"
                : "Search and select..."}
          </span>
          <span aria-hidden='true' className='text-ink-2'>▾</span>
        </button>

        {open && !disabled && (
          <div className='absolute z-50 mt-1 w-full rounded-[2px] border border-rule bg-white shadow-lg'>
            <div className='p-2'>
              <input
                ref={inputRef}
                role='combobox'
                aria-expanded={open}
                aria-controls={listId}
                aria-autocomplete='list'
                aria-activedescendant={
                  hasOptions && activeItem ? optionId(activeItem.id) : undefined
                }
                aria-label={`Search ${label.toLowerCase()}`}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder='Type at least 3 letters...'
                className='h-11 w-full rounded-[2px] border border-input bg-white px-3 text-base text-ink placeholder:text-ink-2/80 focus-visible:border-forest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold'
              />
            </div>

            <div
              id={listId}
              role='listbox'
              aria-label={label}
              aria-busy={loading}
              className='max-h-72 overflow-auto p-1'
            >
              {loading ? (
                <div role='presentation' className='px-3 py-3 text-sm text-ink-2'>Loading…</div>
              ) : error ? (
                <div role='presentation' className='px-3 py-3 text-sm text-declined'>{error}. Check your connection and try again.</div>
              ) : results.length === 0 ? (
                <div role='presentation' className='px-3 py-3 text-sm text-ink-2'>
                  No results.
                </div>
              ) : (
                results.map((u, idx) => {
                  const isActive = idx === safeActiveIndex;
                  const hint = [u.city, u.region].filter(Boolean).join(", ");

                  return (
                    <button
                      key={u.id}
                      id={optionId(u.id)}
                      type='button'
                      role='option'
                      tabIndex={-1}
                      aria-selected={value?.id === u.id}
                      onMouseEnter={() => setActiveIndex(idx)}
                      onClick={() => selectUniversity(u)}
                      className={[
                        "min-h-11 w-full rounded-[2px] px-3 py-2 text-left",
                        isActive ? "bg-paper-2" : "hover:bg-paper-2",
                      ].join(" ")}
                    >
                      <div className='font-medium text-ink'>{u.name}</div>
                      <div className='text-xs text-ink-2'>
                        {hint ? hint : "-"} · {u.countryCode}
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            <div className='border-t border-rule p-1'>
              <button
                type='button'
                onClick={() => {
                  // allow clearing selection
                  onChange(null);
                  setOpen(false);
                  setQuery("");
                }}
                className='inline-flex min-h-11 items-center px-2 text-sm font-semibold text-forest underline-offset-4 hover:underline'
              >
                Clear selection
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
