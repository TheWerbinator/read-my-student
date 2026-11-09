---
name: ReadMyStudent
description: Letter requests as departures on a forest-green split-flap board, with the letter as the one paper page on it.
colors:
  board: "#0c2016"
  board-deep: "#07150e"
  flap: "#13301f"
  flap-edge: "#05110a"
  frame: "#1b2e25"
  flap-ink: "#f4f3ee"
  flap-dim: "#a9bdb1"
  gold: "#ffaa00"
  gold-deep: "#e69500"
  gold-hover: "#ffb829"
  mint: "#7fdba6"
  signal: "#ff8a7a"
  paper: "#f8fafa"
  paper-2: "#eef2f2"
  sheet-white: "#ffffff"
  ink: "#14211a"
  ink-2: "#4a5a51"
  rule: "#d6d9d3"
  input-stroke: "#7d887f"
  forest: "#0d542b"
  forest-ink: "#0a3d20"
  accent-wash: "#e8efe9"
  sealed: "#146c3a"
  waiting: "#8a5a00"
  declined: "#b3261e"
  declined-hover: "#8f1d17"
typography:
  display:
    fontFamily: "Big Shoulders, sans-serif"
    fontSize: "min(calc(100cqi / 10.7), 4.75rem)"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "normal"
  headline:
    fontFamily: "Big Shoulders, sans-serif"
    fontSize: "3.75rem"
    fontWeight: 800
    lineHeight: 0.95
    letterSpacing: "0.02em"
  title:
    fontFamily: "Big Shoulders, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.04em"
  board-row:
    fontFamily: "Big Shoulders, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.06em"
  button:
    fontFamily: "Big Shoulders, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.06em"
  body-lead:
    fontFamily: "Public Sans, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.625
  body:
    fontFamily: "Public Sans, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  prose:
    fontFamily: "Public Sans, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.65
  label:
    fontFamily: "Big Shoulders, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.14em"
rounded:
  hairline: "1px"
  cell: "2px"
  frame: "4px"
spacing:
  row-gap: "3px"
  frame-pad: "8px"
  gutter: "20px"
  gutter-md: "32px"
  section: "64px"
  section-md: "96px"
components:
  button-gold:
    backgroundColor: "{colors.gold}"
    textColor: "{colors.board-deep}"
    typography: "{typography.button}"
    rounded: "{rounded.cell}"
    height: "44px"
    padding: "0 20px"
  button-gold-hover:
    backgroundColor: "{colors.gold-hover}"
  button-primary:
    backgroundColor: "{colors.forest}"
    textColor: "{colors.sheet-white}"
    typography: "{typography.button}"
    rounded: "{rounded.cell}"
    height: "44px"
    padding: "0 20px"
  button-primary-hover:
    backgroundColor: "{colors.forest-ink}"
  button-secondary:
    backgroundColor: "{colors.sheet-white}"
    textColor: "{colors.forest-ink}"
    typography: "{typography.button}"
    rounded: "{rounded.cell}"
    height: "44px"
    padding: "0 20px"
  button-secondary-hover:
    backgroundColor: "{colors.paper-2}"
  button-board:
    backgroundColor: "transparent"
    textColor: "{colors.flap-ink}"
    typography: "{typography.button}"
    rounded: "{rounded.cell}"
    height: "44px"
    padding: "0 20px"
  button-board-hover:
    backgroundColor: "{colors.flap}"
  button-destructive:
    backgroundColor: "{colors.declined}"
    textColor: "{colors.sheet-white}"
    rounded: "{rounded.cell}"
  button-destructive-hover:
    backgroundColor: "{colors.declined-hover}"
  input:
    backgroundColor: "{colors.sheet-white}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.cell}"
    height: "44px"
    padding: "4px 12px"
  sheet:
    backgroundColor: "{colors.sheet-white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.cell}"
    padding: "24px"
  badge:
    backgroundColor: "{colors.forest}"
    textColor: "{colors.sheet-white}"
    rounded: "{rounded.hairline}"
    padding: "4px 8px"
  tabs-list:
    backgroundColor: "{colors.board}"
    textColor: "{colors.flap-dim}"
    rounded: "{rounded.cell}"
    height: "44px"
    padding: "3px"
  tabs-trigger-active:
    backgroundColor: "{colors.flap}"
    textColor: "{colors.flap-ink}"
    rounded: "{rounded.hairline}"
  flap-cell:
    backgroundColor: "{colors.flap}"
    textColor: "{colors.flap-ink}"
    rounded: "{rounded.cell}"
    width: "0.78em"
    height: "1.14em"
  board-row:
    backgroundColor: "{colors.flap}"
    textColor: "{colors.flap-ink}"
    typography: "{typography.board-row}"
    rounded: "{rounded.cell}"
    padding: "12px 16px"
  board-frame:
    backgroundColor: "{colors.board-deep}"
    textColor: "{colors.flap-ink}"
    rounded: "{rounded.frame}"
    padding: "{spacing.frame-pad}"
