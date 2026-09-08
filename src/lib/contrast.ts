/**
 * Scannability checks. A QR code that looks beautiful but has a 1.8:1 contrast
 * ratio is a broken QR code, so the studio validates colour choices instead of
 * letting users discover the problem after printing 500 flyers.
 */

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

/** Parses #rgb, #rrggbb (with or without the hash). Returns null if unparseable. */
export function parseHex(hex: string): Rgb | null {
  const value = hex.trim().replace(/^#/, '');
  if (!/^[0-9a-f]+$/i.test(value)) return null;

  if (value.length === 3) {
    const [r, g, b] = value;
    return {
      r: parseInt(r! + r!, 16),
      g: parseInt(g! + g!, 16),
      b: parseInt(b! + b!, 16),
    };
  }
  if (value.length === 6) {
    return {
      r: parseInt(value.slice(0, 2), 16),
      g: parseInt(value.slice(2, 4), 16),
      b: parseInt(value.slice(4, 6), 16),
    };
  }
  return null;
}

/** WCAG 2.1 relative luminance, 0 (black) to 1 (white). */
export function relativeLuminance({ r, g, b }: Rgb): number {
  const channel = (raw: number) => {
    const c = raw / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** WCAG contrast ratio between two colours, from 1 (identical) to 21. */
export function contrastRatio(a: string, b: string): number {
  const rgbA = parseHex(a);
  const rgbB = parseHex(b);
  if (!rgbA || !rgbB) return 1;

  const lumA = relativeLuminance(rgbA);
  const lumB = relativeLuminance(rgbB);
  const lighter = Math.max(lumA, lumB);
  const darker = Math.min(lumA, lumB);
  return (lighter + 0.05) / (darker + 0.05);
}

export type ScanRisk = 'ok' | 'warn' | 'fail';

export interface ScannabilityReport {
  /**
   * Contrast at the symbol's weakest point. For a gradient this is the paler
   * of the two ends, not an average: modules at the weak end have to survive
   * on their own, and averaging would hide exactly the failure worth catching.
   */
  ratio: number;
  /** Contrast of the foreground alone, before the gradient is considered. */
  foregroundRatio: number;
  risk: ScanRisk;
  inverted: boolean;
  /** True when the gradient's far end is the weaker of the two. */
  gradientIsWeakest: boolean;
  messages: string[];
}

/**
 * Rated against real decoder behaviour rather than WCAG text thresholds:
 * below 3:1 most phone cameras fail outright, and 3–4.5:1 only decodes in
 * good light on a clean print.
 */
export const CONTRAST_FAIL_BELOW = 3;
export const CONTRAST_WARN_BELOW = 4.5;

/**
 * `gradientTo` is the far end of a gradient foreground, when there is one.
 *
 * It matters more than the foreground does. Measuring scannability only at the
 * foreground colour misses the most common way a styled code fails: a gradient
 * that starts strong and fades into the background leaves the modules at that
 * end with nothing to stand on, while the colour the user picked first still
 * looks perfectly safe.
 *
 * The thresholds below are unchanged and are applied to whichever end is
 * weaker, so a code without a gradient is assessed exactly as before.
 */
export function assessScannability(
  foreground: string,
  background: string,
  gradientTo?: string,
): ScannabilityReport {
  const foregroundRatio = contrastRatio(foreground, background);
  const endRatio =
    gradientTo === undefined ? foregroundRatio : contrastRatio(gradientTo, background);

  const ratio = Math.min(foregroundRatio, endRatio);
  const gradientIsWeakest = endRatio < foregroundRatio;

  const fg = parseHex(foreground);
  const bg = parseHex(background);
  const inverted =
    fg !== null && bg !== null && relativeLuminance(fg) > relativeLuminance(bg);

  const messages: string[] = [];
  let risk: ScanRisk = 'ok';

  if (ratio < CONTRAST_FAIL_BELOW) {
    risk = 'fail';
    messages.push(
      gradientIsWeakest
        ? 'The far end of the gradient fades into the background, so those modules will not decode. Darken the second colour.'
        : 'Contrast is too low for most cameras to decode. Darken the foreground or lighten the background.',
    );
  } else if (ratio < CONTRAST_WARN_BELOW) {
    risk = 'warn';
    messages.push(
      gradientIsWeakest
        ? 'The far end of the gradient is marginal. That end may fail in low light or on textured paper.'
        : 'Contrast is marginal. This may fail in low light or on textured paper.',
    );
  }

  if (inverted) {
    if (risk === 'ok') risk = 'warn';
    messages.push(
      'The code is lighter than its background. Some older scanners only read dark-on-light.',
    );
  }

  return { ratio, foregroundRatio, risk, inverted, gradientIsWeakest, messages };
}
