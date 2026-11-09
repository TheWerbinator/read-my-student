"use client";

import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { FlapText } from "./FlapText";
import { lampOnBoard, type Lamp } from "./status";

export type DepartureRow = {
  time: string;
  student: string;
  professor: string;
  school: string;
  status: string;
  lamp: Lamp;
};

type DepartureBoardProps = {
  title: string;
  rows: DepartureRow[];
  /** Small print under the title, for example "Sample board". */
  note?: string;
  /** Rows past this index are hidden on phones. */
  mobileRows?: number;
  cascade?: boolean;
  className?: string;
};

/** A departures board of letter requests. Each row's status flaps cascade once. */
export function DepartureBoard({
  title,
  rows,
  note,
  mobileRows = rows.length,
  cascade = true,
  className,
}: DepartureBoardProps) {
  return (
    <figure
      className={cn(
        // A board too narrow for its columns scrolls inside its frame, never past it.
        "board-frame overflow-x-auto",
        className,
      )}
    >
      <figcaption className='flex items-baseline justify-between gap-3 px-2 pb-2 pt-1'>
        <span className='font-display text-xl font-extrabold uppercase tracking-[0.08em] text-flap-ink'>
          {title}
        </span>
        {note && <span className='caption text-flap-dim'>{note}</span>}
      </figcaption>
      <table className='w-full border-separate border-spacing-y-[3px] text-left tabular-nums'>
        <thead>
          <tr className='caption text-flap-dim'>
            <th scope='col' className='px-2 pb-1 font-semibold'>Time</th>
            <th scope='col' className='px-2 pb-1 font-semibold'>Student to professor</th>
            <th scope='col' className='hidden px-2 pb-1 font-semibold sm:table-cell'>School</th>
            <th scope='col' className='px-2 pb-1 text-right font-semibold'>Status</th>
          </tr>
        </thead>
        <tbody className='font-display text-lg font-bold uppercase leading-none tracking-[0.06em] md:text-xl'>
          {rows.map((r, i) => (
            <tr key={`${r.time}-${r.student}`} className={cn(i >= mobileRows && "hidden sm:table-row")}>
              <td className='flap-row whitespace-nowrap rounded-l-[2px] px-2 py-2 align-top text-flap-dim'>{r.time}</td>
              <td className='flap-row whitespace-nowrap px-2 py-2 text-flap-ink'>
                <span className='block'>{r.student}</span>
                <span className='mt-1 flex items-center gap-1 text-sm text-flap-dim md:text-base'>
                  <ArrowRight aria-label='to' className='size-3' />
                  {r.professor}
                </span>
              </td>
              <td className='flap-row hidden whitespace-nowrap px-2 py-2 align-top text-flap-ink sm:table-cell'>{r.school}</td>
              <td className='flap-row whitespace-nowrap rounded-r-[2px] px-2 pb-1.5 pt-[0.3rem] text-right align-top'>
                <FlapText
                  text={r.status}
                  cascadeOnMount={cascade}
                  delay={400 + i * 260}
                  className={cn("text-base md:text-lg", lampOnBoard[r.lamp])}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
