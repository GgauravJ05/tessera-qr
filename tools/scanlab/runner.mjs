import { fileURLToPath, URL } from 'node:url';
import { chromium } from 'playwright-core';
import qrcode from 'qrcode-generator';
import {
  DISTANCE_LADDER,
  DISTANCE_BASELINE,
  PROBE_BASELINE,
  PROBES,
  sourceRenderSize,
} from './ladder.mjs';

const repoFile = (p) => fileURLToPath(new URL(`../../${p}`, import.meta.url));
const localFile = (p) => fileURLToPath(new URL(p, import.meta.url));

const SCRIPTS = [
  repoFile('node_modules/qr-code-styling/lib/qr-code-styling.js'),
  repoFile('node_modules/jsqr/dist/jsQR.js'),
  localFile('./page/vendor/tessera-lib.js'),
  localFile('./page/lab.js'),
];

/**
 * Computes the symbol's geometry before rendering.
 *
 * The module count comes from qrcode-generator, which is the same encoder
 * qr-code-styling uses internally — it is that library's only dependency — so
 * the count here is the count that will be drawn. The dot size mirrors the
 * renderer's own layout: the margin is taken off both sides and what remains
 * is divided by the module count, floored to whole pixels.
 *
 * `verifyGeometry` in the smoke test checks this against pixels actually
 * measured off a render, because the whole ladder is denominated in modules
 * and a wrong dot size would silently scale every label.
 */
export function geometryFor(payload, style) {
  const qr = qrcode(0, style.errorCorrection);
  qr.addData(payload);
  qr.make();

  const moduleCount = qr.getModuleCount();
  const renderSize = sourceRenderSize(moduleCount);
  const marginPx = Math.round((style.margin / style.size) * renderSize);
  const sourceDotPx = Math.floor((renderSize - marginPx * 2) / moduleCount);

  return { moduleCount, renderSize, marginPx, sourceDotPx };
}

/** Boots Chrome and loads the harness page with the app's own modules in it. */
export async function openLab({ headless = true } = {}) {
  let browser;
  try {
    browser = await chromium.launch({ channel: 'chrome', headless });
  } catch (cause) {
    throw new Error(
      'Could not launch Chrome. The lab drives your installed Google Chrome ' +
        'rather than downloading its own browser.',
      { cause },
    );
  }

  const page = await browser.newPage();
  page.on('pageerror', (err) => console.error('  [page error]', err.message));
  await page.setContent('<!doctype html><meta charset="utf-8"><div id="root"></div>');

  // Sequential by necessity: these share one page and each script depends on
  // globals the previous one defined.
  // oxlint-disable-next-line no-await-in-loop
  for (const path of SCRIPTS) await page.addScriptTag({ path });

  return {
    page,
    async close() {
      await browser.close();
    },
  };
}

/** Puts one design through the full ladder and returns its labels. */
export async function runDesign(page, { payload, style, seed = 1 }) {
  const geometry = geometryFor(payload, style);
  const spec = { payload, style, seed, ...geometry };

  const raw = await page.evaluate(
    ([s, config]) => window.ScanLab.run(s, config),
    [spec, { DISTANCE_LADDER, DISTANCE_BASELINE, PROBE_BASELINE, PROBES }],
  );

  return { geometry, labels: summarise(raw) };
}

/**
 * Turns the raw traces into the values a model will actually be trained on.
 *
 * Breaking points are reported as the physical value at which the design
 * failed, not as an array index, so the numbers stay meaningful if the sweeps
 * are ever re-tuned. A design that survives an entire sweep reports `null`
 * rather than the last value tested — "it never broke" and "it broke at the
 * hardest setting" are different facts and must not be conflated.
 */
