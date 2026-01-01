"use client";

import Image, { StaticImageData } from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { LinkButton } from "../ui/LinkButton";

import HeroImage_01 from "../../assets/hero/HeroImage_01.png";
import HeroImage_02 from "../../assets/hero/HeroImage_02.png";
import HeroImage_03 from "../../assets/hero/HeroImage_03.png";

type Slide = {
  image: StaticImageData;
  kicker?: string;
  title: string;
  body: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ctas: Array<{ label: string; href: string; variant?: any; size?: any }>;
};

const SLIDE_MS = 500;

export default function HeroCarousel() {
  const slides: Slide[] = useMemo(
    () => [
      {
        image: HeroImage_01,
        kicker: "For students",
        title: "Request letters without awkward follow-ups.",
        body: "Send a structured request with deadlines and context, then track status without chasing professors over email.",
        ctas: [
          { label: "Start for Free", href: "/signup?role=student", variant: "orange", size: "lg" },
          { label: "How it works", href: "/how-it-works", variant: "secondary", size: "lg" },
        ],
      },
      {
        image: HeroImage_02,
        kicker: "For faculty",
        title: "Write faster. Stay organized. Keep integrity.",
        body: "Centralized requests, simple drafting/upload, and permission-based sharing so letters don’t get lost or misused.",
        ctas: [
          { label: "Create Faculty Account", href: "/signup?role=faculty", variant: "orange", size: "lg" },
          { label: "Contact Us", href: "/contact", variant: "secondary", size: "lg" },
        ],
      },
      {
        image: HeroImage_03,
        kicker: "Security by design",
        title: "Encrypted data. Consent-based access. Built for trust.",
        body: "Letters are sensitive academic documents. We design for privacy, controlled access, and transparency.",
        ctas: [
          { label: "Trust & Security", href: "/trust", variant: "orange", size: "lg" },
          { label: "General Questions", href: "/contact", variant: "secondary", size: "lg" },
        ],
      },
    ],
    []
  );

  // Canonical slide index
  const [index, setIndex] = useState(0);

  // Incoming slide index while animating
  const [incomingIndex, setIncomingIndex] = useState<number | null>(null);

  // Transform positions (percent)
  const [currentX, setCurrentX] = useState<0 | -100 | 100>(0);
  const [incomingX, setIncomingX] = useState<-100 | 0 | 100>(100);

  // Used to disable transition during reset
  const [durationMs, setDurationMs] = useState(SLIDE_MS);

  // Refs to avoid stale-state crashes
  const indexRef = useRef(0);
  const slidingRef = useRef(false);

  const timerRef = useRef<number | null>(null);

  const autoTimerRef = useRef<number | null>(null);

  function resetAutoSlide() {
    if (autoTimerRef.current) {
      window.clearInterval(autoTimerRef.current);
    }

    autoTimerRef.current = window.setInterval(() => {
      slide(1);
    }, 9000);
  }

  useEffect(() => {
    indexRef.current = index;
  }, [index]);

  function slide(delta: 1 | -1) {
    resetAutoSlide();
    if (slidingRef.current) return;

    const len = slides.length;
    const curr = indexRef.current;
    const next = (curr + delta + len) % len;

    slidingRef.current = true;

    setIncomingIndex(next);

    // Ensure transitions are on for the slide
    setDurationMs(SLIDE_MS);

    // Start positions
    setCurrentX(0);
    setIncomingX(delta === 1 ? 100 : -100);

    // Animate in next frame
    requestAnimationFrame(() => {
      setCurrentX(delta === 1 ? -100 : 100);
      setIncomingX(0);
    });

    // Commit after animation
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      // Commit
      setIndex(next);
      setIncomingIndex(null);

      // Instantly reset transforms (NO animation)
      setDurationMs(0);
      setCurrentX(0);
      setIncomingX(delta === 1 ? 100 : -100);

      // Re-enable transitions for next interaction
      requestAnimationFrame(() => {
        setDurationMs(SLIDE_MS);
        slidingRef.current = false;
      });
    }, SLIDE_MS);
  }

  // OPTIONAL: Auto-slide (safe). Delete this effect if you don't want it.
  useEffect(() => {
    resetAutoSlide();

    return () => {
      if (autoTimerRef.current) {
        window.clearInterval(autoTimerRef.current);
      }
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const current = slides[index];
  const incoming = incomingIndex !== null ? slides[incomingIndex] : null;

  const transition = `transform ${durationMs}ms cubic-bezier(0.22, 1, 0.36, 1)`;

  return (
    <section className="relative pt-4 lg:pt-20 pb-8">
      <div className="relative mx-auto max-w-7xl min-h-[65vh] overflow-hidden rounded-xl">

      
      {/* Background sliding layers */}
      <div className="absolute inset-0">
        {/* Current background */}
        <div
          className="absolute inset-0 will-change-transform"
          style={{ transform: `translateX(${currentX}%)`, transition }}
        >
          <Image src={current.image} alt="" fill priority className="object-cover" />
        </div>

        {/* Incoming background */}
        {incoming ? (
          <div
            className="absolute inset-0 will-change-transform"
            style={{ transform: `translateX(${incomingX}%)`, transition }}
          >
            <Image src={incoming.image} alt="" fill priority className="object-cover" />
          </div>
        ) : null}

        {/* overlay */}
        <div className="absolute inset-0 bg-black/60" />
      </div>

      {/* Arrows */}
      <button
        type="button"
        aria-label="Previous"
        onClick={() => slide(-1)}
        className={`absolute left-3 md:left-6 top-1/2 -translate-y-1/2 z-20
          rounded-full bg-white/10 hover:bg-white/20 text-white
          w-10 h-10 flex items-center justify-center backdrop-blur
          border border-white/20 transition`}
      >
        ←
      </button>

      <button
        type="button"
        aria-label="Next"
        onClick={() => slide(1)}
        className={`absolute right-3 md:right-6 top-1/2 -translate-y-1/2 z-20
          rounded-full bg-white/10 hover:bg-white/20 text-white
          w-10 h-10 flex items-center justify-center backdrop-blur
          border border-white/20 transition`}
      >
        →
      </button>

      {/* Foreground sliding layers (no snap) */}
      <div className="relative z-10 mx-auto max-w-6xl px-4">
        {/* Sizer: reserves height so layout never changes during animation */}
        <div className="invisible pointer-events-none">
          <HeroSlideContent slide={current} />
        </div>

        {/* Animation viewport: clips sliding content */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Current content (absolute) */}
          <div
            className="absolute inset-0 will-change-transform"
            style={{ transform: `translateX(${currentX}%)`, transition }}
          >
            <HeroSlideContent slide={current} />
          </div>

          {/* Incoming content (absolute) */}
          {incoming ? (
            <div
              className="absolute inset-0 will-change-transform"
              style={{ transform: `translateX(${incomingX}%)`, transition }}
            >
              <HeroSlideContent slide={incoming} />
            </div>
          ) : null}
        </div>

        {/* Dots */}
        <div className="mt-12 flex items-center gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => {
                if (i === indexRef.current) return;
                slide(i > indexRef.current ? 1 : -1);
              }}
              className={[
                "h-2.5 rounded-full transition border border-white/20",
                i === index ? "w-8 bg-white/90" : "w-2.5 bg-white/30 hover:bg-white/45",
              ].join(" ")}
            />
          ))}
        </div>
      </div>
      </div>
    </section>
  );
}

function HeroSlideContent({ slide }: { slide: Slide }) {
  return (
    <div className="mt-8">
      {slide.kicker ? (
        <div className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/90 border border-white/15">
          {slide.kicker}
        </div>
      ) : null}

      <h1 className="mt-4 text-4xl md:text-5xl lg:text-6xl font-bold text-white max-w-5xl">
        {slide.title}
      </h1>

      <p className="mt-4 text-white/85 text-base md:text-lg max-w-3xl leading-relaxed">
        {slide.body}
      </p>

      <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {slide.ctas.map((c) => (
          <LinkButton
            key={c.label}
            href={c.href}
            variant={c.variant}
            size={c.size}
            className="min-w-52 sm:min-w-64 justify-center"
          >
            {c.label}
          </LinkButton>
        ))}
      </div>
    </div>
  );
}
