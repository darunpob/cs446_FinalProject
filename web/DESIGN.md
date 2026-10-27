---
name: BU Lost & Found
description: Every found item is a notice pinned to a Thai faculty board, and its fate is stamped on it.
colors:
  felt-board: "hsl(157 40% 16%)"
  felt: "hsl(157 42% 21%)"
  felt-line: "hsl(157 26% 31%)"
  on-felt: "hsl(46 50% 95%)"
  on-felt-muted: "hsl(150 22% 79%)"
  paper: "hsl(44 50% 97%)"
  paper-2: "hsl(42 32% 92%)"
  paper-3: "hsl(40 24% 86%)"
  field: "hsl(0 0% 100%)"
  ink: "hsl(158 30% 11%)"
  ink-2: "hsl(156 10% 29%)"
  ink-3: "hsl(156 7% 39%)"
  rule: "hsl(42 20% 84%)"
  rule-strong: "hsl(42 14% 68%)"
  stock-yellow: "hsl(47 92% 62%)"
  stock-pink: "hsl(338 80% 81%)"
  stock-sky: "hsl(203 72% 75%)"
  stock-mint: "hsl(146 46% 71%)"
  stock-orange: "hsl(28 92% 66%)"
  stock-lilac: "hsl(268 62% 83%)"
  stock-lime: "hsl(78 56% 68%)"
  stock-sand: "hsl(36 48% 77%)"
  stamp-red: "hsl(3 66% 43%)"
  verify-blue: "hsl(222 62% 40%)"
  pin-red: "hsl(3 72% 48%)"
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
  notice: "2px"
  sheet: "6px"
  control: "8px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.felt}"
    textColor: "{colors.on-felt}"
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
    backgroundColor: "{colors.stock-pink}"
    textColor: "{colors.ink}"
    typography: "{typography.title}"
    rounded: "{rounded.notice}"
    padding: "8px 20px"
---

# Design System: BU Lost & Found

## Overview

**Creative North Star: "The Faculty Notice Board"**

The whole app is the felt board outside a Thai faculty office. The shell and page ground are dark felt green; everything a person reads sits on paper pinned to it. Found items are notices with a card-stock header, and their status is an ink stamp. Real-world board materials supply type, palette, density and one signature move. Navigation and controls stay standard web controls.

The surface is an Operate surface: an anxious owner searching on a phone, a finder logging an item, a guard at the booth. Expression never hides the task. The board carries colour at page scale (felt shell, card-stock categories, route hues) rather than a grey screen with one accent.

**Key Characteristics:**
- Felt-green ground and header; paper sheets for every reading surface.
- Thai card-stock colours mark categories, route sections, and page titles.
- Red push-pins on sheets and notices; scalloped yellow board trim under the header.
- Status stamps: round red = waiting for owner, square blue = verified, struck grey = returned.
- Itim marker voice for page titles only; Anuphan for everything else.

## Colors

The palette is the board's materials: felt, paper, card stock, red pins, and stamp ink. Values are HSL custom properties in `src/styles.css`; dark theme redefines every token.

### Primary
- **Felt** (`felt`, `felt-board`): header, page ground, and the primary button on paper. In dark theme the primary button turns to stock yellow.

### Secondary
- **Card stock** (`stock-*`): eight category colours (electronics sky, wallet orange, card pink, keys yellow, bag lilac, bottle mint, clothing lime, other sand). Text on card stock is always `ink`.

### Tertiary
- **Stamp ink** (`stamp-red`, `verify-blue`) and **pin red**: status and the pin, nothing else.

### Neutral
- **Paper** (`paper`, `paper-2`, `paper-3`) with **ink** (`ink`, `ink-2`, `ink-3`) for all reading text. **On-felt** (`on-felt`, `on-felt-muted`) for text placed directly on the board.

### Named Rules
**The Route Stock Rule.** Each top-level route owns one card-stock hue at full strength: found items yellow, report lost pink, report found mint, guard panel sky, account sand. Page titles are cut from it and the active nav item wears it.

**The Two Surfaces Rule.** Text is either on felt (on-felt tokens, yellow focus ring) or on paper (ink tokens, ink focus ring). The `.paper` class switches the focus colour automatically; never place ink text directly on felt.

## Typography

