---
name: Tessera
description: A QR code studio that proofs every code like a press sheet before the run.
colors:
  booth: '#d6d6d1'
  sheet: '#fbfbf9'
  ink: '#111111'
  ink-2: '#4a4a45'
  ink-3: '#66665f'
  rule: '#111111'
  hair: '#c6c6bf'
  tint: '#f0f0ec'
  magenta: '#e4007f'
  magenta-ink: '#c4006c'
  on-magenta: '#ffffff'
  cyan: '#00a0e9'
  cyan-ink: '#0072a8'
  yellow: '#ffe600'
  booth-film: '#0b0b0a'
  sheet-film: '#171716'
  ink-film: '#f1f1ec'
  ink-2-film: '#b4b4ad'
  ink-3-film: '#8e8e87'
  hair-film: '#3a3a37'
  tint-film: '#20201e'
  magenta-film: '#ff4fa3'
  on-magenta-film: '#0b0b0a'
  cyan-film: '#3cc1ff'
typography:
  display:
    fontFamily: "Archivo, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: 'clamp(2.6rem, 1.1rem + 5.4vw, 6rem)'
    fontWeight: 820
    lineHeight: 0.9
    letterSpacing: '-0.035em'
    fontVariation: "'wdth' 112"
  title:
    fontFamily: 'Archivo, ui-sans-serif, system-ui, sans-serif'
    fontSize: 'clamp(1.9rem, 1.2rem + 2.6vw, 3.5rem)'
    fontWeight: 800
    lineHeight: 0.95
    letterSpacing: '-0.03em'
    fontVariation: "'wdth' 110"
  head:
    fontFamily: 'Archivo, ui-sans-serif, system-ui, sans-serif'
    fontSize: '1.25rem'
    fontWeight: 750
    lineHeight: 1.15
    letterSpacing: '-0.01em'
    fontVariation: "'wdth' 104"
  body:
    fontFamily: 'Archivo, ui-sans-serif, system-ui, sans-serif'
    fontSize: '17px'
    fontWeight: 400
    lineHeight: 1.625
  label:
    fontFamily: 'Archivo, ui-sans-serif, system-ui, sans-serif'
    fontSize: '11.5px'
    fontWeight: 650
    lineHeight: 1.2
    letterSpacing: '0.08em'
    fontVariation: "'wdth' 100"
  reading:
    fontFamily: 'Archivo, ui-sans-serif, system-ui, sans-serif'
    fontSize: '17px'
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: '-0.01em'
    fontFeature: "'tnum' 1"
    fontVariation: "'wdth' 92"
  stamp:
    fontFamily: 'Archivo, ui-sans-serif, system-ui, sans-serif'
    fontSize: '26px'
    fontWeight: 850
    lineHeight: 1
    letterSpacing: '0.02em'
    fontVariation: "'wdth' 115"
  mono:
    fontFamily: "'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, monospace"
    fontSize: '14px'
    fontWeight: 400
    fontFeature: "'tnum' 1"
rounded:
  none: '0px'
  mark: '999px'
spacing:
  gutter-sm: '16px'
  gutter-md: '24px'
  gutter-lg: '40px'
  section: '56px'
  section-lg: '80px'
  booth-margin-sm: '32px'
  booth-margin-lg: '48px'
