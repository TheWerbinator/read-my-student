import { cn } from "@/lib/utils";
import { lampOnBoard, type Lamp } from "../board/status";

type Stop = { when: string; step: string; who: string; detail: string; status: string; lamp: Lamp };

// The real request rules: reminder on day 3, closed on day 7 (src/lib/request-sweep.ts).
const stops: Stop[] = [
  {
    when: "Day 0",
    step: "Request",
    who: "Student",
    detail: "Enter your professor's email, the course, and a short note.",
    status: "Requested",
    lamp: "moving",
  },
  {
    when: "Day 0",
    step: "Open",
    who: "Professor",
    detail: "Your professor gets one link by email. No account, no password.",
    status: "Opened",
    lamp: "moving",
  },
  {
    when: "Day 3",
    step: "Reminder",
    who: "ReadMyStudent",
    detail: "No answer yet? We remind them. An unanswered request closes on day 7.",
    status: "Reminded",
    lamp: "waiting",
  },
  {
    when: "Any day",
    step: "Seal",
    who: "Professor",
    detail: "They write, sign, and seal the letter. It stays confidential unless they share a preview with you.",
    status: "Sealed",
    lamp: "done",
  },
  {
    when: "When ready",
    step: "Send",
    who: "Student",
    detail: "Send the sealed letter to each school with its own secure link.",
    status: "Sent",
    lamp: "done",
  },
];

export default function HowItWorks() {
  return (
    <section aria-labelledby='how-heading' className='px-5 py-16 md:px-8 md:py-24'>
      <div className='mx-auto max-w-6xl'>
        <h2
          id='how-heading'
          className='max-w-3xl font-display text-4xl font-extrabold uppercase leading-[0.95] tracking-[0.02em] md:text-6xl'
        >
          One request. Five stops. You see every one.
        </h2>

        <ol className='board-frame mt-12 space-y-[3px]'>
          {stops.map((s) => (
            <li
              key={s.step}
              className='flap-row grid grid-cols-[5.5rem_1fr] gap-x-4 gap-y-1 rounded-[2px] px-3 py-4 md:grid-cols-[7rem_10rem_1fr_9rem] md:items-center md:py-5'
            >
              <span className='font-display text-lg font-bold uppercase tracking-[0.06em] text-flap-dim'>{s.when}</span>
              <span className='font-display text-2xl font-extrabold uppercase leading-none tracking-[0.04em] text-flap-ink md:text-3xl'>
                {s.step}
              </span>
              <span className='col-start-2 text-base leading-snug text-flap-ink/90 md:col-start-auto'>
                <span className='caption mr-2 text-flap-dim'>{s.who}</span>
                {s.detail}
              </span>
              <span
                className={cn(
                  "col-start-2 font-display text-lg font-bold uppercase tracking-[0.08em] md:col-start-auto md:text-right",
                  lampOnBoard[s.lamp],
                )}
              >
                {s.status}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