function summarise(raw) {
  const breakValue = (name, breakIndex) => {
    const values = PROBES[name].values;
    if (breakIndex >= values.length) return null;
    return values[breakIndex];
  };

  const strictRung = (() => {
    const i = raw.distance.trace.findIndex((v) => !v.strict);
    return i === -1 ? DISTANCE_LADDER.length - 1 : i - 1;
  })();

  return {
    // Primary target: how far the design survives on the distance ladder.
    distanceRung: raw.distance.rung,
    minPpm: raw.distance.rung >= 0 ? DISTANCE_LADDER[raw.distance.rung].ppm : null,

    // The same walk judged by a decoder that refuses to invert, which is what
    // an older dark-on-light-only scanner does.
    strictRung,
    invertPenalty: raw.distance.rung - strictRung,

    // Per-defect breaking points.
    blurBreak: breakValue('blur', raw.probes.blur.breakIndex),
    lightBreak: breakValue('light', raw.probes.light.breakIndex),
    noiseBreak: breakValue('noise', raw.probes.noise.breakIndex),
    jpegBreak: breakValue('jpeg', raw.probes.jpeg.breakIndex),

    // Kept so the scoring choices above can be revisited without re-running.
    trace: {
      distance: raw.distance.trace,
      probes: Object.fromEntries(
        Object.entries(raw.probes).map(([k, v]) => [k, v.breakIndex]),
      ),
    },
  };
}

/**
 * Measures the real dot size off a render and compares it to the computed one.
 *
 * Renders a plain black square-dot symbol and walks the row through the middle
 * of the top-left finder pattern. A finder is exactly 7 modules wide by
 * definition, so the dark run divided by 7 is the true pixels-per-module.
 */
export async function verifyGeometry(page, payload, style) {
  const geometry = geometryFor(payload, style);
  const probeStyle = {
    ...style,
    foreground: '#000000',
    background: '#ffffff',
    transparentBackground: false,
    useGradient: false,
    dotStyle: 'square',
    cornerSquareStyle: 'square',
    cornerDotStyle: 'square',
    logo: null,
  };

  const measured = await page.evaluate(
    async ([p, s, size]) => {
      const qr = new QRCodeStyling(TesseraLib.toQrOptions(p, s, size));
      const bitmap = await createImageBitmap(await qr.getRawData('png'));
      const c = new OffscreenCanvas(bitmap.width, bitmap.height);
      const ctx = c.getContext('2d', { willReadFrequently: true });
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.drawImage(bitmap, 0, 0);

      // Find the symbol without assuming where it starts. The renderer floors
      // the dot size to whole pixels, so the leftover is split as padding and
      // the real quiet zone is wider than the requested margin — an assumed
      // origin silently samples the wrong row on some module counts.
      const full = ctx.getImageData(0, 0, c.width, c.height).data;
      const darkAt = (x, y) => full[(y * c.width + x) * 4] < 128;

      let top = -1;
      for (let y = 0; y < c.height && top === -1; y++) {
        for (let x = 0; x < c.width; x++) {
          if (darkAt(x, y)) {
            top = y;
            break;
          }
        }
      }
      if (top === -1) return { top: -1, left: -1, run: 0 };

      // The topmost dark row is the top edge of the two upper finder patterns,
      // which are solid 7-module bars.
      let left = -1;
      for (let x = 0; x < c.width; x++) {
        if (darkAt(x, top)) {
          left = x;
          break;
        }
      }
      let run = 0;
      for (let x = left; x < c.width && darkAt(x, top); x++) run++;
      return { top, left, run };
    },
    [payload, probeStyle, geometry.renderSize],
  );

  // The renderer centres the floored symbol in the canvas, so the true quiet
  // zone is half the leftover rather than the requested margin.
  const expectedOrigin = Math.round(
    (geometry.renderSize - geometry.sourceDotPx * geometry.moduleCount) / 2,
  );

  return {
    ...geometry,
    expectedOrigin,
    measuredOrigin: measured.left,
    measuredDotPx: measured.run / 7,
  };
}

export { DISTANCE_LADDER, PROBES };
