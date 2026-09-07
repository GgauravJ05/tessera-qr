# Security Policy

## Supported versions

Tessera is a static browser application with no backend and no releases to
maintain in parallel. The `main` branch, and whatever is deployed from it, is
what receives fixes.

## Reporting a vulnerability

**Please do not open a public issue for a security problem.**

Report it privately through
[GitHub Security Advisories](https://github.com/GgauravJ05/tessera-qr/security/advisories/new),
or by email to **ggauravj5@gmail.com**.

Please include what you can:

- What the issue is and roughly how severe you think it is
- Steps to reproduce, or a proof of concept
- Affected browser and version, if it is browser-specific

You can expect an acknowledgement within **72 hours** and an assessment within
a week. If the report is valid you will be credited in the fix, unless you
would rather not be.

## What counts as a vulnerability here

Tessera has an unusually small attack surface — no server, no accounts, no
stored data — so the things that matter most are:

- **Any payload leaving the device.** A network request carrying user input,
  in any form, is the most serious class of bug this project can have. Report
  it even if you are not certain.
- **Cross-site scripting**, particularly through content typed into a form or
  an uploaded logo file that reaches the DOM or the rendered SVG.
- **Payload injection** — content that escapes its scheme, so that a crafted
  WiFi SSID or vCard field alters the meaning of the encoded string. Note that
  a _malformed_ payload that simply fails to scan is an ordinary bug, not a
  security issue.
- **Dependency vulnerabilities** that are actually reachable from this code.

## Out of scope

- The fact that a QR code can encode a link to a malicious site. That is what
  QR codes do; the same is true of every generator.
- Anything requiring an attacker to already have control of the user's browser
  or machine.
- Reports from automated scanners with no demonstrated impact on this app.
