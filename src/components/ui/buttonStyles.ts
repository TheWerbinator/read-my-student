export type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "amber"
  | "gold"
  | "green"
  | "board";
export type ButtonSize = "sm" | "md" | "lg";

// Flap-cell buttons: square-cut, condensed caps, a pressed state that drops 1px.
export const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-[2px] font-display font-bold uppercase tracking-[0.06em] leading-none transition-[background-color,color,box-shadow,transform] duration-150 ease-out active:translate-y-px disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0";

export const buttonVariants: Record<ButtonVariant, string> = {
  // Forest on paper.
  primary:
    "bg-forest text-white shadow-[0_1px_0_var(--flap-edge)] hover:bg-forest-ink",
  green:
    "bg-forest text-white shadow-[0_1px_0_var(--flap-edge)] hover:bg-forest-ink",
  // Paper outline.
  secondary:
    "bg-white text-forest-ink ring-1 ring-inset ring-ink/25 hover:bg-paper-2 hover:ring-forest",
  ghost: "bg-transparent text-forest-ink hover:bg-ink/5",
  // The gold lamp: the one primary action per view.
  gold: "bg-gold text-board-deep shadow-[0_1px_0_var(--gold-deep)] hover:bg-[#ffb829]",
  amber: "bg-gold text-board-deep shadow-[0_1px_0_var(--gold-deep)] hover:bg-[#ffb829]",
  // Outline on the board.
  board:
    "bg-transparent text-flap-ink ring-1 ring-inset ring-flap-ink/40 hover:bg-flap hover:ring-flap-ink/70",
};

export const buttonSizes: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-base",
  md: "h-11 px-5 text-lg",
  lg: "h-12 px-6 text-xl",
};

export function buttonClassName(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  className?: string,
) {
  return [buttonBase, buttonVariants[variant], buttonSizes[size], className]
    .filter(Boolean)
    .join(" ");
}
