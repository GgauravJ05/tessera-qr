/**
 * The feature vector a scannability model sees.
 *
 * This lives in `src/lib`, next to the rest of the encoding logic, for one
 * reason: the harness that generates training data and the app that will run
 * the model must extract features *identically*. Train/serve skew is the
 * quietest way to break a deployed model — nothing errors, the numbers just
 * stop meaning what they meant during training. Keeping a single
 * implementation and importing it from both sides makes that failure
 * impossible by construction rather than by discipline.
 *
 * Nothing in the app imports this yet, so it is unreachable from the entry
 * point and adds nothing to the bundle.
 */
import type { ErrorCorrectionLevel, QrStyle } from '@/types/qr';
import { contrastRatio, parseHex, relativeLuminance, type Rgb } from './contrast';
import { BYTE_CAPACITY, payloadBytes } from './validation';

export interface ScanDesign {
  /** The exact string encoded into the symbol. */
  payload: string;
  style: QrStyle;
  /**
   * Modules per side of the symbol, which the encoder decides from the payload
   * and error correction level. Passed in rather than recomputed so callers
   * can reuse a count they already have.
   */
  moduleCount: number;
}

const DOT_STYLES = [
  'square',
  'dots',
  'rounded',
  'classy',
  'classy-rounded',
  'extra-rounded',
] as const;
const CORNER_SQUARE_STYLES = ['square', 'dot', 'extra-rounded'] as const;
const CORNER_DOT_STYLES = ['square', 'dot'] as const;

const EC_ORDER: Record<ErrorCorrectionLevel, number> = { L: 0, M: 1, Q: 2, H: 3 };

/** Fraction of the symbol each level can lose and still reconstruct. */
const EC_RECOVERY: Record<ErrorCorrectionLevel, number> = {
  L: 0.07,
  M: 0.15,
  Q: 0.25,
  H: 0.3,
};

/**
 * Feature names, in the order `extractFeatures` emits them.
 *
 * The order is part of the contract with any trained model: a model is just
 * weights over these positions, so reordering this array silently invalidates
 * every model ever trained against it. Append, never insert.
 */
export const FEATURE_NAMES = [
  'contrast_ratio',
  'contrast_log',
  'fg_luminance',
  'bg_luminance',
  'luminance_delta',
  'inverted',
  'fg_saturation',
  'bg_saturation',
  'hue_delta',
  'ec_level',
  'ec_recovery',
  'payload_bytes',
  'payload_bytes_log',
  'module_count',
  'capacity_usage',
  'margin_modules',
  'transparent_background',
  'gradient',
  'gradient_end_contrast',
  'gradient_min_contrast',
  'gradient_rot_sin',
  'gradient_rot_cos',
  'logo_present',
  'logo_area_fraction',
  'logo_margin_modules',
  ...DOT_STYLES.map((s) => `dot_${s}`),
  ...CORNER_SQUARE_STYLES.map((s) => `corner_square_${s}`),
  ...CORNER_DOT_STYLES.map((s) => `corner_dot_${s}`),
] as const;

/** HSL saturation and hue, on 0..1. Hue is undefined for greys, reported as 0. */
function saturationAndHue(rgb: Rgb): { saturation: number; hue: number } {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  const lightness = (max + min) / 2;

  if (delta === 0) return { saturation: 0, hue: 0 };

  const saturation = delta / (1 - Math.abs(2 * lightness - 1));

  let hue: number;
  if (max === r) hue = ((g - b) / delta) % 6;
  else if (max === g) hue = (b - r) / delta + 2;
  else hue = (r - g) / delta + 4;

  hue = (hue * 60 + 360) % 360;
  return { saturation, hue: hue / 360 };
}

/** Shortest distance between two hues on the colour wheel, on 0..0.5. */
function hueDelta(a: number, b: number): number {
  const raw = Math.abs(a - b);
  return Math.min(raw, 1 - raw);
}

const BLACK: Rgb = { r: 0, g: 0, b: 0 };

/**
 * Turns a design into the fixed-length numeric vector a model is trained on.
 *
 * Two choices worth noting. Contrast appears both raw and logged, because
 * decoder tolerance falls off sharply at the low end and slowly at the high
 * end — the log makes that shape learnable by a linear model. And a gradient
 * contributes its *weakest* contrast rather than its average: a gradient that
 * ends pale starves the modules at that end regardless of how strong the other
 * end is, and averaging would hide exactly the failure worth catching.
 */
export function extractFeatures({ payload, style, moduleCount }: ScanDesign): number[] {
  const fg = parseHex(style.foreground) ?? BLACK;
  const background = style.transparentBackground ? '#ffffff' : style.background;
  const bg = parseHex(background) ?? BLACK;

  const fgLum = relativeLuminance(fg);
  const bgLum = relativeLuminance(bg);
  const ratio = contrastRatio(style.foreground, background);

  const fgHsl = saturationAndHue(fg);
  const bgHsl = saturationAndHue(bg);

  const bytes = payloadBytes(payload);
  const limit = BYTE_CAPACITY[style.errorCorrection];

  // The renderer floors the dot size to whole pixels, which is also how the
  // quiet zone ends up wider than requested. Expressing both margins in
  // modules keeps them comparable across symbol sizes.
  const dotPx = Math.max(1, (style.size - style.margin * 2) / moduleCount);

  const endContrast = style.useGradient
    ? contrastRatio(style.gradientTo, background)
    : ratio;
  const rotation = (style.gradientRotation * Math.PI) / 180;

  return [
    ratio,
    Math.log(ratio),
    fgLum,
    bgLum,
    bgLum - fgLum,
    fgLum > bgLum ? 1 : 0,
    fgHsl.saturation,
    bgHsl.saturation,
    hueDelta(fgHsl.hue, bgHsl.hue),
    EC_ORDER[style.errorCorrection],
    EC_RECOVERY[style.errorCorrection],
    bytes,
    Math.log1p(bytes),
    moduleCount,
    bytes / limit,
    style.margin / dotPx,
    style.transparentBackground ? 1 : 0,
    style.useGradient ? 1 : 0,
    endContrast,
    Math.min(ratio, endContrast),
    style.useGradient ? Math.sin(rotation) : 0,
    style.useGradient ? Math.cos(rotation) : 0,
    style.logo ? 1 : 0,
    // imageSize is a fraction of the symbol's width, so the area it hides —
    // which is what error correction has to reconstruct — goes as the square.
    style.logo ? style.logoSize ** 2 : 0,
    style.logo ? style.logoMargin / dotPx : 0,
    ...DOT_STYLES.map((s) => (style.dotStyle === s ? 1 : 0)),
    ...CORNER_SQUARE_STYLES.map((s) => (style.cornerSquareStyle === s ? 1 : 0)),
    ...CORNER_DOT_STYLES.map((s) => (style.cornerDotStyle === s ? 1 : 0)),
  ];
}
