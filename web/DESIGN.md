---
name: BU Lost & Found
description: A clean white notice board — every found item is a card with a category header, and its fate is stamped on it.
colors:
  felt-board: "hsl(220 20% 97%)"
  felt: "hsl(0 0% 100%)"
  felt-line: "hsl(220 16% 90%)"
  on-felt: "hsl(222 30% 14%)"
  on-felt-muted: "hsl(222 10% 40%)"
  paper: "hsl(0 0% 100%)"
  paper-2: "hsl(220 22% 96%)"
  paper-3: "hsl(220 16% 91%)"
  field: "hsl(0 0% 100%)"
  ink: "hsl(222 30% 14%)"
  ink-2: "hsl(222 10% 36%)"
  ink-3: "hsl(222 8% 46%)"
  rule: "hsl(220 16% 90%)"
  rule-strong: "hsl(220 12% 80%)"
  action: "hsl(222 60% 34%)"
  stock-yellow: "hsl(47 86% 86%)"
  stock-pink: "hsl(338 72% 92%)"
  stock-sky: "hsl(203 72% 90%)"
  stock-mint: "hsl(146 46% 82%)"
  stock-orange: "hsl(28 82% 90%)"
  stock-lilac: "hsl(268 62% 92%)"
  stock-lime: "hsl(78 48% 85%)"
  stock-sand: "hsl(36 42% 88%)"
  stamp-red: "hsl(352 62% 46%)"
  verify-blue: "hsl(222 62% 40%)"
  danger: "hsl(355 70% 43%)"
  warn: "hsl(30 92% 30%)"
  success: "hsl(150 62% 26%)"
typography:
  display:
    fontFamily: "Itim, Anuphan, sans-serif"
    fontSize: "3rem"
    fontWeight: 400
    lineHeight: 1.25
  title:
    fontFamily: "Itim, Anuphan, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 400
    lineHeight: 1.25
  heading:
    fontFamily: "Anuphan, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.75
  body:
    fontFamily: "Anuphan, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Anuphan, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.4
  code:
    fontFamily: "ui-monospace, Menlo, Consolas, monospace"
    fontSize: "2.25rem"
    fontWeight: 700
    letterSpacing: "0.25em"
rounded:
  notice: "6px"
  sheet: "10px"
  control: "12px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.action}"
    textColor: "{colors.field}"
    rounded: "{rounded.control}"
    height: "44px"
    padding: "0 16px"
  button-mint:
    backgroundColor: "{colors.stock-mint}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    height: "44px"
    padding: "0 16px"
  button-secondary:
    backgroundColor: "{colors.field}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    height: "44px"
    padding: "0 16px"
  input:
    backgroundColor: "{colors.field}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    height: "44px"
    padding: "0 14px"
  notice-header:
    textColor: "{colors.ink}"
    rounded: "{rounded.notice}"
    height: "36px"
  page-title:
    textColor: "{colors.on-felt}"
    typography: "{typography.title}"
---

# Design System: BU Lost & Found

## Overview

**Creative North Star: "The Clean Notice Board"**

The app is a notice board stripped to its essentials. The light theme is a pale grey board with a white header and white cards; each found item is a card whose header carries a soft category tint, and its status is an ink stamp. The dark theme goes further toward white-minimal: a near-black board, dark grey cards, card headers in the card's own colour with a small category dot, and white primary buttons. Navigation and controls stay standard web controls.

The surface is an Operate surface: an anxious owner searching on a phone, a finder logging an item, a guard at the booth. Expression never hides the task, and photos of found items are the most colourful thing on screen.

**Key Characteristics:**
- Light theme: pale grey board, white header with a hairline rule, white cards, pastel category headers, navy primary buttons.
- Dark theme: near-black board, dark grey cards, category shown as a dot in a plain header, white primary buttons.
- Hairline edges (a 1px ring inside the shadow) instead of heavy drop shadows; no pins, no scalloped trim, no tilted elements.
- Status stamps: round red = waiting for owner, square blue = verified, struck grey = returned.
- Itim marker voice for page titles only; Anuphan for everything else.

## Colors

Values are HSL custom properties in `src/styles.css`; the dark theme redefines every token. Token names (`felt`, `board`, `stock-*`) are kept from the earlier board design so components did not have to change.

### Primary
- **Action** (`action`): primary buttons. Navy in light theme, near-white with dark text in dark theme.

### Secondary
- **Category tints** (`stock-*`): eight category colours (electronics sky, wallet orange, card pink, keys yellow, bag lilac, bottle mint, clothing lime, other sand). Light theme uses them as pale header tints with `ink` text; dark theme uses them at mid strength for the category dot, chips and icon tiles.
- **Strong shades** (`stock-*-strong`): the same eight hues deep enough to read on white. Use them whenever a category colour is text, an icon, a border, a focus ring or a small swatch; never use the pale `stock-*` for those.

### Tertiary
- **Stamp ink** (`stamp`, `verify`): status only.