components:
  button-primary:
    backgroundColor: '{colors.magenta}'
    textColor: '{colors.on-magenta}'
    rounded: '{rounded.none}'
    padding: '8px 14px'
  button-primary-hover:
    backgroundColor: '{colors.magenta-ink}'
  button-secondary:
    backgroundColor: '{colors.sheet}'
    textColor: '{colors.ink}'
    rounded: '{rounded.none}'
    padding: '8px 14px'
  button-secondary-hover:
    backgroundColor: '{colors.ink}'
    textColor: '{colors.sheet}'
  button-ghost:
    textColor: '{colors.ink-2}'
    rounded: '{rounded.none}'
    padding: '8px 14px'
  button-ghost-hover:
    backgroundColor: '{colors.tint}'
    textColor: '{colors.ink}'
  stamp:
    textColor: '{colors.magenta-ink}'
    typography: '{typography.stamp}'
    rounded: '{rounded.none}'
    padding: '12px 20px'
  stamp-hover:
    backgroundColor: '{colors.magenta}'
    textColor: '{colors.on-magenta}'
  stamp-fail-hover:
    backgroundColor: '{colors.yellow}'
    textColor: '{colors.ink}'
  input:
    backgroundColor: '{colors.sheet}'
    textColor: '{colors.ink}'
    rounded: '{rounded.none}'
    padding: '10px 12px'
  input-hover:
    backgroundColor: '{colors.tint}'
  control-patch:
    backgroundColor: '{colors.sheet}'
    textColor: '{colors.ink}'
    typography: '{typography.reading}'
    height: '28px'
  toggle:
    rounded: '{rounded.none}'
    height: '28px'
    width: '60px'
  tab:
    textColor: '{colors.ink-2}'
    padding: '8px 12px 12px'
  tab-active:
    textColor: '{colors.ink}'
  slug-line:
    backgroundColor: '{colors.sheet}'
    textColor: '{colors.ink-2}'
    typography: '{typography.label}'
    height: '56px'
---

# Design System: Tessera

## Overview

**Creative North Star: "Press Check"**

Every page is one tall proof sheet of bright coated stock lying in a light booth. It is set in black ink, carries printer's marks at its corners and trims, and keeps the three process inks for jobs: magenta marks what needs doing and what is wrong, cyan marks registration and information, and yellow is only ever a highlighter laid under black ink. The code being proofed is the only picture on the sheet. Content runs further down the same sheet and never onto a second one beside it.

The density is that of a job ticket: ruled tables with small-capital field names, live readings in fixed tabular cells, and heavy wide display type cut in at poster size. Depth, softness and decoration are absent by construction. A proof is flat, its corners are square, and anything that moves is behaving like print: plates pulling into register, a densitometer ticking over, a stamp landing.

Dark mode is the same sheet read as a film positive with the booth lamp off. Roles hold. Only values change.

**Key Characteristics:**

- One sheet on a grey booth, with crop marks at the corners, a sticky slug line at its head and ruled section trims.
- Ruled job-ticket grids (1px black rules, shared borders) instead of cards.
- Archivo on its width axis: wide and heavy for display, condensed and tabular for readings.
- Process inks as signals, never as decoration.
- Flat, square, shadowless. The codes themselves are the only gradients.

## Colors

A near-neutral press palette (warm-grey stock and true black ink) with three saturated process inks held back for meaning.

### Primary

- **Process Magenta** (magenta): the primary action and every fault. Stamp borders and fills, the primary button, the struck proof mark, the "Weakest" outline in the control strip, the selected rung of the ladder wedge, the text caret and the range thumb's core. It does not appear as decoration anywhere.
- **Magenta Text Ink** (magenta-ink): magenta when it has to be read as text or a thin stroke (stamp wording, error messages, fail marks, the primary hover). Plain magenta is too light for small text on the sheet.
- **On Magenta** (on-magenta): text set on a solid magenta fill.

### Secondary

- **Process Cyan** (cyan): registration and information. Focus outlines (2px), the fill of the inset gauges in the control strip's reading cells, and the first registration plate.
- **Cyan Text Ink** (cyan-ink): cyan as small marks or text, such as the "On-device" registration target and the note proof mark.

### Tertiary

