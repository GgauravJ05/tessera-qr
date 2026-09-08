/**
 * Samples the design space.
 *
 * The sampler decides what the model can learn. Sampling colours uniformly at
 * random would be a mistake: most random pairs land at high contrast, so the
 * dataset would be overwhelmingly easy examples with almost nothing near the
 * boundary where the decision actually gets made. Instead colours are drawn to
 * spread evenly across contrast, and light-on-dark is sampled deliberately
 * rather than left to chance.
 */

/** Deterministic PRNG, so an entire dataset is reproducible from one seed. */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pick = (rng, list) => list[Math.floor(rng() * list.length)];
const range = (rng, lo, hi) => lo + rng() * (hi - lo);
const intRange = (rng, lo, hi) => Math.floor(range(rng, lo, hi + 1));

const DOT_STYLES = [
  'square',
  'dots',
  'rounded',
  'classy',
  'classy-rounded',
  'extra-rounded',
];
const CORNER_SQUARE_STYLES = ['square', 'dot', 'extra-rounded'];
const CORNER_DOT_STYLES = ['square', 'dot'];
const EC_LEVELS = ['L', 'M', 'Q', 'H'];

function hslToHex(h, s, l) {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const [r, g, b] =
    h < 60
      ? [c, x, 0]
      : h < 120
        ? [x, c, 0]
        : h < 180
          ? [0, c, x]
          : h < 240
            ? [0, x, c]
            : h < 300
              ? [x, 0, c]
              : [c, 0, x];
  const to = (v) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, '0');
  return `#${to(r)}${to(g)}${to(b)}`;
}

