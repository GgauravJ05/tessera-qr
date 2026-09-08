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

## Ladder calibration

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

## Stage 2 — building the dataset

```bash
node tools/scanlab/generate.mjs --count 5000 --out data/scans.jsonl --seed 1
```

Writes one JSON object per line: the design, its geometry, its feature vector
and its labels. Runs at roughly 1/s, so 5,000 designs is about ninety minutes.
Seeded and resumable — killing it and restarting continues the same random
stream rather than starting a different one, because a dataset assembled from
two streams is not the dataset its seed claims to be.

Datasets are gitignored. Regenerate from the seed instead of committing them.

### Features live in the app, not here

`src/lib/scanFeatures.ts` holds the feature extractor, and the harness calls it
through the same bridge it renders through. Train/serve skew — features
computed one way during training and another at inference — is the quietest way
to break a deployed model, because nothing errors, the numbers just stop
meaning what they meant. One implementation used by both sides makes that
impossible by construction rather than by discipline.

`FEATURE_NAMES` is a positional contract. A model is only weights over those
positions, so reordering the array invalidates every model trained against it.
Append, never insert.

### The sampler is where the dataset is won or lost

Two rounds of diagnosis changed it substantially.

**Flat contrast bins produced a dataset with nothing to learn.** A first trial
came back 47% failures, and 18 of those 19 failures were explained by contrast
below 3:1 alone — exactly what the shipped heuristic already catches. A model
trained on that would have rediscovered the threshold and stopped. The bands at
or below 3:1 are now sampled thinly and the budget goes above it, where shape,
logo coverage, quiet zone and density decide the outcome.

**Gradient ends drawn at random made "gradient" mean "broken".** Two thirds of
all gradients ended up pale, which would have taught a rule real designs do not
obey. Ends are now drawn within a colour family, with a minority still drawn
freely — a gradient that fades into the background is a real failure the app's
foreground-versus-background check cannot see.

The finished 5,000-design set runs 40.1% failures, with 894 designs penalised
for being light-on-dark and none unencodable.

## Stage 3 — results

```bash
tools/scanlab/train/.venv/bin/python tools/scanlab/train/train.py
```

Trained on 5,000 designs, 1,250 held out for test.

### Against the shipped heuristic

Judged at the heuristic's _own_ false-alarm rate. Any classifier can catch more
failures by crying wolf more often, and a warning that fires on good designs is
worse than useless, so matching the false-alarm budget is the only fair
comparison.

| model                           | failures caught | false alarms | AUC   |
| ------------------------------- | --------------- | ------------ | ----- |
| shipped heuristic (`ratio < 3`) | 36.1%           | 5.1%         | —     |
| logistic regression             | 37.6%           | 5.1%         | 0.791 |
| gradient boosting               | **57.6%**       | 5.1%         | 0.895 |
| MLP (24, 12)                    | 55.6%           | 5.1%         | 0.887 |
| MLP, contrast features only     | 34.7%           | 5.1%         | 0.655 |

Five-fold AUC: gradient boosting 0.914 ± 0.011, MLP 0.896 ± 0.011. The tight
spread says these are stable, not one lucky split.

### Did it just relearn contrast?

No, and this is the result worth defending. Trained on contrast features alone
the model reaches 0.655 AUC and catches 34.7% of failures — slightly _worse_
than the two-line rule it was meant to replace. Adding the design features
takes it to 0.895. Contrast was never the hard part.

### What it actually leans on

Permutation importance, as AUC lost when a feature is shuffled:

| feature                 | drop  |
| ----------------------- | ----- |
| `gradient_min_contrast` | 0.149 |
| `corner_square_square`  | 0.078 |
| `capacity_usage`        | 0.072 |
| `corner_square_dot`     | 0.065 |
| `corner_dot_dot`        | 0.064 |
| `corner_dot_square`     | 0.060 |
| `gradient_end_contrast` | 0.040 |
| `contrast_log`          | 0.033 |

Two things stand out. The strongest single feature is the _weakest end of the
gradient_, which the app does not currently check at all since it compares only
foreground to background. And corner-shape features take four of the top six
places, collectively outweighing contrast by a wide margin. That has a physical
explanation: the finder patterns are what a decoder uses to locate the symbol
at all, so deforming them costs more than dimming the whole code.

Plain `contrast_ratio` does not reach the top ten.

### Why the MLP ships and not the winner

Gradient boosting is the better model and is not the one being deployed.
Pickled it is **1,067 KB** against a 764 KB app — it would more than double the
bundle and break the precache economics that make the offline claim work. The
MLP is ~1,200 weights, **13.8 KB** as rounded JSON, and captures 96% of the
booster's improvement over the heuristic.

That is the trade: two points of catch rate for 98.7% of the size. The MLP also
runs as a forty-line forward pass with no runtime dependency, where shipping the
booster would mean either an ONNX runtime measured in megabytes or a tree walker
to hand-write and test.

### Calibration

Brier score 0.167.

