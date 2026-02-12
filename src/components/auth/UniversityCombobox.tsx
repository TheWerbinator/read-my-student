"use client";

import React, { useEffect, useRef, useState } from "react";

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
  countryCode: string; // ISO-2, e.g. "US"
  value: University | null; // selected university (store object or just id/name)
  onChange: (u: University | null) => void;
  required?: boolean;
  disabled?: boolean;
  label?: string;
};

export function UniversityCombobox({
  countryCode,
  value,
  onChange,
  required,
  disabled,
  label = "University",
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<University[]>([]);
  const [error, setError] = useState<string>("");

  const wrapRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const safeActiveIndex =
    results.length === 0 ? 0 : Math.min(activeIndex, results.length - 1);

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

  function openAndFocus() {
    if (disabled) return;
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function selectUniversity(u: University) {
    onChange(u);
    setOpen(false);
    setQuery("");
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
        <button
          type='button'
          disabled={disabled}
          onClick={() => (open ? setOpen(false) : openAndFocus())}
          className={[
            "w-full rounded border border-gray-300 bg-white px-3 py-2 text-left text-sm text-gray-700",
            "flex items-center justify-between gap-3",
            disabled
              ? "cursor-not-allowed bg-gray-50 opacity-60"
              : "hover:bg-black/2",
          ].join(" ")}
        >
          <span className={value ? "" : "text-gray-400"}>
            {value
              ? value.name
              : disabled
                ? "Select a country first"
                : "Search and select..."}
          </span>
          <span className='text-gray-400'>▾</span>
        </button>

        {open && !disabled && (
          <div className='absolute z-50 mt-2 w-full rounded-xl border border-black/10 bg-white shadow-xl shadow-black/10'>
            <div className='p-2'>
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder='Type at least 3 letters...'
                className='w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-900/30'
              />
            </div>

            <div className='max-h-72 overflow-auto p-1'>
              {loading ? (
                <div className='px-3 py-3 text-sm text-gray-500'>Loading…</div>
              ) : error ? (
                <div className='px-3 py-3 text-sm text-red-700'>{error}</div>
              ) : results.length === 0 ? (
                <div className='px-3 py-3 text-sm text-gray-500'>
                  No results.
                </div>
              ) : (
                results.map((u, idx) => {
                  const isActive = idx === safeActiveIndex;
                  const hint = [u.city, u.region].filter(Boolean).join(", ");

                  return (
                    <button
                      key={u.id}
                      type='button'
                      onMouseEnter={() => setActiveIndex(idx)}
                      onClick={() => selectUniversity(u)}
                      className={[
                        "w-full px-3 py-2 text-left text-sm rounded-lg",
                        isActive ? "bg-green-900/10" : "hover:bg-black/5",
                      ].join(" ")}
                    >
                      <div className='text-gray-800 font-medium'>{u.name}</div>
                      <div className='text-xs text-black/50'>
                        {hint ? hint : "—"} · {u.countryCode}
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            <div className='border-t border-black/10 p-2'>
              <button
                type='button'
                onClick={() => {
                  // allow clearing selection
                  onChange(null);
                  setOpen(false);
                  setQuery("");
                }}
                className='text-xs font-semibold text-green-900 hover:underline'
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
