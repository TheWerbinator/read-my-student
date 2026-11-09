import type { FinishedLetter, PendingRequest } from "@/app/actions/letters";
import type { Lamp } from "@/components/board/status";

export type Stop = { label: string; lamp: Lamp; note: string };

/** Where a request is on the student's board: the latest thing that happened to it. */
export function requestStop(
  r: Pick<PendingRequest, "status" | "openedAt" | "reminderSentAt" | "respondedAt">,
): Stop {
  if (r.status === "rejected")
    return { label: "Declined", lamp: "stopped", note: "Your professor declined this request." };
  if (r.status === "expired")
    return { label: "Expired", lamp: "stopped", note: "No answer within 7 days, so the request closed." };
  if (r.respondedAt || r.status === "in_progress")
    return { label: "In progress", lamp: "moving", note: "Your professor started the letter." };
  const opened = r.openedAt ? Date.parse(r.openedAt) : 0;
  const reminded = r.reminderSentAt ? Date.parse(r.reminderSentAt) : 0;
  if (reminded && reminded >= opened)
    return { label: "Reminded", lamp: "waiting", note: "No answer yet, so we reminded your professor." };
  if (opened)
    return { label: "Opened", lamp: "moving", note: "Your professor opened the request." };
  return { label: "Requested", lamp: "moving", note: "Sent. Waiting for your professor to open it." };
}

/** A finished letter is Sealed until a school is issued a link, then Sent. */
export function letterStop(l: Pick<FinishedLetter, "sentCount">): Stop {
  return l.sentCount > 0
    ? { label: "Sent", lamp: "done", note: `Sent to ${l.sentCount} ${l.sentCount === 1 ? "school" : "schools"}.` }
    : { label: "Sealed", lamp: "done", note: "Sealed. Ready to send to a school." };
}
