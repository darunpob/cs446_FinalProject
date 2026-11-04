---
version: 1
slug: "src-app-tsx"
primary_target: "src/App.tsx"
related_targets: []
---

## Scope

Whole web app (found-items home, item detail + claim, report found, report lost, sign in, guard panel). Visitor mode: Operate. Mobile-first, phone used on campus; guard panel at the booth.

## Direction contract

THESIS: Every found item is a clean card on a quiet notice board, and its fate is stamped on it. Refuses the purple-gradient marketplace look and any costume (pins, cork, tilted paper); the item photos carry the colour.

OWN-WORLD: Light theme: pale grey board, white header with a hairline rule, white cards, pastel category tints (sky, orange, pink, yellow, lilac, mint, lime, sand) on card headers and routes, navy primary buttons. Dark theme: near-black board, dark grey cards, plain card headers with a small category dot, white primary buttons. Ink stamps for status; Itim marker voice for page titles only, Anuphan for everything else. No gradients, no glass, no glow, no pins, no scalloped trim, no tilt.

STORY: The owner sees the board, searches or taps a category, recognises their item by its category and building code, opens it, answers the verification question, and goes to the named booth.

FIRST VIEWPORT: White header with BU mark, language and theme, marker title with a short route-colour bar, one-line lead, full-width search field; category chips with colour swatches; notice cards (category header with building code, photo, title, place and time, status stamp); bottom tab bar with mint report-found button on phones.

FORM: Minimal notice board (reworked from the earlier faculty felt board, 2026-11-04). Signature move kept: status stamps (round 'waiting', rectangle 'verified', struck 'returned'), never colour alone. Kept raises: labelled segments on item detail, building code links to place filter, one category hue per top-level route.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
