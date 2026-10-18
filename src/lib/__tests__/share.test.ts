import { describe, expect, it } from 'vitest';
import { decodeDesign, encodeDesign, studioLinkFor } from '@/lib/share';
import { DEFAULT_STYLE } from '@/lib/defaults';

describe('design links', () => {
  it('round-trips the shareable style', () => {
    const token = encodeDesign({
      ...DEFAULT_STYLE,
      foreground: '#123456',
      dotStyle: 'dots',
    });
    expect(decodeDesign(token)).toMatchObject({
      foreground: '#123456',
      dotStyle: 'dots',
    });
  });

  it('never carries a logo or the export size', () => {
    const decoded = decodeDesign(
      encodeDesign({ ...DEFAULT_STYLE, logo: 'data:x', size: 4096 }),
    );
    expect(decoded).not.toHaveProperty('logo');
    expect(decoded).not.toHaveProperty('size');
  });

  it('drops values of the wrong type or outside the known set', () => {
    const token = btoa(
      JSON.stringify({
        foreground: 'red',
        dotStyle: 'hearts',
        margin: '9',
        useGradient: true,
      }),
    );
    expect(decodeDesign(token)).toEqual({ useGradient: true });
  });

  it('clamps numbers to the studio’s own ranges', () => {
    const token = btoa(JSON.stringify({ margin: 9000, logoSize: 3 }));
    expect(decodeDesign(token)).toEqual({ margin: 160, logoSize: 0.5 });
  });

  it('rejects a token that is not a design', () => {
    expect(decodeDesign('%%%')).toBeNull();
    expect(decodeDesign(btoa('42'))).toBeNull();
  });

  it('builds a studio link', () => {
    expect(studioLinkFor({ dotStyle: 'square' })).toMatch(/^\/\?design=[\w-]+#studio$/);
  });
});