**Display Font:** Itim (Cadson Demak), marker-hand Thai and Latin
**Body Font:** Anuphan (Cadson Demak), loopless Thai sans with Latin
**Fallbacks:** Hiragino Sans, PingFang SC, Noto Sans CJK JP, Microsoft YaHei for Chinese and Japanese.

### Hierarchy
- **Display** (Itim 400, 3rem, home hero only).
- **Title** (Itim 400, 2.25–2.5rem): page titles on a card-stock strip, item titles on the detail sheet, dialog titles.
- **Heading** (Anuphan 600, 1.125rem): form section and panel headings.
- **Body** (Anuphan 400, 15px, line-height 1.6): descriptions, max-width 65ch.
- **Label** (Anuphan 600, 14px): field labels, chips, buttons. Numbers use tabular figures everywhere data is shown.
- **Code** (monospace 700, tracked 0.25em): pickup codes only.

### Named Rules
**The Marker Rule.** Itim is handwriting on the board: page titles, item titles, dialog titles. Never for body, labels, buttons, or numbers.

## Layout

Mobile first. Content max width 72rem with 16px (24px from `sm`) gutters. Notices sit **three per row at every width** (an explicit user decision), gap 8px on phones rising to 24px on desktop. The filter bar sticks under the 74px header. A paper tab bar is fixed at the bottom of phones, with the mint report-found button raised from it. Detail and form pages use a two-column grid from `lg`.

## Elevation & Depth

Depth is paper lying on felt. Shadows always carry an offset and a soft blur.

### Shadow Vocabulary
- `shadow-paper`: resting sheets and notices.
- `shadow-lifted`: hovered notices, menus, the raised tab button.
- `shadow-sheet`: dialogs and the bottom tab bar.

### Named Rules
**The Pinned Rule.** A sheet that stands alone on the board carries a pin at its top edge (`.pin`). Sheets nested inside another sheet never get a pin and never get a shadow.

## Shapes

Small radii, like cut paper: notices 2px, sheets 6px, controls 8px. Stamps are the exception: round (`rounded-full`) or square by status. Card-stock page titles tilt -1°; stamps tilt -7° (the ticket stamp tilts +8°).

## Components

### Buttons
Primary is felt with on-felt text; mint is reserved for report-found actions; secondary is a white field with a strong rule. Press nudges 1px down; disabled drops to 50% opacity; loading swaps the icon for a spinner and sets `aria-busy`.

### Chips
Category chips on the felt filter bar: an outlined chip with a small card-stock swatch; when selected it fills with its card stock and shows its icon.

### Cards / Containers
`Card` is a paper sheet (`.paper`, radius 6px, `shadow-paper`, optional pin). Form sections, the item detail, login, empty states and admin lists are all sheets.

### Inputs / Fields
White field, strong rule border, 8px radius, 44px tall. Focus turns the border ink with a 4px stock-yellow ring. Errors turn the border to `danger`, and a message below names the problem.

### Navigation
Felt header: BU mark (yellow card stock) plus "Lost & Found" in Itim, desktop links that fill with their route stock when active, language and theme controls, mint report-found button. The scalloped yellow trim edges the header. Phones get a paper bottom tab bar whose active icon sits on its route stock.

### Notice (signature)
`ItemCard`: paper notice with a pin, a card-stock header (category icon plus place code such as LIB or A5), square photo (4:3 from `sm`), status stamp over the photo's corner, title clamped to two lines, place and relative time.

### Status Stamp (signature)
`StatusStamp`: bordered ink text on translucent paper, tilted. The shape and word carry the status, not colour alone. `pressed` runs the one authored motion: a 0.42s exponential stamp-press (scale 1.6 → 1, blur 3px → 0) when a status lands.

## Do's and Don'ts

### Do:
- **Do** put every reading surface on paper and keep text on felt in on-felt tokens.
- **Do** colour categories and routes with card stock at full strength, with ink text on top.
- **Do** carry status with stamp shape and word, never colour alone.
- **Do** keep motion to the stamp press, the dialog sheet rising, and hover lifts.

### Don't:
- **Don't** use gradients, glass, glow shadows, or gradient text.
- **Don't** put a kicker or eyebrow label above a heading; the card-stock title strip carries the section.
- **Don't** nest a shadowed card inside a sheet; separate with dashed perforation rules instead.
- **Don't** add cork texture, paper grain, or tilted notices; the board lends type, palette, density and the stamp, never a costume.
