/**
 * The board's ink law: white means moving, gold means waiting on someone,
 * mint means done, red means stopped. One meaning per ink, everywhere.
 */
export type Lamp = "moving" | "waiting" | "done" | "stopped";

/** Ink on the board (dark ground). */
export const lampOnBoard: Record<Lamp, string> = {
  moving: "text-flap-ink",
  waiting: "text-gold",
  done: "text-mint",
  stopped: "text-signal",
};

/** Ink on paper (light ground), AA on --paper. */
export const lampOnPaper: Record<Lamp, string> = {
  moving: "text-ink",
  waiting: "text-waiting",
  done: "text-sealed",
  stopped: "text-declined",
};

/** Board label and lamp for each letter_request_status value. */
export const requestStatus: Record<string, { label: string; lamp: Lamp }> = {
  invited: { label: "Requested", lamp: "moving" },
  requested: { label: "Requested", lamp: "moving" },
  in_progress: { label: "In progress", lamp: "moving" },
  completed: { label: "Complete", lamp: "done" },
  rejected: { label: "Declined", lamp: "stopped" },
  expired: { label: "Expired", lamp: "stopped" },
};