| predicted | actual | n   |
| --------- | ------ | --- |
| 0–20%     | 21%    | 439 |
| 20–40%    | 45%    | 29  |
| 40–60%    | 36%    | 33  |
| 60–80%    | 69%    | 26  |
| 80–100%   | 84%    | 682 |

The extremes are well calibrated and hold 90% of all predictions. The middle
bands are unreliable but thinly populated. The honest conclusion is that the UI
should show **bands** — likely, marginal, unlikely — rather than a precise
percentage the middle of the range cannot support.

### What is not good enough to ship

The distance regressor predicts how far a design reads to within **2.29 rungs**
on average. That is too coarse to tell a user "reads to about two metres", so
the claim is dropped rather than dressed up. The badge stays a decode verdict,
which is what the evidence supports.

## Stage 4 — shipping it

The model is opt-in and off by default. It sits beside the contrast check
rather than replacing it, because it is trained on simulated conditions and one
decoder: the ordering it produces is trustworthy, the absolute rates are not
validated yet, and until Stage 5 says otherwise it has not earned the right to
overrule a rule that has. Showing both also surfaces disagreements on real
designs, which is the cheapest way to find them.

`src/lib/scanModel.ts` is a hand-written forward pass over exported weights.
Three dense layers and ~1,200 weights do not justify a model runtime measured
in megabytes.

### The parity test is the point

`scanModel.test.ts` pins the TypeScript against 24 feature vectors and the
probabilities scikit-learn produced for them, to nine decimal places. Features
already come from one shared module; this closes the other half, so "no
train/serve skew" is something a test fails on rather than an intention.

Getting it to pass turned up two real problems:

- The fixture was first generated from scikit-learn's **full-precision**
  weights rather than the rounded ones that ship, which would have baked a
  permanent ~1e-7 discrepancy into the test and forced a tolerance loose enough
  to hide a genuine bug. It is now generated from the shipped weights.
- **Rounding the scaler was a mistake.** Its terms are divided by, and the
  smallest scale here is 0.049, where six decimal places leaves only five
  significant figures — enough relative error to move a prediction by 5e-5. The
  scaler ships at full precision (72 numbers); only the ~1,200 layer weights
  are rounded, which halves the file. An assertion fails if rounding ever moves
  a prediction by more than 1e-3.

### Cost to the app

Everything the feature needs is behind dynamic imports — weights, encoder,
feature extractor, forward pass. Verified in a real browser rather than
assumed: no model chunk is requested until the toggle is clicked.

| chunk              | size    | when                              |
| ------------------ | ------- | --------------------------------- |
| `scanModel.data`   | 12.3 kB | on opt-in                         |
| `qrcode-generator` | 21.1 kB | on opt-in                         |
| `scanModel`        | 0.8 kB  | on opt-in                         |
| main bundle        | +4.5 kB | always — the toggle has to render |

`qrcode-generator` is pinned to the copy `qr-code-styling` encodes with. npm
first resolved 2.0.4 against the 1.5.2 nested inside the renderer, which would
have meant counting modules with one encoder while drawing with another.

## Stage 5 — real-device validation

```bash
node tools/scanlab/validate.mjs --count 40   # builds the sheet
# print sheet.html at 100%, scan every code, fill in results.csv
node tools/scanlab/score.mjs                 # scores it
```

Everything above came from a simulation. This is the apparatus for checking it
against actual phones, and it is what decides whether the model becomes the
default.

**The selection is the important part.** Forty random designs would mostly
re-measure cases where the two methods already agree, and agreement proves
nothing about which to trust. The sheet is built around disagreements —
designs the model condemns and the rule passes, and the reverse. Whichever way
those scan is the answer. A typical sheet is 35% model-catches, 25%
model-clears, 40% controls.

Two deliberate choices:

- **The sheet carries no predictions.** Knowing what was expected while holding
  the phone is how you talk yourself into a decode that did not happen.
- **A code that fails on any tested phone counts as failed.** The promise the
  app makes is that it will scan, not that it will scan on the reviewer's
  handset.

`score.mjs` also compares the simulated rung against real outcomes. If designs
the harness rated highly fail in the hand, every number upstream of it is
suspect. It is written to be able to return a negative verdict — if the model
loses, it stays in beta, and that is the finding.

## Files

| File             | Role                                                      |
| ---------------- | --------------------------------------------------------- |
| `ladder.mjs`     | The degradation ladder and sweeps. The scientific core.   |
| `page/lab.js`    | Runs in the browser: render, degrade, decode.             |
| `page/entry.ts`  | Re-exports the app's modules into the page.               |
| `runner.mjs`     | Chrome lifecycle, geometry, label summarisation.          |
| `sampler.mjs`    | Draws designs across the space.                           |
| `generate.mjs`   | Writes the labelled dataset.                              |
| `validate.mjs`   | Builds the real-device validation sheet.                  |
| `score.mjs`      | Scores real-device results against both methods.          |
| `cli.mjs`        | The smoke test.                                           |
| `train/train.py` | Trains, evaluates against the heuristic, exports weights. |
