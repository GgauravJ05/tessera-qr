import { describe, expect, it } from 'vitest';
import {
  assessScannability,
  contrastRatio,
  parseHex,
  relativeLuminance,
} from '../contrast';

describe('parseHex', () => {
  it('parses six-digit hex with and without a hash', () => {
    expect(parseHex('#ff8800')).toEqual({ r: 255, g: 136, b: 0 });
    expect(parseHex('ff8800')).toEqual({ r: 255, g: 136, b: 0 });
  });

  it('expands three-digit shorthand', () => {
    expect(parseHex('#f80')).toEqual({ r: 255, g: 136, b: 0 });
  });

  it('returns null for malformed input', () => {
    expect(parseHex('#gggggg')).toBeNull();
    expect(parseHex('#ff88')).toBeNull();
    expect(parseHex('')).toBeNull();
  });
});

describe('relativeLuminance', () => {
  it('anchors black at 0 and white at 1', () => {
    expect(relativeLuminance({ r: 0, g: 0, b: 0 })).toBe(0);
    expect(relativeLuminance({ r: 255, g: 255, b: 255 })).toBeCloseTo(1, 5);
  });
});

describe('contrastRatio', () => {
  it('returns 21 for black on white', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 1);
  });

  it('returns 1 for identical colours', () => {
    expect(contrastRatio('#4f46e5', '#4f46e5')).toBeCloseTo(1, 5);
  });

  it('is symmetric', () => {
    expect(contrastRatio('#123456', '#fedcba')).toBeCloseTo(
      contrastRatio('#fedcba', '#123456'),
      10,
    );
  });

  it('falls back to 1 when a colour cannot be parsed', () => {
    expect(contrastRatio('not-a-colour', '#ffffff')).toBe(1);
  });
});

describe('assessScannability', () => {
  it('passes classic black on white', () => {
    const report = assessScannability('#000000', '#ffffff');
    expect(report.risk).toBe('ok');
    expect(report.inverted).toBe(false);
    expect(report.messages).toHaveLength(0);
  });

  it('fails a low-contrast pairing', () => {
    const report = assessScannability('#cccccc', '#ffffff');
    expect(report.risk).toBe('fail');
    expect(report.messages.join(' ')).toMatch(/too low/i);
  });

  it('warns on a marginal pairing', () => {
    const report = assessScannability('#808080', '#ffffff');
    expect(report.ratio).toBeGreaterThanOrEqual(3);
    expect(report.ratio).toBeLessThan(4.5);
    expect(report.risk).toBe('warn');
  });

  it('warns about inverted codes even when contrast is high', () => {
    const report = assessScannability('#ffffff', '#000000');
    expect(report.inverted).toBe(true);
    expect(report.risk).toBe('warn');
    expect(report.messages.join(' ')).toMatch(/older scanners/i);
  });
});

describe('assessScannability with a gradient', () => {
  it('is unchanged when there is no gradient', () => {
    const plain = assessScannability('#767676', '#ffffff');
    const explicitlyNone = assessScannability('#767676', '#ffffff', undefined);
    expect(explicitlyNone).toEqual(plain);
    expect(plain.gradientIsWeakest).toBe(false);
    expect(plain.ratio).toBeCloseTo(plain.foregroundRatio, 6);
  });

  it('fails a code whose gradient fades into the background', () => {
    // The colour the user picked first is pure black against white — the old
    // check would have called this excellent.
    const report = assessScannability('#000000', '#ffffff', '#f7f7f7');
    expect(report.foregroundRatio).toBeGreaterThan(20);
    expect(report.ratio).toBeLessThan(1.2);
    expect(report.risk).toBe('fail');
    expect(report.gradientIsWeakest).toBe(true);
    expect(report.messages[0]).toMatch(/gradient/i);
  });

  it('warns when only the far end is marginal', () => {
    const report = assessScannability('#000000', '#ffffff', '#8a8a8a');
    expect(report.risk).toBe('warn');
    expect(report.gradientIsWeakest).toBe(true);
    expect(report.messages[0]).toMatch(/far end/i);
  });

  it('reports the weaker end even when that is the foreground', () => {
    const report = assessScannability('#9a9a9a', '#ffffff', '#000000');
    expect(report.gradientIsWeakest).toBe(false);
    expect(report.ratio).toBeCloseTo(report.foregroundRatio, 6);
    expect(report.messages[0]).not.toMatch(/gradient/i);
  });

  it('still passes a gradient that stays dark at both ends', () => {
    const report = assessScannability('#111827', '#ffffff', '#4338ca');
    expect(report.risk).toBe('ok');
    expect(report.messages).toHaveLength(0);
  });
});
