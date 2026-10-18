# Tessera redesign plan

Status: **shipped to the working tree, uncommitted.** Direction: **Press Check** (prepress proof sheet; seed 202d2dcf). Phases 0–5 are done: `/` (landing and studio), `/lab/`, and `/gallery/` with Break it. The finish review passed after one fix round, DESIGN.md is written from the build, and the README and its screenshots are refreshed. Last updated 2026-10-17.

Read this first, together with [PRODUCT.md](PRODUCT.md), before any redesign work. PRODUCT.md records what the product is. This file covers what the redesign will do and in what order.

---

## 1. Decisions already made

| Decision       | Answer                                                                                                                                                                           |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Scope          | **Full redesign.** The current look is evidence of what to move away from. Keep all product facts, content, functionality, offline/PWA behaviour, privacy and the 320px support. |
| Phases         | **All four:** landing page, studio, `/lab` benchmark page, and the Break-it challenge with a ranked gallery.                                                                     |
| Animation      | **Add `motion`, bundled.** Use `LazyMotion` / `m` or `animate`, roughly 3–5 kB. It must never load from a CDN; the app makes zero network requests.                              |
| Audience       | Mixed: small businesses printing codes, designers and developers, and everyday users.                                                                                            |
| Binding brand  | Only the name **Tessera**. The tagline, logo mark and voice may all change.                                                                                                      |
| Model evidence | Publish the scanlab results (56% vs 42%) and state plainly that they are **simulated only**, with real-phone validation pending.                                                 |
| Build path     | **Code first.** No image generator is available, so there are no mock-up images.                                                                                                 |

---

## 2. Diagnosis of the current design

Tessera's product is unusually rigorous:

- Contrast is rated at the weakest point of a gradient.
- The scanlab harness runs designs through a ladder of simulated distances against a real decoder.
- A neural model, trained on 5,000 decoded symbols, catches 56% of unscannable designs against 42% for the contrast rule.
- The app makes zero network requests and works offline.

The visual design does not show any of this. It is the generic AI-SaaS template, and the redesign must remove all of the following:

- Indigo accent with a radial glow behind the hero, plus a hairline grid backdrop.
- A pill badge with a sparkle icon ("Static codes that never expire").
- Gradient-filled headline text ("worth scanning.").
- Two centred buttons, then a row of icon-labelled trust items.
- A strip of three stat cards (9 / 4 / 0).
- Seven identical feature cards, each with an icon tile.
- A monospace uppercase eyebrow above every section.
- Numbered "01 / 02 / 03" panel steps in the studio.

The redesign should make Tessera look like what it is: a measurement-led tool that proves its codes scan.

---

## 3. What to take from each reference

### impeccable.style: prove every claim with a real example

- **Before/after slider.** A pretty code that fails next to the same design after Tessera's fix, with a draggable divider. Example: a gradient that fades to 1.4:1 at its light end, beside the corrected version.
- **Annotated symbol.** Labels drawn onto the QR itself, like impeccable's slop-detector mock-up: "light end of gradient 1.6:1", "logo covers 31%, more than error correction level H can recover", "quiet zone missing".
- **Organise by intent, not by setting.** Plain-language starting points, each of which loads a preset plus the right print guidance:
  - "Share WiFi with guests"
  - "Put my link on a poster"
  - "Print on a business card"
- **Restrained frame.** Let the QR codes supply the colour, the way impeccable lets its examples carry the colour on a neutral page.
- **Self-demonstration.** The page is built to the same standard it sells.

### motion.dev: pair every feature with a live demo, and use physical motion

- **Feature next to a working control.** Each "why Tessera" claim becomes a small interactive demo. Example: drag a colour and watch the contrast readout cross 3:1 and the symbol fail.
- **Distance scrubber.** Modelled on motion.dev's timeline editor. A slider moves a virtual phone away from the code, increasing blur and lowering pixels per module, until it stops decoding. This uses the real scanlab ladder (`tools/scanlab`), and no other generator can show it.
- **Live readouts that tick between values.** Contrast ratio, bytes and scan probability change smoothly instead of jumping, using tabular figures.
- **Spring-based UI motion.** A shared sliding indicator for the content tabs (`layoutId`), layout animation when the preview resizes, and spring feedback on export.
- **Scroll-driven hero.** "Tessera" means a mosaic tile, so the hero QR builds itself one tile at a time as you scroll. It must be a real code that scans once it settles.

### Kaggle: frame Tessera as a proving ground for QR codes

- **`/lab` benchmark page.** Contains:
  - the scanlab method;
  - the 5,000-symbol dataset, described like a Kaggle dataset card;
  - a results table comparing the contrast rule with the model on catch rate and false-alarm rate;
  - a clear "simulated, one decoder, real-phone validation pending" caveat.

  The strongest evidence currently sits in a README.