---

# Design System: ReadMyStudent

## Overview

**Creative North Star: "The Departures Board"**

Every letter request is a departure. The whole product sits on a station board painted in the logo's forest green: a near-black green ground, flap faces one step lighter, a darker steel-green housing around each board. Status words are set in condensed caps inside fixed split-flap cells, and they turn over once when the status changes. The logo's gold is the lit lamp. Everything a person reads or fills in (the letter, the professor's form, legal text, the navigation itself) is a cool white paper sheet laid on the board.

Density is moderate and tabular. Boards are rows with fixed columns, and paper sheets are form-like, with small spaced caps captions over plain values, the way a boarding pass prints its fields. Navigation is a paper boarding pass: a fixed vertical pass on the left at desktop widths, a sideways pass strip on top below that.

The world rejects the green-and-gold "trusted platform" look of icon-card grids, gradient pills, and AI illustrations. Shading inside a flap is fine; it is what makes a dark rectangle read as a flap.

**Key Characteristics:**
- Forest board ground on every route: marketing, auth, dashboard, the professor page, the school view.
- Split-flap cells in Big Shoulders caps for headlines and status words; Public Sans for every sentence.
- One ink per state, set by the ink law in the board status module.
- Cool white paper sheets with square-cut corners for anything read or filled.
- Gold appears as the primary action, the waiting state, the focus rim on the board, and the one lit phrase in a heading.

## Colors

A dark painted board with four lamp inks, plus a cool paper family whose inks mirror the lamps at AA contrast.

### Primary
- **Logo Gold Lamp** (gold): the one primary action per view (Request a letter), the waiting and reminder state on the board, the focus rim on the board (forest ink on paper, because gold is 1.9:1 on white), text selection, the active pass field marker, and the lit phrase in a heading. Pressed edge in Gold Deep; hover in Gold Hover.

### Secondary
- **Logo Forest** (forest): actions on paper (Write letter, Save), badges, links in long reads, the scrollbar thumb, the caret. Hover and heading ink in Forest Ink.

### Tertiary
- **Arrival Mint** (mint): done states on the board (Sealed, Sent, Complete).
- **Signal Red** (signal): stopped states on the board (Declined, Expired).
- **Paper state inks** (sealed, waiting, declined): the same three meanings on paper, each AA on paper. Declined also serves as the destructive action color.

### Neutral
- **Station Board** (board): the page ground everywhere.
- **Board Deep** (board-deep): inside a board frame, the footer ground, ink on gold buttons, dialog and menu scrims at 60 to 70 percent.
- **Flap Face** (flap): every flap cell and board row. **Flap Edge** (flap-edge) is the hinge line.
- **Steel Housing** (frame): the 6px border of a board frame.
- **Flap White** (flap-ink): lettering on the board, and the "moving" state. Body sentences on the board run at 90 percent.
- **Flap Dim** (flap-dim): times, captions, secondary text on the board.
- **Cool Paper** (paper, paper-2): page-level paper and quiet fills (disabled inputs, secondary hover). **Sheet White** (sheet-white) is the face of every sheet, card, dialog, and input.
- **Paper Ink** (ink, ink-2): text and secondary text on paper.
- **Rule** (rule): dividers, sheet borders, perforation dashes. **Input Stroke** (input-stroke): field borders. **Accent Wash** (accent-wash): the light green accent fill.

### Named Rules
**The Ink Law.** White means moving, gold means waiting on someone, mint means done, red means stopped. One meaning per ink, everywhere. On paper the same four meanings use ink, waiting, sealed, and declined. Status color always comes from the lamp maps, never chosen per screen.

**The Cool Paper Rule.** Paper is cool white: blue at or above red and green, so paper never drifts to cream.

**The One Lit Phrase Rule.** A section heading on the board is flap white with at most one closing phrase lit in gold ("You see every one.", "from one link.").

## Typography

**Display Font:** Big Shoulders (variable, optical size axis), loaded through next/font with no metric fallback
**Body Font:** Public Sans
**Label/Mono Font:** Big Shoulders caps in the caption style

**Character:** Condensed street-sign caps do the board's talking; a plain government-grade sans carries every sentence, legible on small phones.

### Hierarchy
- **Display** (800, column-sized: 100cqi/10.7 capped at 4.75rem, line-height 1): the hero headline only, set in flap cells across three rows. It stays sized to its column beside the board.
- **Headline** (800, 2.25rem on phones, 3.75rem from md, line-height 0.95, 0.02em): section headings on the board, uppercase. Paper headings run 1.875rem to 2.25rem in the same style.
- **Title** (700, 1.25rem, line-height 1, 0.04em, uppercase): card titles, pass field labels, board strip titles (800 on boards).
- **Board row** (700, 1.125rem to 1.25rem, 0.06em, uppercase, tabular numerals): text inside board rows and status flaps.
- **Body lead** (400, 1.125rem to 1.25rem, line-height 1.625): the sentence under a section heading.
- **Body** (400, 1rem, line-height 1.5): forms, tables, dashboard copy. Long reads use 1.65 line height capped at 68ch, with h2 in Big Shoulders 700 1.5rem caps in Forest Ink.
- **Label** (600, 0.75rem, 0.14em, uppercase): field captions on paper and column captions on boards.
- **Button** (700, 1rem to 1.25rem by size, 0.06em, uppercase).

### Named Rules
**The Caps Are Signage Rule.** Big Shoulders is always uppercase and always short: headings, labels, buttons, status. Any full sentence is Public Sans.

**The Column-Sized Hero Rule.** The hero headline is fitted to its six-column cell and never exceeds 4.75rem, even though section headings run larger caps. The flap cells carry the weight.

## Layout

Content sits in a 72rem (max-w-6xl) container with 20px side gutters, 32px from md. Sections breathe at 64px vertical padding, 96px from md. The hero splits into two six-column halves from xl (headline left, framed board right); below xl it stacks headline, sentence, actions, then the board, and the board drops to three rows on phones.

At lg and up the boarding pass is fixed 1rem from the top, bottom, and left edges at 15rem wide, and page content is offset by 17rem. Below lg the pass becomes a 64px sticky strip on top that unfolds into the full pass with a board-deep scrim.

Board rows stack with 3px gaps inside a frame with 8px padding. Board column grids collapse to two columns on phones, with the status on the right of line one. Breakpoints are the Tailwind defaults (sm 640px, md 768px, lg 1024px, xl 1280px). Text wraps balanced on headings and pretty on paragraphs.

## Elevation & Depth

Depth is physical and literal: the board is a painted surface, flaps are thin raised cells, the housing is a recessed box, and paper sheets lie on top casting a soft long shadow. There is no ambient glow and no lift on hover.

### Shadow Vocabulary
- **Flap cell** (`inset 0 0 0 1px rgb(0 0 0 / 0.35), 0 1px 0 rgb(255 255 255 / 0.04), 0 2px 3px rgb(0 0 0 / 0.35)`): every single-character flap.
- **Board row** (`inset 0 0 0 1px rgb(0 0 0 / 0.25)`): row bands; flat, no drop.
- **Board frame** (`inset 0 0 0 1px rgb(0 0 0 / 0.5), 0 0 0 1px rgb(255 255 255 / 0.04), 0 2px 0 rgb(0 0 0 / 0.35), 0 30px 60px -30px rgb(0 0 0 / 0.8)`): the housing around a board.
- **Sheet on paper** (`0 1px 0 rgb(20 33 26 / 0.04), 0 12px 32px -18px rgb(7 21 14 / 0.35)`): sheets and cards.
- **Sheet on board** (`0 2px 0 rgb(0 0 0 / 0.25), 0 24px 48px -20px rgb(0 0 0 / 0.7)`, border transparent): sheets laid on the board ground.
- **Dialog** (`0 2px 0 rgb(0 0 0 / 0.2), 0 32px 64px -24px rgb(0 0 0 / 0.6)`).
- **Button lip** (`0 1px 0` in Flap Edge or Gold Deep): a one-pixel printed edge under filled buttons; pressing drops the button 1px.

### Named Rules
**The Hinge Rule.** A hinge line exists only on single-character flap cells, centered on the glyph (Big Shoulders caps get 0.03em top padding to sit on it). Row bands carry the flap color and shading but never a hinge.

## Shapes

Square-cut throughout. Flap cells, buttons, inputs, sheets, cards, dialogs, and board rows use 2px corners; badges, tab triggers, and pass markers use 1px; the board frame uses 4px. Nothing is pill-shaped. The only circles are the punched notches of a perforation: a 2px dashed rule line with a 16px notch at each end, filled with the color behind the sheet so the board shows through. Perforations separate a pass's stub from its body, horizontally on the desktop pass and vertically on the mobile strip.

## Components

### Buttons
Printed flap-card buttons: condensed caps, a one-pixel lip, a 1px press.
- **Shape:** square-cut (2px).
- **Gold:** gold face, board-deep ink. The one primary action per view.
- **Primary:** forest face, white ink, hover to Forest Ink. Actions on paper.
- **Secondary:** sheet-white face, Forest Ink, a 1px inset ring of ink at 25 percent; hover to paper-2 with a forest ring.
- **Board:** transparent on the board, flap white text, 1px inset ring at 40 percent; hover fills with flap.
- **Ghost / Link / Destructive:** ghost tints ink at 5 percent on hover; link drops caps for Public Sans semibold forest with underline on hover; destructive is declined, hover Declined Hover.
- **Sizes:** 36px, 44px, 48px tall. Transitions 150ms ease-out. Disabled at 50 percent.
- **Focus:** a 2px rim with a 2px offset: gold on the board, forest ink inside paper sheets and dialogs (`.sheet :focus-visible`, `[role="dialog"] :focus-visible`), so it clears 3:1 on both grounds.

### Chips
- **Badge:** Big Shoulders 700 0.875rem caps at 0.08em, 1px corners. Forest with white ink by default; paper-2, declined, or outline variants.

### Cards / Containers
- **Sheet:** sheet-white face, 1px rule border (transparent on the board), 2px corners, the sheet shadow. Used for the pass, forms, the professor page, the sample letter, auth panels.
- **Card:** same face and shadow with 24px padding; the title is Title-style caps in Forest Ink.
- **Board frame:** board-deep field inside a 6px steel housing, 4px corners, 8px padding. Every board sits in one, and wide boards scroll inside it, never past it.

### Inputs / Fields
- **Style:** sheet-white, 1px input-stroke border (3.7:1 on white), 2px corners, 44px tall, ink text, placeholder ink-2.
- **Focus:** border turns forest and a 2px gold ring appears.
- **Error / Disabled:** declined border and 1px declined ring; disabled fills paper-2 at 60 percent.
- **Captions:** Label style in ink-2 above each field.

### Navigation
- **Boarding pass:** a fixed vertical sheet at lg+: logo, a FROM REQUEST TO SCHOOL route in caps, five page fields (Title caps plus a one-line Public Sans note, divided by rules), a perforation, then the stub with the gold action and a caps Log in link. The active field shows a gold square marker with a Gold Deep border; others show an empty ink-2 square that turns forest on hover.
- **Mobile:** a 64px sideways strip with the logo, a vertical perforation, and a GATE / MENU stub that unfolds the full pass, locks scroll, and closes on Escape.
- **Tabs:** a board-colored rail with 3px padding; the active trigger is a flap face with a 2px gold underline set inside.

### Split-Flap Text (signature)
Each character sits in its own flap cell (0.78em by 1.14em, 0.08em gaps). Word spaces are blank flaps at 70 percent opacity. A colon is two dots, one centered on each half of its flap. The real text stays in the DOM for screen readers; the cells are hidden from them. When the text changes, each cell turns through random characters on a 55ms tick, starting one tick after its left neighbor, each turn dropping the top half in 90ms. The hero cascades once on load; dashboard status flaps cascade when a status changes. Reduced motion shows the final text with no animation.

### Departure Board and Board Rows
A framed table of rows: time in flap dim, student over an arrow and professor name, school, and a status in flap cells colored by its lamp. Captions over columns in the Label style. Dashboard lists use the same kit: a strip header with flap-cell counts, column captions hidden on phones, 56px rows, pulsing skeleton rows (static under reduced motion), and an empty state that says what is happening and what to do next.

### Social Flaps
Footer social links are 44px flap cells with an icon. On hover or focus the flap turns once (300ms) from the white icon card to the gold one: the white top half falls to the hinge and reveals the gold top, the white bottom holds, and the gold bottom lands over it, so the icon is never doubled or blank. No flip under reduced motion.

### Email
Transactional email keeps the world in inline styles: a board header with the wordmark in condensed caps, a 600px white sheet with a rule border, ink text, gold for the action. Body falls back to Arial, the email norm.

## Do's and Don'ts

### Do:
- **Do** put every surface on the board ground, and every letter, form, and long read on a cool white sheet.
- **Do** take status color from the lamp maps: board inks on the board, paper inks on paper.
- **Do** set boards inside a board frame with 3px row gaps.
- **Do** keep hinge lines on single-character flap cells only, with blank flaps for spaces and two-dot colons.
- **Do** run the flap cascade once on load and on status change, and remove it under reduced motion.
- **Do** keep one gold action per view and one gold phrase per heading.
- **Do** keep corners at 2px (1px for badges and tab triggers, 4px for the board frame).
- **Do** show the 2px focus rim on every focusable element: gold on the board, forest ink on paper.

### Don't:
- **Don't** draw a hinge across a row band or across mixed text.
- **Don't** tint paper warm or cream.
- **Don't** use gold, mint, or red for anything outside its state meaning, the primary action, or the lit heading phrase.
- **Don't** set sentences in Big Shoulders or set Big Shoulders in lowercase.
- **Don't** enlarge the hero headline past its column or past 4.75rem.
- **Don't** build icon-card grids, gradient pills, or AI illustrations.
- **Don't** round anything into a pill.
