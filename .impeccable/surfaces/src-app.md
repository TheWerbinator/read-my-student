---
version: 1
slug: "src-app"
primary_target: "src/app"
related_targets: ["src/components"]
---

Scope: the whole web product. Marketing pages (Persuade), auth (Operate), student and faculty dashboards and settings (Operate), professor request page /r/<token> (Operate), school view /view/<token> (Operate/Read), legal and help pages (Read), and transactional emails.

Audience and job: students worldwide (India largest, mostly applying abroad) must believe their letters come back fast because professors answer from one link, then request a letter. Professors must see that answering takes minutes and no account. Schools must trust the sealed letter.

Owner constraints: keep the logo's palette (forest green, logo gold #ffaa00, white) and the pen-and-book logo at header size. Letter-and-paper tone: flaps are printed card stock, and the letter always renders as a paper page.

## Direction contract

THESIS: Every letter request is a departure on a board. It leaves on time, its status flips where student and professor can both see it, and the letter is the one paper page on the board. Refuses the green-and-gold "trusted platform" SaaS of icon-card grids, gradient pills, and AI illustrations.

OWN-WORLD: A station board painted in the brand's forest green (near-black green ground, flap faces one step lighter, a hinge line across each flap, a darker steel-green frame). Flap lettering in the logo's white, set in Big Shoulders condensed caps in fixed cells. Logo gold is the active lamp: primary action, waiting and reminder states. Light mint for ON TIME and SEALED, soft signal red for DECLINED and EXPIRED, by law one ink per state. Body text in Public Sans. Letters, forms the professor fills, and legal reading sit on cool white paper sheets with square corners. Controls are rectangular flap cells with 2px corners; focus is a gold rim.

STORY: A student sees letters departing on time, understands that the professor gets one link and no account, believes the letter will be back before the deadline, and taps Request a letter. A professor understands that answering takes minutes. A school sees a sealed record it can verify.

FIRST VIEWPORT: Full-bleed forest board. Navigation is a paper boarding pass (owner request): fixed vertical pass on the left at lg+ (logo, FROM REQUEST TO SCHOOL route, five page fields, a perforated stub with the gold Request a letter and Log in), and a sideways pass strip on top below lg that unfolds. Left 6 columns (xl): the headline in flap cells sized to that column (100cqi/10.7, max 4.75rem) across three rows, LETTERS THAT / LEAVE ON / TIME, then one Public Sans sentence and two actions (gold Request a letter, board outline I am a professor). Owner ruling (2026-11-08): this column-sized headline is the approved scale; do not enlarge it to the full width, even though section H2 caps measure larger, because the flap cells carry the weight. Right 6 columns: a framed LETTER DEPARTURES board, labelled as a sample, with 5 rows (time, student to professor, school, status) whose status flaps cascade once on load. On mobile: headline, sentence, actions, then the board with 3 rows.

Motif rules (owner rulings): a hinge line exists only on single-character .flap cells, centered on the glyph (measured); row bands (.flap-row) carry the flap color and shading but never a hinge. Word spaces in flap lines are blank flaps. A colon is two dots, one centered on each half of its flap. Boards sit in a steel-green housing (.board-frame). Social icon flaps roll on hover. Ground: every surface (marketing, auth, dashboard, /r, /view) sits on the board; anything people read or fill is a cool white paper sheet on it.

FORM: Departures Board, the split-flap concourse challenger (not on the grounded list; dealt as a challenger and chosen by the owner). Seed key fee52f7e. Signature interaction: the per-character flap cascade when a status changes, run once on the home board and on dashboard status changes, removed under reduced motion.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

Unresolved: INR prices and plan rules (Phase 1). Pricing copy stays as today's real model until then.
