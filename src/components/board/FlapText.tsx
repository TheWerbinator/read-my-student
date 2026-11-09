"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const TICK_MS = 55;

type FlapTextProps = {
  text: string;
  /** Cascade once after mount (home board). Later changes to `text` always cascade. */
  cascadeOnMount?: boolean;
  /** Delay before the first character turns, in ms. */
  delay?: number;
  className?: string;
  cellClassName?: string;
};

/**
 * Text set in split-flap cells. The real text stays in the DOM for screen
 * readers and search; the cells are decoration and are aria-hidden.
 */
export function FlapText({
  text,
  cascadeOnMount = false,
  delay = 0,
  className,
  cellClassName,
}: FlapTextProps) {
  const target = text.toUpperCase();
  const [shown, setShown] = useState(target);
  const [live, setLive] = useState(false);
  const shownRef = useRef(target);
  const mounted = useRef(false);

  useEffect(() => {
    const isFirst = !mounted.current;
    mounted.current = true;
    if (isFirst && !cascadeOnMount) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      shownRef.current = target;
      const t = window.setTimeout(() => setShown(target), 0);
      return () => window.clearTimeout(t);
    }

    // Each cell turns a few times, starting one tick after its left neighbor.
    const from = shownRef.current;
    const startTick = Math.round(delay / TICK_MS);
    let frame = 0;
    const id = window.setInterval(() => {
      if (frame === 0) setLive(true);
      frame += 1;
      let done = true;
      const next = Array.from(target, (ch, i) => {
        const start = startTick + i;
        const stop = start + 3 + ((i * 7) % 4);
        if (ch === " " || frame >= stop) return ch;
        done = false;
        if (frame < start) return from[i] ?? " ";
        return ALPHABET[(frame * 7 + i * 13) % ALPHABET.length];
      }).join("");
      shownRef.current = next;
      setShown(next);
      if (done) window.clearInterval(id);
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, [target, cascadeOnMount, delay]);

  return (
    <span className={cn("inline-block", className)}>
      <span className='sr-only'>{text}</span>
      <span aria-hidden='true' className='flap-word'>
        {Array.from(target, (_, i) => {
          const ch = shown[i] ?? " ";
          return ch === " " ? (
            <span key={i} className='flap flap-space' />
          ) : (
            // Keying on the character remounts only the cells that changed.
            <span
              key={`${i}-${ch}`}
              className={cn("flap", live && "flap-turn", cellClassName)}
            >
              {ch === ":" ? <span className='flap-colon' /> : ch}
            </span>
          );
        })}
      </span>
    </span>
  );
}
