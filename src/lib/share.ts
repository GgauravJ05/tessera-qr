import type { QrStyle } from '@/types/qr';
import { DEFAULT_STYLE } from '@/lib/defaults';

/**
 * A design carried in a link, so the proof wall and the challenge can hand a
 * design to the studio. Only the style travels, never content: a link that
 * carried a WiFi password would be a leak with a share button.
 *
 * Decoding is defensive. A link is untrusted input, so anything that is not a
 * known style key with the right type is dropped rather than applied.
 */
const SHAREABLE: (keyof QrStyle)[] = [
  'errorCorrection',
  'foreground',
  'background',
  'transparentBackground',
  'useGradient',
  'gradientTo',
  'gradientRotation',
  'dotStyle',
  'cornerSquareStyle',
  'cornerDotStyle',
  'logoSize',
  'margin',
];

const ENUMS: Partial<Record<keyof QrStyle, readonly string[]>> = {
  errorCorrection: ['L', 'M', 'Q', 'H'],
  dotStyle: ['square', 'dots', 'rounded', 'classy', 'classy-rounded', 'extra-rounded'],
  cornerSquareStyle: ['square', 'dot', 'extra-rounded'],
  cornerDotStyle: ['square', 'dot'],
};

const HEX = /^#[0-9a-f]{6}$/i;

export function encodeDesign(style: Partial<QrStyle>): string {
  const subset: Record<string, unknown> = {};
  for (const key of SHAREABLE) if (style[key] !== undefined) subset[key] = style[key];
  return btoa(JSON.stringify(subset))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export function decodeDesign(token: string): Partial<QrStyle> | null {
  let raw: unknown;
  try {
    raw = JSON.parse(atob(token.replace(/-/g, '+').replace(/_/g, '/')));
  } catch {
    return null;
  }
  if (!raw || typeof raw !== 'object') return null;

  const out: Record<string, unknown> = {};
  for (const key of SHAREABLE) {
    const value = (raw as Record<string, unknown>)[key];
    if (value === undefined) continue;
    const expected = typeof DEFAULT_STYLE[key];
    if (typeof value !== expected) continue;
    const allowed = ENUMS[key];
    if (allowed && !allowed.includes(value as string)) continue;
    if (
      ['foreground', 'background', 'gradientTo'].includes(key) &&
      !HEX.test(value as string)
    ) {
      continue;
    }
    if (typeof value === 'number' && !Number.isFinite(value)) continue;
    out[key] = value;
  }
  // Keep numbers inside the ranges the studio's own controls allow.
  if (typeof out.margin === 'number') out.margin = Math.min(160, Math.max(0, out.margin));
  if (typeof out.logoSize === 'number')
    out.logoSize = Math.min(0.5, Math.max(0.1, out.logoSize));
  if (typeof out.gradientRotation === 'number') {
    out.gradientRotation = Math.min(360, Math.max(0, out.gradientRotation));
  }
  return out as Partial<QrStyle>;
}

/** The studio link for a design. */
export function studioLinkFor(style: Partial<QrStyle>): string {
  return `/?design=${encodeDesign(style)}#studio`;
}
