import { describe, expect, it } from 'vitest';
import { DEFAULT_STYLE } from '@/lib/defaults';
import { boldness, rankOf, scoreDesign, totalBoldness } from '@/lib/challenge';
import type { QrStyle } from '@/types/qr';

const plain: QrStyle = {
  ...DEFAULT_STYLE,
  foreground: '#000000',
  background: '#ffffff',
  useGradient: false,
  dotStyle: 'square',
  cornerSquareStyle: 'square',
  cornerDotStyle: 'square',
};

describe('break-it scoring', () => {
  it('gives a plain black square no boldness at all', () => {
    expect(totalBoldness(boldness(plain))).toBe(0);
  });

  it('rewards lower contrast, gradients and softer shapes', () => {
    const bold = totalBoldness(
      boldness({
        ...plain,
        foreground: '#4338ca',
        useGradient: true,
        gradientTo: '#7c3aed',
        dotStyle: 'dots',
        cornerSquareStyle: 'dot',
        cornerDotStyle: 'dot',
      }),
    );
    expect(bold).toBeGreaterThan(30);
  });

  it('scores nothing for a design that does not decode', () => {
    expect(scoreDesign({ ...plain, dotStyle: 'dots' }, -1)).toMatchObject({
      reach: 0,
      score: 0,
      rank: 'Broken',
    });
  });

  it('multiplies boldness by reach', () => {
    const result = scoreDesign({ ...plain, dotStyle: 'dots' }, 9);
    expect(result.reach).toBe(10);
    expect(result.score).toBe(result.boldness * 10);
  });

  it('ranks by both axes, never by boldness alone', () => {
    expect(rankOf(80, 3)).toBe('Readable');
    expect(rankOf(20, 12)).toBe('Robust');
    expect(rankOf(35, 16)).toBe('Bulletproof');
    expect(rankOf(0, 20)).toBe('Readable');
  });
});