function luminanceOf(hex) {
  const v = hex.slice(1);
  const ch = (i) => {
    const c = parseInt(v.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * ch(0) + 0.7152 * ch(2) + 0.0722 * ch(4);
}

function hexToHsl(hex) {
  const v = hex.slice(1);
  const r = parseInt(v.slice(0, 2), 16) / 255;
  const g = parseInt(v.slice(2, 4), 16) / 255;
  const b = parseInt(v.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  const l = (max + min) / 2;
  if (delta === 0) return { h: 0, s: 0, l };
  const s = delta / (1 - Math.abs(2 * l - 1));
  let h;
  if (max === r) h = ((g - b) / delta) % 6;
  else if (max === g) h = (b - r) / delta + 2;
  else h = (r - g) / delta + 4;
  return { h: (h * 60 + 360) % 360, s, l };
}

/**
 * Picks the far end of a gradient.
 *
 * Drawing it independently at random was wrong: it put a pale end on two
 * thirds of all gradients, which made "gradient" almost synonymous with
 * "broken" in the dataset and would have taught the model a rule about
 * gradients that real designs do not obey. People choose gradients within a
 * colour family, so that is the default here — with a minority drawn freely,
 * because a gradient that fades into the background is a genuine failure the
 * app's foreground-versus-background check cannot see, and the model should
 * still meet it.
 */
function sampleGradientEnd(rng, foreground) {
  if (rng() < 0.2) {
    return hslToHex(range(rng, 0, 360), range(rng, 0, 1), range(rng, 0.05, 0.95));
  }
  const base = hexToHsl(foreground);
  return hslToHex(
    (base.h + range(rng, -60, 60) + 360) % 360,
    Math.min(1, Math.max(0, base.s + range(rng, -0.25, 0.25))),
    Math.min(0.95, Math.max(0.05, base.l + range(rng, -0.18, 0.18))),
  );
}

function ratioOf(a, b) {
  const la = luminanceOf(a);
  const lb = luminanceOf(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** Bin edges spanning the full contrast range, tighter where decoders fail. */
const CONTRAST_BINS = [1.2, 1.6, 2, 2.5, 3, 3.5, 4, 4.5, 5.5, 7, 9, 12, 16, 21];
const binOf = (ratio) => CONTRAST_BINS.findIndex((edge) => ratio <= edge) + 1;

/**
 * How much of the dataset each contrast band is worth.
 *
 * Flat bins were the obvious first choice and produced a dataset with nothing
 * in it to learn: a 40-design trial came back 47% failures, and 18 of those 19
 * failures were explained by contrast below 3:1 alone — which is precisely
 * what the shipped heuristic already catches. A model trained on that would
 * rediscover the threshold and stop.
 *
 * The value is in designs whose contrast is *adequate* and which fail anyway,
 * because that is where shape, logo coverage, quiet zone and density decide
 * the outcome. So the bands at or below 3:1 are sampled thinly — enough to
 * keep a failure class and to pin down where the boundary really sits — and
 * the bulk of the budget goes above it.
 */
const BIN_WEIGHTS = CONTRAST_BINS.map((edge) => (edge <= 3 ? 1.5 : 4));
const weightOf = (bin) => BIN_WEIGHTS[bin - 1] ?? 1;

function randomPair(rng) {
  // A third of designs are deliberately light-on-dark. Left to chance this
  // case would be rare, and it is the one the app already warns about.
  const inverted = rng() < 0.33;
  const darkL = range(rng, 0.05, 0.45);
  const lightL = range(rng, 0.55, 0.99);
  const dark = hslToHex(range(rng, 0, 360), range(rng, 0, 0.9), darkL);
  const light = hslToHex(range(rng, 0, 360), range(rng, 0, 0.9), lightL);

  // Half the low-contrast cases pair two similar lightnesses, which is how
  // real users produce unscannable codes: a tasteful pastel on cream.
  if (rng() < 0.3) {
    const base = range(rng, 0.3, 0.85);
    const a = hslToHex(range(rng, 0, 360), range(rng, 0.1, 0.8), base);
    const b = hslToHex(
      range(rng, 0, 360),
      range(rng, 0.1, 0.8),
      base + range(rng, -0.2, 0.2),
    );
    return { foreground: a, background: b };
  }

  return inverted
    ? { foreground: light, background: dark }
    : { foreground: dark, background: light };
}

/**
 * Draws a colour pair, biased toward whichever contrast band is furthest below
 * its target share. Best-of-N rather than rejection sampling: it never loops
 * forever on a band that is hard to hit by chance, and it tracks the target
 * distribution closely enough in practice.
 */
function sampleColors(rng, binCounts) {
  let best = null;
  let bestFill = Infinity;
  for (let i = 0; i < 12; i++) {
    const candidate = randomPair(rng);
    const bin = binOf(ratioOf(candidate.foreground, candidate.background));
    // Fill ratio rather than raw count, so a band's share is judged against
    // how much of the dataset it is meant to occupy.
    const fill = (binCounts[bin] ?? 0) / weightOf(bin);
    if (fill < bestFill) {
      best = candidate;
      bestFill = fill;
    }
  }
  const bin = binOf(ratioOf(best.foreground, best.background));
  binCounts[bin] = (binCounts[bin] ?? 0) + 1;
  return best;
}

const WORDS =
  'alpha bravo consectetur delta elementum foxtrot gamma horizon iterate juniper kilo lumen meridian nocturne October pastel quantum ridgeline solstice tessera umbra vector wavelength xenon yarrow zephyr'.split(
    ' ',
  );

const words = (rng, n) => Array.from({ length: n }, () => pick(rng, WORDS)).join(' ');

/**
 * Builds a payload for a content kind, mirroring the schemes `payload.ts`
 * produces. Length is varied widely on purpose: it drives the module count,
 * which is one of the strongest effects on whether a symbol survives.
 */
function samplePayload(rng) {
  const kind = pick(rng, [
    'url',
    'text',
    'wifi',
    'vcard',
    'email',
    'sms',
    'phone',
    'geo',
    'event',
  ]);
  const slug = () =>
    words(rng, intRange(rng, 1, 4))
      .replace(/ /g, '-')
      .toLowerCase();

  switch (kind) {
    case 'url':
      return { kind, payload: `https://${slug()}.example.com/${slug()}` };
    case 'text':
      return { kind, payload: words(rng, intRange(rng, 3, 120)) };
    case 'wifi':
      return {
        kind,
        payload: `WIFI:T:${pick(rng, ['WPA', 'WEP', 'nopass'])};S:${slug()};P:${slug()};;`,
      };
    case 'vcard': {
      const lines = [
        'BEGIN:VCARD',
        'VERSION:3.0',
        `N:${pick(rng, WORDS)};${pick(rng, WORDS)};;;`,
        `FN:${words(rng, 2)}`,
        `ORG:${words(rng, intRange(rng, 1, 5))}`,
        `TITLE:${words(rng, intRange(rng, 1, 4))}`,
        `TEL;TYPE=CELL:+${intRange(rng, 1000000000, 9999999999)}`,
        `EMAIL:${slug()}@example.com`,
        `URL:https://${slug()}.example.com`,
        `ADR;TYPE=WORK:;;${words(rng, intRange(rng, 2, 12))};;;;`,
        'END:VCARD',
      ];
      return { kind, payload: lines.join('\n') };
    }
    case 'email':
      return {
        kind,
        payload: `mailto:${slug()}@example.com?subject=${encodeURIComponent(words(rng, intRange(rng, 1, 8)))}&body=${encodeURIComponent(words(rng, intRange(rng, 2, 60)))}`,
      };
    case 'sms':
      return {
        kind,
        payload: `SMSTO:+${intRange(rng, 1000000000, 9999999999)}:${words(rng, intRange(rng, 1, 30))}`,
      };
    case 'phone':
      return { kind, payload: `tel:+${intRange(rng, 1000000000, 9999999999)}` };
    case 'geo':
      return {
        kind,
        payload: `geo:${range(rng, -90, 90).toFixed(6)},${range(rng, -180, 180).toFixed(6)}`,
      };
    default:
      return {
        kind,
        payload: [
          'BEGIN:VEVENT',
          `SUMMARY:${words(rng, intRange(rng, 1, 8))}`,
          `LOCATION:${words(rng, intRange(rng, 1, 6))}`,
          'DTSTART:20260904T090000',
          'DTEND:20260904T100000',
          'END:VEVENT',
        ].join('\n'),
      };
  }
}

/** A simple opaque shape, which is what a centre logo is to the decoder. */
function sampleLogo(rng) {
  const colour = hslToHex(range(rng, 0, 360), range(rng, 0.2, 1), range(rng, 0.2, 0.8));
  const shape =
    rng() < 0.5
      ? `<circle cx="50" cy="50" r="48" fill="${colour}"/>`
      : `<rect x="4" y="4" width="92" height="92" rx="${intRange(rng, 0, 40)}" fill="${colour}"/>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${shape}</svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

/** Draws one complete design. */
export function sampleDesign(rng, binCounts) {
  const { kind, payload } = samplePayload(rng);
  const { foreground, background } = sampleColors(rng, binCounts);
  const hasLogo = rng() < 0.3;
  const useGradient = rng() < 0.4;

  const size = 1024;
  return {
    kind,
    payload,
    style: {
      size,
      // Quiet zone from generous down to absent. A missing quiet zone is a
      // real failure mode and the app currently says nothing about it.
      margin: Math.round(range(rng, 0, 44)),
      errorCorrection: pick(rng, EC_LEVELS),
      foreground,
      background,
      transparentBackground: rng() < 0.1,
      useGradient,
      gradientTo: useGradient ? sampleGradientEnd(rng, foreground) : foreground,
      gradientRotation: Math.round(range(rng, 0, 360)),
      dotStyle: pick(rng, DOT_STYLES),
      cornerSquareStyle: pick(rng, CORNER_SQUARE_STYLES),
      cornerDotStyle: pick(rng, CORNER_DOT_STYLES),
      logo: hasLogo ? sampleLogo(rng) : null,
      logoSize: hasLogo ? range(rng, 0.1, 0.45) : 0.32,
      logoMargin: hasLogo ? Math.round(range(rng, 0, 24)) : 8,
    },
  };
}
