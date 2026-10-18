# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

A mixed, general audience. No single segment is primary:

- Small businesses and makers putting codes on paper, such as menus, posters, packaging and event signage. They need a styled code that still scans once printed.
- Designers and developers who want brand-matched, technically correct codes and appreciate the depth of the measurement.
- Individuals with a quick one-off job, such as WiFi for guests, a contact card or a link. For them speed comes first and privacy matters.

For every group, the differentiator is that a code is checked to scan before it leaves the tool.

## Product Purpose

Tessera is a QR code studio that runs entirely in the browser. The visitor picks what the code should do, styles it and exports a print-ready file. Success means the exported code scans in the real world, keeps working indefinitely, and no data left the visitor's device.

## Positioning

Most free generators wrap the link in a redirect that dies when the free tier ends, or let people choose colours that look fine on screen and fail on paper. Tessera does neither:

- It encodes the payload directly into the symbol, so the code is static and never expires.
- It measures scannability while the visitor designs. Contrast is rated at the symbol's weakest point (for example, a gradient's lightest end) rather than at the colour the visitor picked.
- Capacity is metered against the real version-40 byte limits.
- An opt-in neural model, trained on symbols that were actually put through a decoder, rates design risks that a contrast threshold cannot express.

## Operating Context

- The studio flow is: choose the content kind, fill in its form, style the code, check the scannability and capacity readouts, then export or copy.
- Codes end up printed or on screen and are scanned by phone cameras at varying distances and in varying light. The product advises printing at 2 cm or larger and testing with two phones before a large run.
- The site is an installable PWA and works offline once it has been visited.

## Capabilities and Constraints

- **Nine content kinds:** URL, text, WiFi, vCard, email, SMS, phone, geo, calendar event. Each tab keeps its own draft.
- **Styling:** dot, corner-square and corner-dot shapes; solid or gradient foreground; transparent background; centre logo with size and margin; error correction from L to H.
- **Export:** PNG, SVG, JPEG and WebP up to 4096 px, re-rendered at output resolution; copy PNG to the clipboard.
- **Payload escaping:** reserved characters are escaped correctly for each scheme.
- **Hard constraint:** no backend, no analytics, no third-party requests of any kind. Fonts and every dependency are self-hosted or bundled, and after first load the app makes no network request. Any new feature, including leaderboards or challenges, must run on the device.
- **Hard constraint:** works offline through a service worker precache, and the layout must work from 320 px width.
- **Stack:** React 19, TypeScript, Vite, Tailwind v4, `qr-code-styling`, `vite-plugin-pwa`, deployed on Vercel. The `motion` animation library is approved as a bundled dependency.
- **Licence:** AGPL-3.0-only.

## Brand Commitments

- The name **Tessera** is binding.
- The tagline, logo mark and current voice are not binding and may be replaced.

## Evidence on Hand

- **Scan model results from scanlab (simulated conditions, one decoder):** trained on 5,000 decoded symbols. It catches 56% of unscannable designs, against 42% for the strengthened contrast rule, at the same false-alarm rate. Real-phone validation is pending, and that must be stated plainly wherever these numbers appear. See `tools/scanlab/README.md` and `src/lib/scanModel*`.
- **Contrast thresholds used by the product:** below 3:1 most phone cameras fail; 3–4.5:1 decodes only in good light on a clean print.
- **Capacity limits:** 2953 bytes at L down to 1273 bytes at H.
- **Screenshots:** `screenshots/`.
- **Absences:** no testimonials, users, customers, press or usage numbers exist. Do not fabricate any.

## Product Principles

1. **Measure, don't promise.** Every claim about scannability is backed by a check the visitor can see working, and its limits are stated.
2. **Nothing leaves the device.** Privacy is structural, and no feature may trade it away.
3. **The code outlives the site.** Prefer static, durable output over anything that creates dependence.
4. **Catch it before the printer.** Surface failure while the visitor is designing, not after export.

## Accessibility & Inclusion

- WCAG 2.1 AA for the interface.
- Every animation needs a `prefers-reduced-motion` fallback.
- Full keyboard operation of the studio.
