# Tessera

**Craft QR codes worth scanning.**

A QR code studio that runs entirely in the browser. Pick what the code should
do, style it, and take the file — nothing you type is ever sent anywhere, and
the codes are static, so they keep working after this site is gone.

Most free QR generators either wrap your link in a redirect that dies when the
free tier ends, or let you pick colours that look great on screen and fail on
paper. Tessera does neither: it encodes the payload directly into the symbol,
and it checks contrast and capacity while you design.

## Features

**Nine content kinds** — URL, plain text, WiFi credentials, vCard contacts,
email, SMS, phone, geo coordinates and calendar events. Each tab keeps its own
draft, so switching away and back is lossless.

**Live scannability check.** Colour choices are rated against real decoder
behaviour, not WCAG text thresholds: below **3:1** most phone cameras fail
outright, and **3–4.5:1** only decodes in good light on a clean print. The
studio also warns when the symbol is lighter than its background, which older
dark-on-light-only scanners cannot read.

**Capacity metering.** The payload is measured in bytes against the real
version-40 byte-mode limit for the selected error correction level (2953 at L
down to 1273 at H), so you find out you have overflowed the symbol _before_ you
export instead of after.

**Design controls.** Dot, corner-square and corner-dot shapes; solid or
gradient foreground; transparent background; a centre logo with adjustable size
and quiet margin; and error correction from L to H.

**Export** to PNG, SVG, JPEG or WebP at up to 4096 px, or copy the PNG straight
to the clipboard. Exports re-render at full output resolution rather than
upscaling the preview.

**Correct payload escaping.** Reserved characters are escaped per scheme — a
WiFi password containing `;` or `:`, or a vCard field containing a comma, would
silently truncate the payload in a naive generator.

## Tech

React 19 · TypeScript 7 · Vite 8 · Tailwind CSS v4 · `qr-code-styling` ·
Vitest + Testing Library · oxlint · Prettier

No backend, no analytics, no network calls at runtime. Encoding and rendering
happen on the device.

## Getting started

```bash
npm install
npm run dev
```

Then open the URL Vite prints (usually http://localhost:5173).

## Scripts

| Script               | What it does                       |
| -------------------- | ---------------------------------- |
| `npm run dev`        | Start the dev server               |
| `npm run build`      | Typecheck, then build to `dist/`   |
| `npm run preview`    | Serve the production build locally |
| `npm test`           | Run the test suite once            |
| `npm run test:watch` | Run tests in watch mode            |
| `npm run coverage`   | Test suite with a coverage report  |
| `npm run typecheck`  | Typecheck without emitting         |
| `npm run lint`       | Lint with oxlint                   |
| `npm run format`     | Format with Prettier               |

## Project structure

```
src/
  components/     UI — studio panels, marketing sections, ui/ primitives
  hooks/          useQrCode (owns the QRCodeStyling instance), useTheme
  lib/
    payload.ts    Builds the encoded string per content kind, with escaping
    validation.ts Field validation and byte-capacity assessment
    contrast.ts   WCAG luminance maths and the scannability rating
    qrOptions.ts  Maps app style state onto qr-code-styling options
    defaults.ts   Empty drafts and the default style
  types/qr.ts     The content and style type model
```

The encoding logic lives in `src/lib` with no React dependency, which is where
the test suite is aimed — 77 tests covering payload construction, escaping,
validation and the contrast maths.

## Testing

```bash
npm test
```

## Notes on printing

Print at 2 cm or larger, keep the quiet margin, and test with two different
phones before committing to a large run. Raising error correction to Q or H
buys tolerance for a centre logo or for wear on physical media, at the cost of
a denser symbol.

## Licence

MIT