- **Process Yellow** (yellow): a highlighter only, always under black ink (#111 is hard-set over it in both themes). The warn proof mark's ground, a gauge still short of its target, the hover fill of a failing stamp, and text selection.

### Neutral

- **Booth Grey** (booth): the viewing booth around the sheet. Visible as the margin around the sheet from `sm` up.
- **Coated Stock** (sheet): the sheet itself and every field, toggle and slug-line background.
- **Black Ink** (ink): body text, headlines, solid ladder rungs, the off side of the toggle.
- **Second Ink** (ink-2): secondary prose, field names, nav at rest, crop marks.
- **Third Ink** (ink-3): placeholders, disabled text, the dashed trim around the code, trim-line registration targets.
- **Rule** (rule): the 1px black rules that build every ticket, strip, input and tab bar. It has the same value as ink, but it is a separate role so that rules can be themed apart from type.
- **Hairline** (hair): the default border colour, the slug line's rule before scrolling, trim lines, disabled borders.
- **Tint** (tint): hover fills, unmeasured ladder rungs, the transparency checkerboard.
- **Film tokens** (`*-film`): the values the same roles take under `.dark`. Rule follows ink-film. Magenta-ink and cyan-ink fold into magenta-film and cyan-film, because on dark stock the bright ink is already readable as text.

### Named Rules

**The Process Ink Rule.** Magenta means act or fault, cyan means registration or information, yellow means caution under black. An ink used only because it looks nice is a misprint.

**The Text-Safe Ink Rule.** Any magenta or cyan set as text or a stroke under 3px uses its `-ink` variant on light stock. The bright ink is for fills, outlines and patches.

## Typography

**Display Font:** Archivo (variable, weight 100–900, width 62–125%), with ui-sans-serif and system-ui as fallbacks
**Body Font:** Archivo
**Label/Mono Font:** JetBrains Mono, for hex values and code identifiers only

**Character:** One family carries the whole sheet by moving along its width axis. Display type is stretched wide and set heavy, like a slug blown up to poster size. Readings are pulled narrow and tabular, like a densitometer display. Both fonts are self-hosted.

### Hierarchy

- **Display** (820, clamp 2.6–6rem, 0.9, width 112%): the one page headline (hero, lab, proof wall). Balanced, held to 11–13ch.
- **Title** (800, clamp 1.9–3.5rem, 0.95, width 110%): section headlines on the landing. Balanced, held to 12–16ch.
- **Head** (750, 1.25rem, 1.15, width 104%): panel and fieldset headings inside the studio.
- **Body** (400, 17px, relaxed leading, ink-2): section prose, held to 34–40rem. Bold runs inside it go up to full ink. The hero sub is 18–20px with snug leading.
- **Label** (650, 11.5px, 0.08em, uppercase): the job-ticket small capitals. Field names, slug entries, nav, figure captions, strip patch names and group headings over ruled lists.
- **Reading** (700, width 92%, tabular): every measured value (ratios, percentages, hex readings, module counts), set in fixed cells.
- **Stamp** (850, 22–26px, 0.02em, width 115%, uppercase): the stamp's verdict only.

### Named Rules

**The Width Axis Rule.** Width comes from `font-stretch`, not from letter-spacing or a second family. Wide is for display, normal for labels, narrow for readings.

**The Mono Is For Code Rule.** JetBrains Mono sets hex entries and code identifiers, nothing else. Readings stay in Archivo.

**The Fixed Cell Rule.** Any value that changes in place is tabular, so that nothing beside it reflows.

## Layout

The page is one sheet, up to 1480px wide and centred, sitting on the booth with 32px of margin (`sm`) or 48px (`lg`) of grey around it. Below `sm` the sheet goes full bleed and the crop marks are hidden. The slug line (56px) is sticky at the head of the sheet. Its bottom rule turns from hairline to black once the page has scrolled, and below `md` the nav drops to a second, horizontally scrolling row.

Sections stack down the sheet, each closed by a black bottom rule. The inline gutters are 16, 24 and 40px (base, `sm`, `lg`). Section blocks run at 56px of vertical padding, rising to 80px at `lg`. Landing sections split into two uneven columns at `lg` (roughly 0.8–0.85fr text to 1.15–1.2fr proof) with a 56px gap, and the FAQ's headline column stays sticky. The hero places the headline, then the code, then the ticket on a phone. On desktop it sets the code to the right across two rows. A full-width control strip closes the hero, flush with the sheet edges.

Grids are ruled. A grid draws its left and top rules, and each cell draws its own right and bottom rules, so neighbouring cells share a single 1px line. The control strip auto-fits 9.5rem cells, the job picker runs 2 to 5 columns, and the ladder wedge has 10 columns on a phone and 20 from `sm`. Trim lines (a hairline with a registration target at its centre) separate content within a section.

## Elevation & Depth

None. Nothing on the sheet casts a shadow, blurs or floats. Hierarchy comes from rule weight (hairline, 1px black rule, 3px tab rule and stamp border), ink tier and tint fills. Sticky elements sit on an opaque sheet fill and are ruled off. The single `box-shadow` in the build is an inset one on the range thumb, which draws its concentric registration rings and plays no part in depth.

### Named Rules

**The Flat Proof Rule.** A proof is flat. Lift, glow, glass and blur are all off the sheet. To separate something, rule it off.

## Shapes

Every corner is square: buttons, fields, toggles, strip patches, stamps, tickets, colour swatches. Circles appear only where printing itself uses them. These are the registration target (a ringed crosshair), the range thumb drawn as one, and the proofreader's ring around a fault on a correction. Marks are drawn in SVG at hairline weight with square line caps, never set as glyphs. The code's figure sits inside a dashed ink-3 trim with registration targets at three of its sides. The stamp is the one rotated object (-2.5°). It straightens on hover and lands when pressed.

**The Square Corner Rule.** Nothing on a proof is rounded except the marks a printer draws round: registration targets and proofreader's rings.

## Components

### Buttons

Ruled boxes in ink, with the primary as a solid block of the action colour.

- **Shape:** square (0px), with a 1px border.
- **Primary:** magenta fill and border with on-magenta text. 14px, semibold, padding 8px 14px.
- **Hover / Focus:** the primary deepens to magenta-ink. The secondary (1px rule, sheet fill) inverts to an ink fill with sheet text. All buttons sink 1px when pressed. Focus is a 2px cyan outline offset by 2px.
- **Ghost:** ink-2 text with no border, tinting on hover. Used in the slug line and for tertiary actions.
- **Disabled:** hairline border, tint or sheet fill, ink-3 text, no press.

### Stamp (signature)

The approval stamp is also the download, so the action and the verdict are one object. It has a 3px border, uppercase verdict wording ("Pass for press", "Pass with notes", "Not for press") in the stamp face, and a label line beneath it, all set at -2.5°. Pass and warn verdicts are drawn in magenta. A failing verdict is drawn in black ink and fills yellow on hover. Before a link exists the stamp reads "Awaiting copy", or it focuses the field it needs. When pressed it springs (stiffness 520, damping 26) through scale 1, 1.06, 1, comes upright, fills magenta for about 900ms and lifts. Under reduced motion it neither moves nor rotates.

### Control Strip (signature)

The colour bar along a press sheet's edge, built from the design's own inks and redrawn on every edit. Each patch is a ruled cell with a 28px swatch over a label and a reading. Ink patches show the real colour, and a clear paper shows the checkerboard. Measured-value cells (capacity, recovery, quiet zone, modules) replace the swatch with an inset gauge inside a hairline frame, filled cyan when fine, yellow when short and magenta on a fail, and animated by width over 500ms. The weakest ink is outlined in 2px magenta, inset 4px, with a "Weakest" tag, whether or not it fails. Warn and fail cells carry a proof mark.

### Readings

A densitometer display. A value is split into fixed character cells, and only the cells whose character changed roll over (in from -0.55em, out to +0.55em, 320ms on an expo-out curve, staggered 25ms per cell). The whole value is announced once to assistive tech and the cells are hidden from it.

### Proof Marks

Proofreader's marks drawn in SVG with square caps. A struck cross in magenta-ink for a fault, a tick in ink for a pass, a black bar on a yellow square for a warning, and a ringed "i" in cyan-ink for a note. Crop marks are 1px ink-2 corner rules that stand clear of the trim.

### Registered Code

The live symbol. On first view three process plates (cyan, magenta and yellow), cut as masks from the visitor's own modules and multiplied onto the stock, arrive out of register by about 10px. They pull in over 900ms, staggered by 140ms, then fade and give way to the black code. After that every edit simply redraws it. Under reduced motion the code appears in register.

### Ladder Wedge

A step wedge in ruled cells, one per rung of the distance ladder. Solid ink where the symbol decoded, sheet with a magenta-ink cross where it did not, tint while unmeasured, and a pulse while running. The selected rung takes a 2px magenta outline inset 5px. A label scale runs beneath it (close to far).

### Cards / Containers

There are none. Content that would be a card is a row or cell of a ruled job-ticket grid. A ticket has a fixed label column (96px, or 120px from `sm`) carrying small capitals in ink-2, a rule, and the entry. Cells have no fill, radius or shadow, and tint is reserved for hover and for unmeasured states.

### Inputs / Fields

- **Style:** a 1px rule border on a sheet fill, square, with padding 10px 12px, 15px text and ink-3 placeholders. The caret is magenta.
- **Hover / Focus:** tint on hover. Focus returns the fill to sheet and adds a 2px cyan outline.
- **Error / Disabled:** the border turns magenta and a magenta-ink message with a struck mark appears below. When disabled the border is hairline and the text ink-3.
- **Field:** a label in small capitals, then the entry, then the hint (13px, ink-2) or the error.
- **Selects:** a 2.5px square-capped chevron drawn in the theme's ink.
- **Range:** a 2px black rule track with a registration-mark thumb (a sheet ring around a magenta core).
- **Colour swatches:** square, with a 1px rule.

### Toggle

A ruled two-cell switch, 60 by 28px, labelled Off and On in 10px bold capitals. An ink block (off) or magenta block (on) slides to the side that is set, on a spring (stiffness 600, damping 38). It is not a pill.

### Navigation

- **Slug line:** the Tessera wordmark (850, width 112%), the proof number in ink-3 small capitals, and page links in small capitals. The current page is in full ink with a 2px underline offset 6px. Links at rest are ink-2. An "On-device" note carries a cyan-ink registration target, and the theme switch reads "Paper" or "Film" beside a ruled square.
- **Tabs:** a ruled row with a black bottom rule. Tabs are 14px semibold with a 15px stroke icon, ink-2 at rest and ink when active. The active tab carries a 3px ink rule that slides between tabs on a spring (stiffness 520, damping 40). The row scrolls sideways under an edge-fade mask.

### Motion

The animation engine loads lazily through LazyMotion in strict mode after first paint, with `MotionConfig reducedMotion="user"`. A global reduced-motion rule cuts every CSS transition and animation to 0.01ms and turns off smooth scrolling. Motion only ever behaves like print: registration, readings ticking over, a stamp landing, an ink block sliding. Nothing animates in on scroll beyond the code's single arrival.

## Do's and Don'ts

### Do:

- **Do** build every new surface as more of the same sheet. Gutters are 16/24/40px, section padding is 56px (80px at `lg`), and each section closes with a black rule.
- **Do** group content in ruled job-ticket grids where cells share 1px rule lines, with small-capital field names in a fixed label column.
- **Do** keep magenta for the primary action and for faults. Use magenta-ink whenever it is text or a thin stroke on light stock.
- **Do** use cyan for focus (a 2px outline offset by 2px), registration and information gauges, and yellow only under black ink.
- **Do** set every changing value as a Reading in tabular figures and fixed cells.
- **Do** get width from Archivo's width axis: display at 110–115%, readings at 92%.
- **Do** draw marks (crop, registration, proof marks) as hairline SVG with square caps.
- **Do** give every animation a reduced-motion state that shows the finished, registered result.

### Don't:

- **Don't** add shadows, glass, blur or glows. Rule things off instead.
- **Don't** use gradients outside the QR codes being proofed. The only other linear gradients are functional: the checkerboard and the scroll-edge mask.
- **Don't** round corners. Circles are only for registration targets, the registration-mark thumb and proofreader's rings.
- **Don't** put a small-capital label above a headline as an eyebrow or kicker. Small capitals name fields and groups. They never introduce a headline.
- **Don't** use magenta, cyan or yellow decoratively, or let one stand in for another's role.
- **Don't** wrap content in cards with fills, padding and radius. Use a ruled row or cell.
- **Don't** set readings in JetBrains Mono, or set prose in it. It is for hex and code only.
- **Don't** place a second sheet beside the first. Content continues down the sheet.
