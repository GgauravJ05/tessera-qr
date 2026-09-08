import { describe, expect, it } from 'vitest';
import { DEFAULT_STYLE } from '../defaults';
import { FEATURE_NAMES, extractFeatures, type ScanDesign } from '../scanFeatures';
import type { QrStyle } from '@/types/qr';

const design = (style: Partial<QrStyle> = {}, moduleCount = 29): ScanDesign => ({
  payload: 'https://tessera-qr.vercel.app/',
  style: { ...DEFAULT_STYLE, ...style },
  moduleCount,
});

/** Reads one feature by name, so tests do not hard-code positions. */
const feature = (d: ScanDesign, name: string): number => {
  const index = FEATURE_NAMES.indexOf(name as (typeof FEATURE_NAMES)[number]);
  expect(index, `unknown feature: ${name}`).toBeGreaterThanOrEqual(0);
  return extractFeatures(d)[index]!;
};

describe('extractFeatures', () => {
  it('emits exactly one value per declared feature name', () => {
    // The model is only weights over these positions, so a length mismatch
    // means every trained model is reading the wrong columns.
    expect(extractFeatures(design())).toHaveLength(FEATURE_NAMES.length);
  });

  it('emits no NaN or infinite values for a default design', () => {
    for (const value of extractFeatures(design())) {
      expect(Number.isFinite(value)).toBe(true);
    }
  });

  it('flags a code that is lighter than its background', () => {
    expect(
      feature(design({ foreground: '#111827', background: '#ffffff' }), 'inverted'),
    ).toBe(0);
    expect(
      feature(design({ foreground: '#e2e8f0', background: '#0f172a' }), 'inverted'),
    ).toBe(1);
  });

  it('treats a transparent background as the white it will be printed on', () => {
    const transparent = design({ transparentBackground: true, background: '#000000' });
    const white = design({ background: '#ffffff' });
    expect(feature(transparent, 'contrast_ratio')).toBeCloseTo(
      feature(white, 'contrast_ratio'),
      6,
    );
  });

  it('scores a gradient by its weakest end, not its average', () => {
    // A gradient running to near-white starves the modules at that end however
    // strong the other end is.
    const d = design({
      foreground: '#000000',
      background: '#ffffff',
      useGradient: true,
      gradientTo: '#f5f5f5',
    });
    expect(feature(d, 'contrast_ratio')).toBeGreaterThan(20);
    expect(feature(d, 'gradient_end_contrast')).toBeLessThan(1.2);
    expect(feature(d, 'gradient_min_contrast')).toBeCloseTo(
      feature(d, 'gradient_end_contrast'),
      6,
    );
  });

  it('falls back to the foreground contrast when there is no gradient', () => {
    const d = design({ useGradient: false });
    expect(feature(d, 'gradient_min_contrast')).toBeCloseTo(
      feature(d, 'contrast_ratio'),
      6,
    );
    expect(feature(d, 'gradient_rot_sin')).toBe(0);
    expect(feature(d, 'gradient_rot_cos')).toBe(0);
  });

  it('measures the logo as the area it hides, not its width', () => {
    const d = design({ logo: 'data:image/svg+xml,<svg/>', logoSize: 0.4 });
    expect(feature(d, 'logo_present')).toBe(1);
    expect(feature(d, 'logo_area_fraction')).toBeCloseTo(0.16, 6);
  });

  it('reports zero logo area when there is no logo', () => {
    const d = design({ logo: null, logoSize: 0.4 });
    expect(feature(d, 'logo_present')).toBe(0);
    expect(feature(d, 'logo_area_fraction')).toBe(0);
    expect(feature(d, 'logo_margin_modules')).toBe(0);
  });

  it('expresses the quiet zone in modules so symbol sizes stay comparable', () => {
    // Same margin ratio at twice the size is the same number of modules.
    const small = feature(design({ size: 512, margin: 16 }), 'margin_modules');
    const large = feature(design({ size: 1024, margin: 32 }), 'margin_modules');
    expect(small).toBeCloseTo(large, 6);
  });

  it('shrinks the quiet zone in modules as the symbol grows denser', () => {
    const sparse = feature(design({}, 29), 'margin_modules');
    const dense = feature(design({}, 177), 'margin_modules');
    expect(dense).toBeGreaterThan(sparse);
  });

  it('measures capacity against the limit for the chosen correction level', () => {
    const atL = feature(design({ errorCorrection: 'L' }), 'capacity_usage');
    const atH = feature(design({ errorCorrection: 'H' }), 'capacity_usage');
    // Capacity more than halves from L to H, so the same payload uses more of it.
    expect(atH).toBeGreaterThan(atL * 2);
  });

  it('orders error correction levels and their recovery fractions together', () => {
    expect(feature(design({ errorCorrection: 'L' }), 'ec_level')).toBe(0);
    expect(feature(design({ errorCorrection: 'H' }), 'ec_level')).toBe(3);
    expect(feature(design({ errorCorrection: 'H' }), 'ec_recovery')).toBeCloseTo(0.3, 6);
  });

  it('one-hot encodes each shape group exactly once', () => {
    const values = extractFeatures(design({ dotStyle: 'classy' }));
    const groupSum = (prefix: string) =>
      FEATURE_NAMES.reduce(
        (total, name, i) => (name.startsWith(prefix) ? total + values[i]! : total),
        0,
      );
    expect(groupSum('dot_')).toBe(1);
    expect(groupSum('corner_square_')).toBe(1);
    expect(groupSum('corner_dot_')).toBe(1);
  });

  it('separates designs that differ only in dot shape', () => {
    // This is the whole premise: the harness measures a two-rung difference
    // between these at identical contrast, so the vector must distinguish them.
    const square = extractFeatures(design({ dotStyle: 'square' }));
    const dots = extractFeatures(design({ dotStyle: 'dots' }));
    expect(square).not.toEqual(dots);
  });

  it('survives an unparseable colour rather than emitting NaN', () => {
    const d = design({ foreground: 'not-a-colour' });
    for (const value of extractFeatures(d)) {
      expect(Number.isFinite(value)).toBe(true);
    }
  });
});