- **Break-it challenge.** Design the most stylised code you can that still scans, scored on the device. Kaggle-style ranks (Readable → Robust → Bulletproof) are stored on the device only (localStorage, with try/catch). There is no backend leaderboard.
- **Gallery of presets ranked by scan score,** so presets read like submissions with results rather than a row of colour swatches.

---

## 4. Phased build plan

### Phase 0: foundation (required before any visual work)

1. ~~Run `init` to write PRODUCT.md.~~ **Done.**
2. **Pick a visual direction.** Present 2–3 concrete options, each with type, colour and motion, and let the user choose:
   - **Instrument / lab:** precise, measurement-led, monospace readouts, pass/fail colours used only for meaning.
   - **Mosaic / print shop:** the module grid as the identity, paper and ink, crop and registration marks.
   - **Editorial:** large type, generous space, the codes treated as artwork.
3. **Write DESIGN.md:** tokens (light and dark), type scale, spacing, components, and motion rules (durations, springs, reduced-motion behaviour).
4. Add `motion` as a dependency and confirm the PWA precache and bundle size stay acceptable.

### Phase 1: landing page (Persuade)

New section order:

1. **Hero.** The QR builds itself tile by tile and the visitor can edit it in place (a mini-studio). New headline; the tagline may change.
2. **Before/after slider.** A pretty failing code next to the fixed version.
3. **Annotated failures.** Real failing designs with labels on the symbol.
4. **Distance scrubber.** Move the phone away and watch the code stop decoding.
5. **Intent shortcuts.** Plain-language starting points that jump into the studio with a preset loaded.
6. **Privacy and offline proof.** A live "0 network requests this session" readout. Offline support and installability shown working, not just claimed.
7. **FAQ,** restyled.
8. **Footer,** restyled.

Remove everything listed in section 2: stat strip, sparkle badge, gradient text, icon-tile grid, glow and grid backdrop.

### Phase 2: the studio (Operate)

- **One workspace.** Replace the 01/02/03 panels with a single workspace that stays on screen while you work.
- **Controls grouped by risk.** Settings that can break scanning (colours, gradient, logo, error correction) sit next to the warning they trigger.
- **Print-readiness summary beside Export:** minimum print size, the risks found, and a "test with two phones" checklist.
- **Annotated-symbol overlay** on the real preview, the same treatment as the landing page.
- **Motion system:** tab indicator, ticking readouts, export and copy feedback, preview layout transitions.
- **Mobile:** the preview stays visible as you scroll (currently it scrolls away) and the controls live in a bottom sheet.
- **Presets** become the ranked gallery (Phase 4) rather than swatches.

### Phase 3: `/lab` benchmark page (Read)

- Method: render, then the distance ladder, then a decoder; units in modules and pixels per module (ppm). Source: `tools/scanlab/README.md`.
- Dataset card for the 5,000 decoded symbols.
- Results table: contrast rule (42%) against the model (56%) at the same false-alarm rate.
- Limits stated plainly: simulated conditions, one decoder, real-phone validation pending (the apparatus was added in commit 661bb8e).
- Needs routing. Check `vercel.json` carefully, because commit 73ebdd7 fixed an invalid route pattern that had broken deploys.

### Phase 4: Break-it challenge and gallery

- The challenge scores the visitor's design on the device, using the contrast rule, capacity and, when enabled, the scan model.
- Ranks (Readable → Robust → Bulletproof) and personal bests are stored in localStorage only, wrapped in try/catch.
- The gallery shows the presets ranked by scan score; one click loads a preset into the studio.
- Nothing is uploaded and there is no shared leaderboard.

### Phase 5: finish

- `audit`: accessibility (WCAG AA), performance, the 320px layout, keyboard use, reduced motion.
- `polish` pass.
- Run the Impeccable detector on the changed files.
- Refresh the `screenshots/` images and the README.

---

## 5. Constraints that must hold throughout

- No backend and no requests to other sites, including fonts and libraries. Everything is bundled or self-hosted.
- Offline PWA precache keeps working, and the app stays installable.
- The layout works from 320px with no horizontal scroll.
- Every animation has a `prefers-reduced-motion` fallback.
- WCAG 2.1 AA and full keyboard operation of the studio.
- No made-up testimonials, users, press or usage numbers. Only real scanlab figures, with their caveat.
- Existing tests (`npm test`), type checking and lint must still pass. Update the App test if the markup changes.
- AGPL-3.0 licence unchanged.

---

## 6. How to resume

Tell Claude: **"Refer to REDESIGN_PLAN.md and start the redesign"** (or name a phase). Claude should then:

1. Run `/impeccable` context. PRODUCT.md already exists, so `init` is not needed.
2. Start Phase 0, step 2: present the visual directions and get a choice.
3. Write DESIGN.md, then build the phases in order, updating the **Status** line at the top of this file as each phase lands.
