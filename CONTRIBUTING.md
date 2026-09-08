# Contributing to Tessera

Thanks for taking an interest. Tessera is a small, deliberately focused
project, and contributions of every size are welcome — a typo fix is as
useful as a feature.

## Ground rules

Tessera has one constraint that is not negotiable, because the whole product
promise rests on it:

> **Nothing the user types may leave their device.**

That means no analytics, no telemetry, no error reporting services, no fonts
or scripts fetched at runtime from a third party that could see a payload, and
no "just this one" API call. A pull request that adds a network dependency to
the encoding path will be declined regardless of how good the feature is. If
you think you have found an exception worth discussing, open an issue first.

The second constraint is that **a QR code that does not scan is a bug**, even
if it looks beautiful. Changes to payload construction, escaping, capacity or
contrast need tests.

## Getting set up

```bash
git clone https://github.com/GgauravJ05/tessera-qr.git
cd tessera-qr
npm install
npm run dev
```

Node 20 or newer.

## Before you open a pull request

Run all four. CI runs the same commands, so this is exactly what will be
checked:

```bash
npm run lint        # oxlint
npm run format      # prettier --write .
npm run typecheck   # tsc -b --noEmit
npm test            # vitest
```

Note that we use **oxlint**, not ESLint. typescript-eslint does not support
TypeScript 7 yet, so it cannot run on this codebase at all.

## Where things live

```
src/lib/        Encoding, validation and contrast logic. No React.
src/hooks/      useQrCode owns the QRCodeStyling instance; useTheme.
src/components/ UI. ui/ holds the primitives.
src/types/      The content and style type model.
```

New logic belongs in `src/lib` wherever it can, because that is where the
tests are aimed and where it stays testable without a DOM.

## The scannability model

`tools/scanlab/` is offline research tooling. It renders designs, degrades them
through simulated camera conditions and decodes them for real, which is where
the training labels come from. It never enters the bundle, and `npm run build`
does not touch it. Its own [README](tools/scanlab/README.md) covers the method
and the results.

```bash
npm run lab:smoke      # six reference designs through the full ladder
npm run lab:generate -- --count 5000 --out data/scans.jsonl
```

Two rules matter if you touch any of it:

- **`FEATURE_NAMES` in `src/lib/scanFeatures.ts` is append-only.** A trained
  model is only weights over those positions, so inserting or reordering a
  feature silently invalidates every model trained against it.
- **Features are extracted once, by a module both sides import.** If you find
  yourself reimplementing feature extraction in the harness, stop — that is
  train/serve skew, and it fails silently rather than loudly. `scanModel.test.ts`
  pins the browser forward pass against scikit-learn's own output; if it fails,
  the model and the app have drifted apart.

Retraining requires Python:

```bash
python3 -m venv tools/scanlab/train/.venv
tools/scanlab/train/.venv/bin/pip install -r tools/scanlab/train/requirements.txt
tools/scanlab/train/.venv/bin/python tools/scanlab/train/train.py
```

That writes `src/lib/scanModel.data.json` and the parity fixture. A change to
the model is only acceptable with the evaluation output that justifies it —
measured against the shipped heuristic at its own false-alarm rate, not at a
threshold that flatters the model.

## Adding a content type

This is the most common feature request, and it touches five files in order:

1. `src/types/qr.ts` — add the kind to `ContentKind` and define its interface,
   then add it to the `QrContent` union.
2. `src/lib/defaults.ts` — add an empty draft to `EMPTY_CONTENT` and a label
   to `CONTENT_LABELS`.
3. `src/lib/payload.ts` — build the encoded string in `buildPayload`. Escape
   whatever the target scheme treats as reserved; look at the WiFi and vCard
   cases first, since getting this wrong truncates payloads silently.
4. `src/lib/validation.ts` — decide what makes a draft `ready`.
5. `src/components/ContentForm.tsx` and `ContentTabs.tsx` — the form and its
   tab icon.

Add tests for steps 3 and 4 in `src/lib/__tests__/`. Then scan the result with
two different phones before opening the PR — an encoder can be self-consistent
and still produce something no real decoder accepts.

## Style

Prettier and oxlint settle formatting and correctness, so there is nothing to
argue about there. Beyond that: match the surrounding code, and write comments
that explain _why_ rather than restating the line below them. The existing
comments are the reference.

Accessibility is not optional. Controls need labels, colour is never the only
signal, and new palette values must clear WCAG AA (4.5:1) against `surface`
and `canvas` in both themes.

## Commits and pull requests

Write commit subjects in the imperative mood — "Add geo content type", not
"Added" or "Adds". Explain in the body what was wrong and why the change fixes
it; the git history is documentation.

Keep a PR to one logical change. If you find an unrelated bug along the way,
that is a second PR.

## Licence

Tessera is licensed under the **GNU AGPL v3**. By contributing you agree that
your contributions are licensed under the same terms. You keep the copyright
in what you write; there is no CLA to sign.
