"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  FileText,
  ShieldCheck,
  Edit3,
  CheckCircle2,
  Link2,
} from "lucide-react";

type Step = {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
};

export function HeroStepper() {
  const steps: Step[] = useMemo(
    () => [
      { title: "Request",   subtitle: "Student sends a request",        icon: <FileText className="h-4 w-4" /> },
      { title: "Draft",   subtitle: "Faculty permission granted",     icon: <Edit3 className="h-4 w-4" /> },
      { title: "Approve",     subtitle: "Faculty writes the letter",      icon: <CheckCircle2 className="h-4 w-4" /> },
      { title: "Consent",   subtitle: "Student reviews and approves",   icon: <ShieldCheck className="h-4 w-4" /> },
      { title: "Share",     subtitle: "Consent link, ready anywhere",   icon: <Link2 className="h-4 w-4" /> },
    ],
    []
  );

  const [active, setActive] = useState(0);

  // slower + calmer
  useEffect(() => {
    const ms = 3400;
    const id = window.setInterval(
      () => setActive((v) => (v + 1) % steps.length),
      ms
    );
    return () => window.clearInterval(id);
  }, [steps.length]);

  const showIndex = active;
  const progress =
    steps.length <= 1 ? 0 : showIndex / (steps.length - 1);

  // palette
  const DARK_GREEN = "#0b4726";
  const GOLD_TEXT = "#3a2a00";
  const GOLD_GRAD =
    "radial-gradient(circle at 30% 30%, #fff1b8 0%, #f7d774 32%, #f3b72f 55%, #e0a800 78%, rgba(217,154,0,0.0) 100%)";

  return (
    <div className="pointer-events-none select-none mx-auto max-w-xl md:block md:max-w-4xl rounded-3xl border border-white/20 bg-white/85 backdrop-blur shadow-xl shadow-black/10 px-5 py-6">
      {/* One-line rail */}
      <div className="relative">
        {/* Rail */}
        <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2">
          <div className="relative h-2.5 rounded-full bg-black/10">
            {/* Gold fill */}
            <div
              className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-1000 ease-out"
              style={{
                width: `${progress * 100}%`,
                background: GOLD_GRAD,
              }}
            />
            {/* Gold dot */}
            <div
              className="absolute top-1/2 -translate-y-1/2 h-3 w-3 rounded-full transition-[left] duration-1000 ease-out"
              style={{
                left: `calc(${progress * 100}% - 6px)`,
                background: GOLD_GRAD,
                boxShadow: "0 6px 20px rgba(245,197,66,0.35)",
              }}
            />
          </div>
        </div>

        {/* Steps */}
        <div className="relative z-10 flex items-center justify-between">
          {steps.map((s, i) => {
            const isActive = i === showIndex;
            const isDone = i < showIndex;

            return (
              <div
                key={s.title}
                className="flex flex-col items-center gap-2 px-2"
              >
                {/* Icon node */}
                <div className="relative">
                  {/* Gold glow (active) */}
                  {isActive && (
                    <div
                      className="absolute -inset-2 rounded-2xl blur-md"
                      style={{
                        background:
                          "radial-gradient(circle at 30% 30%, rgba(245,197,66,0.45), transparent 65%)",
                      }}
                    />
                  )}

                  <div
                    className="relative grid h-9 w-9 place-items-center rounded-xl border transition-all duration-300"
                    style={{
                      background: isActive
                        ? GOLD_GRAD
                        : isDone
                        ? DARK_GREEN
                        : "rgba(255,255,255,0.95)",
                      color: isActive
                        ? GOLD_TEXT
                        : isDone
                        ? "white"
                        : DARK_GREEN,
                      borderColor: isActive
                        ? "rgba(245,197,66,0.45)"
                        : isDone
                        ? "rgba(11,71,38,0.45)"
                        : "rgba(0,0,0,0.12)",
                      boxShadow: isActive
                        ? "0 10px 28px rgba(245,197,66,0.45)"
                        : "none",
                      transform: isActive ? "scale(1.18)" : "scale(1)",
                      transition:
                        "transform 420ms cubic-bezier(0.34, 1.56, 0.64, 1)",
                    }}
                  >
                    {s.icon}
                  </div>
                </div>

                {/* Title */}
                <div
                  className={[
                    "text-xs sm:text-sm font-semibold text-center whitespace-nowrap transition-colors duration-300",
                    isActive
                      ? "text-[#3a2a00]"
                      : isDone
                      ? "text-[#0b4726]"
                      : "text-black/60",
                  ].join(" ")}
                >
                  {s.title}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}