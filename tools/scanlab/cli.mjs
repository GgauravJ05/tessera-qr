/**
 * Smoke test for the lab.
 *
 * Runs a handful of designs chosen to span the quality range and prints what
 * the ladder made of each. This is the check that the harness measures
 * something real: the designs are ordered by how well they *should* do, so if
 * the numbers do not fall roughly in that order, the lab is broken and no
 * amount of downstream modelling will fix it.
 */
import { openLab, runDesign, verifyGeometry, DISTANCE_LADDER } from './runner.mjs';

const BASE = {
  size: 1024,
  margin: 16,
  errorCorrection: 'Q',
  foreground: '#111827',
  background: '#ffffff',
  transparentBackground: false,
  useGradient: false,
  gradientTo: '#6366f1',
  gradientRotation: 45,
  dotStyle: 'rounded',
  cornerSquareStyle: 'extra-rounded',
  cornerDotStyle: 'dot',
  logo: null,
  logoSize: 0.32,
  logoMargin: 8,
};

const URL_PAYLOAD = 'https://tessera-qr.vercel.app/';
const VCARD_PAYLOAD = [
  'BEGIN:VCARD',
  'VERSION:3.0',
  'N:Jadhav;Gaurav;;;',
  'FN:Gaurav Jadhav',
  'ORG:Tessera',
  'TITLE:Engineer',
  'TEL;TYPE=CELL:+910000000000',
  'EMAIL:ggauravj5@gmail.com',
  'URL:https://gauravjadhav.vercel.app/',
  'ADR;TYPE=WORK:;;Some reasonably long street address\\, Pune;;;;',
  'END:VCARD',
].join('\n');

/** Ordered best-to-worst by expectation, which is what the run is checking. */
const DESIGNS = [
  {
    name: 'Classic black, square dots',
    payload: URL_PAYLOAD,
    style: {
      ...BASE,
      foreground: '#000000',
      dotStyle: 'square',
      cornerSquareStyle: 'square',
      cornerDotStyle: 'square',
    },
  },
  {
    name: 'Default soft (rounded, near-black)',
    payload: URL_PAYLOAD,
    style: { ...BASE },
  },
  {
    name: 'Dots style, indigo gradient',
    payload: URL_PAYLOAD,
    style: {
      ...BASE,
      foreground: '#4338ca',
      useGradient: true,
      gradientTo: '#7c3aed',
      dotStyle: 'dots',
      cornerSquareStyle: 'dot',
    },
  },
  {
    name: 'Dense vCard payload, EC L',
    payload: VCARD_PAYLOAD,
    style: { ...BASE, errorCorrection: 'L' },
  },
  {
    name: 'Inverted (light on dark)',
    payload: URL_PAYLOAD,
    style: { ...BASE, foreground: '#e2e8f0', background: '#0f172a' },
  },
  {
    name: 'Low contrast (pale lilac on cream)',
    payload: URL_PAYLOAD,
    style: { ...BASE, foreground: '#cdc2f0', background: '#fbf7ec' },
  },
];

function pad(s, n) {
  return String(s).padEnd(n);
}

const run = async () => {
  const lab = await openLab();
  try {
    console.log('\nGeometry self-check');
    console.log('-------------------');
    // The lab drives a single browser page, so every run here is sequential
    // by design; parallelising would interleave renders on one canvas.
    /* oxlint-disable no-await-in-loop */
    for (const payload of [URL_PAYLOAD, VCARD_PAYLOAD]) {
      const g = await verifyGeometry(lab.page, payload, BASE);
      const dotOk = Math.abs(g.measuredDotPx - g.sourceDotPx) <= 0.5;
      const originOk = Math.abs(g.measuredOrigin - g.expectedOrigin) <= 1;
      console.log(
        `  ${pad(`${g.moduleCount} modules @ ${g.renderSize}px`, 26)}` +
          `dot ${pad(`${g.sourceDotPx}/${g.measuredDotPx.toFixed(2)}`, 12)}` +
          `origin ${pad(`${g.expectedOrigin}/${g.measuredOrigin}`, 10)}` +
          `${dotOk && originOk ? 'OK' : 'MISMATCH — ladder units would be wrong'}`,
      );
    }

    console.log('\nLadder results');
    console.log('--------------');
    console.log(
      `  ${pad('design', 36)}${pad('rung', 6)}${pad('min ppm', 9)}` +
        `${pad('strict', 8)}${pad('blur', 7)}${pad('light', 7)}${pad('noise', 7)}jpeg`,
    );

    for (const d of DESIGNS) {
      const started = Date.now();
      const { labels } = await runDesign(lab.page, {
        payload: d.payload,
        style: d.style,
        seed: 42,
      });
      const l = labels;
      console.log(
        `  ${pad(d.name, 36)}${pad(`${l.distanceRung}/${DISTANCE_LADDER.length - 1}`, 6)}` +
          `${pad(l.minPpm ?? 'fail', 9)}${pad(l.strictRung, 8)}` +
          `${pad(l.blurBreak ?? '—', 7)}${pad(l.lightBreak ? l.lightBreak.gamma : '—', 7)}` +
          `${pad(l.noiseBreak ?? '—', 7)}${l.jpegBreak ?? '—'}` +
          `   (${Date.now() - started}ms)`,
      );
    }

    /* oxlint-enable no-await-in-loop */

    console.log(
      '\n  rung    = last distance rung that still decoded (higher is better)\n' +
        '  min ppm = pixels per module at that rung; ~2 is the theoretical floor\n' +
        '  strict  = same walk, decoder forbidden to invert (older scanners)\n' +
        '  blur/light/noise/jpeg = first value that broke it; "—" survived the sweep\n',
    );
  } finally {
    await lab.close();
  }
};

run().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
