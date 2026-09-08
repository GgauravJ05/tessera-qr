# scanlab — the decode harness

Stage 1 of the learned scannability model. This is offline tooling: it is not
imported by the app, adds nothing to the bundle, and cannot affect what users
see. `npm run build` does not touch it.

## What it does

It answers one question for a given QR design: **at what point does it stop
being readable?**

A design is rendered through the app's own modules, put through a ladder of
simulated physical conditions, and handed to a real decoder at every step. The
labels it produces are measurements, not opinions — which is what makes them
usable as training targets later.

```
design ──► render (qr-code-styling, via the app's toQrOptions)
             │
             ├──► distance ladder ──► decode ──► how far it survives
             └──► per-defect sweeps ─► decode ──► what breaks it first
```

## Running it

```bash
npm run lab:smoke
```

This rebuilds the app bridge and runs six reference designs, ordered
best-to-worst by expectation. If the reported ordering does not roughly match
that order, the harness is broken.

Requires **Google Chrome** installed. The lab drives your existing Chrome via
`playwright-core` rather than downloading its own ~150 MB browser.

## Why the simulation runs in a browser

The symbol is rendered by the same `qr-code-styling` build, through the same
`toQrOptions` mapping, onto the same Canvas2D implementation the real app uses.
`page/entry.ts` re-exports the app's own modules rather than copying them, so a
change to how Tessera renders automatically changes what the lab measures.

A Node-side reimplementation with a headless canvas would drift from the app,
and training data that describes a slightly different renderer than the one
users get is worse than no training data at all.

## The units

Everything is denominated in **modules**, not pixels.

- **ppm** — pixels per module at the sensor. This is what actually encodes
  viewing distance, and expressing it this way makes a 29-module URL and a
  177-module vCard directly comparable. Nyquist puts the floor at 2; real
  decoders want 3–4.
- **blur in modules** — a fixed pixel blur would be a different physical defect
  at every rung, which would make the ladder incomparable across designs.

Because every label depends on the pixels-per-module being right, the smoke
test verifies it against pixels measured off an actual render: a finder pattern
is 7 modules wide by definition, so the dark run at the symbol's top edge
divided by 7 is the ground truth. It also confirms the renderer centres the
floored symbol, which makes the real quiet zone wider than the requested
margin — an assumption that was wrong in the first draft and silently sampled
the wrong row.

## Labels produced

| Label            | Meaning                                                                                   |
| ---------------- | ----------------------------------------------------------------------------------------- |
| `distanceRung`   | Last rung survived before the first failure. The primary target.                          |
| `minPpm`         | Pixels per module at that rung.                                                           |
| `strictRung`     | Same walk with the decoder forbidden to invert.                                           |
| `invertPenalty`  | Rungs lost to being light-on-dark.                                                        |
| `blurBreak` etc. | First value on each defect sweep that broke it; `null` means it survived the whole sweep. |
| `trace`          | Full boolean trace, so the scoring rules can be revisited without re-running.             |

Two deliberate choices:

- **The score is the first failure, not the best pass.** Decoding is not
  perfectly monotonic — a noise draw can rescue a rung a design has no business
  passing — and scoring on first failure refuses to credit that luck.
- **A decode that returns the wrong string counts as a failure.** A symbol that
  confidently reads as something else is worse than one that does not read.

Runs are seeded, so a result is reproducible from its seed.

## Two decoder verdicts

Every capture is judged twice: once with the decoder forbidden to invert
(`strict`, modelling the older dark-on-light-only scanners the app already
warns about) and once allowed to (`any`, modelling a modern phone). If every
decode could invert, the inversion effect would vanish from the labels and no
model could ever learn it.

> Note: jsQR 1.4.0's `onlyInvert` mode is unusable — it scans an inverted
> matrix that `binarize` was never asked to produce, and dereferences
> undefined. `attemptBoth` is used instead.

## Calibration

The sweeps were tuned, not guessed. The first pass ran probes at 4 px per
module and nearly every axis saturated: almost nothing broke, so the axes
carried no signal. At 3 px per module the defects bite while still describing a
scan a real person would expect to succeed.

Current reference results:

| Design                      | rung (of 19) | strict | note                           |
| --------------------------- | ------------ | ------ | ------------------------------ |
| Classic black, square dots  | 13           | 13     |                                |
| Default soft, rounded       | 12           | 12     |                                |
| Dots + indigo gradient      | 11           | 11     |                                |
| Dense vCard, EC L           | 10           | 10     | more modules fail sooner       |
| Inverted, light on dark     | 12           | **−1** | unreadable to a strict decoder |
| Low contrast lilac on cream | **−1**       | −1     | fails everywhere               |

The first three share a contrast ratio and differ only in shape, and they still
separate by two rungs. That is the finding the whole project rests on: dot
style measurably changes scannability, and a flat contrast threshold cannot
express it.

JPEG is the weakest axis — most designs survive to quality 0.03. That is a
result about the defect, not a bug in the sweep.

## Known limitations

- **Simulated, not photographed.** The ladder is a physical model, not a
  camera. Absolute levels should not be quoted as real-world distances until
  Stage 5 validates them against actual phone scans.
- **One decoder.** jsQR is stricter than ZXing, which most phones use, so
  results are conservative. A second decoder would turn each label into a vote.
- **No perspective.** Codes photographed off-axis are not yet modelled.

## Files

| File            | Role                                                    |
| --------------- | ------------------------------------------------------- |
| `ladder.mjs`    | The degradation ladder and sweeps. The scientific core. |
| `page/lab.js`   | Runs in the browser: render, degrade, decode.           |
| `page/entry.ts` | Re-exports the app's modules into the page.             |
| `runner.mjs`    | Chrome lifecycle, geometry, label summarisation.        |
| `cli.mjs`       | The smoke test.                                         |
