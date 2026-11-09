import { FlapText } from "@/components/board/FlapText";
import { lampOnBoard, type Lamp } from "@/components/board/status";
import { cn } from "@/lib/utils";

/**
 * Board kit for the dashboard lists: a departures strip, its count cells,
 * status flaps, and the loading and empty rows. Shared by the student and
 * professor views.
 */

/** A count shown as flap cells in a strip header. Pass `value: null` for a plain-text note. */
export function StatsCard({
  title,
  value,
  icon: Icon,
  lamp = "moving",
  note,
}: {
  title: string;
  value: string | null;
  icon: React.ComponentType<{ className?: string }>;
  lamp?: Lamp;
  note?: string;
}) {
  return (
    <div className='flex items-center gap-2.5'>
      <Icon className='size-4 shrink-0 text-flap-dim' aria-hidden='true' />
      <span className='caption text-flap-dim'>{title}</span>
      {value === null ? (
        <span className='text-sm text-flap-dim'>{note}</span>
      ) : (
        <FlapText
          text={value}
          className={cn("font-display text-xl font-bold", lampOnBoard[lamp])}
        />
      )}
    </div>
  );
}

/** Board frame with a title, optional count cells, and the rows as children. */
export function BoardStrip({
  title,
  description,
  counts,
  children,
  className,
}: {
  title: string;
  description?: string;
  counts?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "board-frame text-flap-ink md:p-3",
        className,
      )}
    >
      <header className='flex flex-wrap items-center justify-between gap-x-8 gap-y-2 px-2 pb-3 pt-1'>
        <h2 className='font-display text-xl font-extrabold uppercase leading-none tracking-[0.06em]'>
          {title}
        </h2>
        {counts && <div className='flex flex-wrap items-center gap-x-6 gap-y-1'>{counts}</div>}
      </header>
      {description && (
        <p className='max-w-prose px-2 pb-3 text-sm text-flap-dim'>{description}</p>
      )}
      {children}
    </section>
  );
}

/** Column grid for a strip. Mobile: two columns, status on the right of line one. */
export const stripGrid = (cols: string) =>
  `grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1.5 ${cols}`;

/** Header row of column captions. Hidden on phones where rows stack. */
export function BoardColumns({
  cols,
  labels,
}: {
  cols: string;
  labels: string[];
}) {
  return (
    <div
      role='row'
      className={cn(stripGrid(cols), "hidden px-4 pb-2 md:grid")}
    >
      {labels.map((l) => (
        <span key={l} role='columnheader' className='caption text-flap-dim'>
          {l}
        </span>
      ))}
    </div>
  );
}

/** One board row. */
export function BoardRow({
  cols,
  children,
}: {
  cols: string;
  children: React.ReactNode;
}) {
  return (
    <div
      role='row'
      className={cn(stripGrid(cols), "flap-row px-4 py-3 md:min-h-[3.5rem]")}
    >
      {children}
    </div>
  );
}

/** Status cell: flap cells in the lamp ink. A changed label cascades. */
export function StatusFlap({ label, lamp }: { label: string; lamp: Lamp }) {
  return (
    <FlapText
      text={label}
      className={cn("font-display text-base font-bold md:text-lg", lampOnBoard[lamp])}
    />
  );
}

/** Shimmering rows while a list loads. Static under reduced motion. */
export function BoardSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className='space-y-1' role='status' aria-label='Loading'>
      {Array.from({ length: rows }, (_, i) => (
        <div
          key={i}
          className='flap-row flex h-14 items-center gap-4 px-4'
          aria-hidden='true'
        >
          <span className='h-3 w-16 bg-flap-ink/10 motion-safe:animate-pulse' />
          <span className='h-3 flex-1 bg-flap-ink/10 motion-safe:animate-pulse' />
          <span className='h-3 w-20 bg-flap-ink/10 motion-safe:animate-pulse' />
        </div>
      ))}
      <span className='sr-only'>Loading</span>
    </div>
  );
}

/** Empty strip: says what is happening and what to do next. */
export function BoardEmpty({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className='rounded-[2px] bg-flap px-4 py-6'>
      <p className='font-display text-lg font-bold uppercase tracking-[0.06em] text-flap-ink'>
        {title}
      </p>
      {children && <p className='mt-1 max-w-prose text-sm text-flap-dim'>{children}</p>}
    </div>
  );
}