### Neutral
- **Board** (`board`) is the page ground, **felt** (`felt`) the header bar; text on them uses `on-felt` / `on-felt-2`. **Paper** (`surface`, `surface-2`, `surface-3`) with **ink** (`ink`, `ink-2`, `ink-3`) for every reading surface.

### Named Rules
**The Route Stock Rule.** Each top-level route owns one category hue: found items yellow, report lost pink, report found mint, guard panel sky, account sand. The active nav item wears it. In light theme the page title sits on a tinted slip (`.title-slip`, 10px radius, no tilt); in dark theme the slip disappears and a route-colour dot (`.title-dot`) leads the title.

**The Dark Header Rule.** In dark theme any element with `.notice-head` drops its tint and shows its `.notice-dot` instead; `.stock-wash` placeholders fall back to the plain field colour. These overrides live unlayered at the end of `styles.css`.

## Typography

**Display Font:** Itim (Cadson Demak), marker-hand Thai and Latin
**Body Font:** Anuphan (Cadson Demak), loopless Thai sans with Latin
**Fallbacks:** Hiragino Sans, PingFang SC, Noto Sans CJK JP, Microsoft YaHei for Chinese and Japanese.

### Hierarchy
- **Display** (Itim 400, 3rem, home hero only).
- **Title** (Itim 400, 2.25–2.5rem): page titles on a route-colour slip, item titles on the detail sheet, dialog titles.
- **Heading** (Anuphan 600, 1.125rem): form section and panel headings.
- **Body** (Anuphan 400, 15px, line-height 1.6): descriptions, max-width 65ch.
- **Label** (Anuphan 600, 14px): field labels, chips, buttons. Numbers use tabular figures everywhere data is shown.
- **Code** (monospace 700, tracked 0.25em): pickup codes only.

## Layout

Mobile first. Content max width 72rem with 16px (24px from `sm`) gutters. Notices sit **three per row at every width** (an explicit user decision), gap 8px on phones rising to 24px on desktop. The filter bar sticks under the header. A tab bar is fixed at the bottom of phones, with the mint report-found button raised from it. Detail and form pages use a two-column grid from `lg`.

## Elevation & Depth

Flat. Every shadow token starts with a 1px `line` ring, which gives cards a hairline edge without shifting layout, plus a faint blur.

- `shadow-paper`: resting cards and notices.
- `shadow-lifted`: hovered notices, menus, the raised tab button.
- `shadow-sheet`: dialogs and the bottom tab bar.

## Shapes

Soft radii: `rounded-sm` 6px (notices, small tiles), `rounded-md` 10px (sheets, menus), `rounded-lg` 12px (buttons and large controls). Stamps stay round (`rounded-full`) or square by status, upright, with a 1.5px border.

## Components

### Buttons
Primary uses `action` with `action-ink`; mint is reserved for report-found actions; secondary is a field with a strong rule. Press nudges 1px down; disabled drops to 50% opacity; loading swaps the icon for a spinner and sets `aria-busy`.

### Chips
Category chips on the filter bar: an outlined chip with a small category swatch; when selected it fills with its category colour and shows its icon.

### Cards / Containers
`Card` is a paper sheet (`.paper`, radius 10px, `shadow-paper`). Form sections, the item detail, login, empty states and admin lists are all sheets.

### Inputs / Fields
Field background, strong rule border, 44px tall. Focus turns the border ink with a 4px ring. Errors turn the border to `danger`, and a message below names the problem.

### Navigation
White header (dark grey in dark theme) with a hairline bottom rule: BU mark plus "Lost & Found" in Itim, desktop links that fill with their route colour when active, language and theme controls, mint report-found button. Phones get a bottom tab bar whose active icon sits on its route colour.

### Notice (signature)
`ItemCard`: a card with a category header (`.notice-head`: tint in light theme, dot in dark theme, plus category icon and place code such as LIB or A5), square photo (4:3 from `sm`), status stamp over the photo's corner, title clamped to two lines, place and relative time.

### Status Stamp (signature)
`StatusStamp`: bordered ink text on translucent paper, upright. The shape and word carry the status, not colour alone. `pressed` runs the one authored motion: a 0.42s exponential stamp-press (scale 1.6 → 1, blur 3px → 0) when a status lands.

## Do's and Don'ts

### Do:
- **Do** keep reading surfaces on paper and text on the board in on-felt tokens.
- **Do** let item photos be the loudest colour on screen; categories stay soft.
- **Do** carry status with stamp shape and word, never colour alone.
- **Do** keep motion to the stamp press, the dialog sheet rising, and hover lifts.

### Don't:
- **Don't** use gradients, glass, glow shadows, or gradient text.
- **Don't** bring back pins, scalloped trim, or tilted cards and titles.
- **Don't** nest a shadowed card inside a sheet; separate with rules instead.
- **Don't** use heavy drop shadows; edges come from the hairline ring.
