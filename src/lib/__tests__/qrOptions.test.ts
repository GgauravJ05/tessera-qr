import { describe, expect, it } from 'vitest';
import { DEFAULT_STYLE } from '../defaults';
import { fileNameFor, toQrOptions } from '../qrOptions';

describe('toQrOptions', () => {
  it('maps the flat style onto the library option shape', () => {
    const options = toQrOptions('hello', DEFAULT_STYLE, 360);
    expect(options.data).toBe('hello');
    expect(options.width).toBe(360);
    expect(options.height).toBe(360);
    expect(options.qrOptions?.errorCorrectionLevel).toBe('Q');
    expect(options.dotsOptions?.color).toBe(DEFAULT_STYLE.foreground);
    expect(options.dotsOptions?.type).toBe(DEFAULT_STYLE.dotStyle);
  });

  it('omits the gradient unless it is enabled', () => {
    expect(toQrOptions('x', DEFAULT_STYLE, 360).dotsOptions?.gradient).toBeUndefined();
  });

  it('builds a two-stop linear gradient in radians', () => {
    const options = toQrOptions(
      'x',
      { ...DEFAULT_STYLE, useGradient: true, gradientRotation: 180 },
      360,
    );
    const gradient = options.dotsOptions?.gradient;
    expect(gradient?.type).toBe('linear');
    expect(gradient?.rotation).toBeCloseTo(Math.PI, 6);
    expect(gradient?.colorStops).toHaveLength(2);
  });

  it('scales the quiet zone with the render size', () => {
    // 16px of margin on a 1024px export is 8px on a 512px preview.
    const options = toQrOptions('x', { ...DEFAULT_STYLE, size: 1024, margin: 16 }, 512);
    expect(options.margin).toBe(8);
  });

  it('uses a transparent background when requested', () => {
    const options = toQrOptions(
      'x',
      { ...DEFAULT_STYLE, transparentBackground: true },
      360,
    );
    expect(options.backgroundOptions?.color).toBe('transparent');
  });

  it('passes no image when there is no logo', () => {
    expect(toQrOptions('x', DEFAULT_STYLE, 360).image).toBeUndefined();
  });
});

describe('fileNameFor', () => {
  it('stamps the name with the content kind and date', () => {
    expect(fileNameFor('wifi', new Date('2026-03-04T00:00:00Z'))).toBe(
      'tessera-wifi-2026-03-04',
    );
  });
});
