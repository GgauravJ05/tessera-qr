import type { Options } from 'qr-code-styling';
import type { QrStyle } from '@/types/qr';

/**
 * Translates our style model into qr-code-styling's option shape. Kept as a
 * pure function so the mapping can be tested without mounting a canvas.
 */
export function toQrOptions(
  payload: string,
  style: QrStyle,
  renderSize: number,
): Options {
  const gradient = style.useGradient
    ? {
        type: 'linear' as const,
        rotation: (style.gradientRotation * Math.PI) / 180,
        colorStops: [
          { offset: 0, color: style.foreground },
          { offset: 1, color: style.gradientTo },
        ],
      }
    : undefined;

  return {
    width: renderSize,
    height: renderSize,
    type: 'canvas',
    data: payload,
    image: style.logo ?? undefined,
    margin: Math.round((style.margin / style.size) * renderSize),
    qrOptions: { errorCorrectionLevel: style.errorCorrection },
    imageOptions: {
      crossOrigin: 'anonymous',
      margin: Math.round((style.logoMargin / style.size) * renderSize),
      imageSize: style.logoSize,
      hideBackgroundDots: true,
    },
    dotsOptions: {
      color: style.foreground,
      ...(gradient ? { gradient } : {}),
      type: style.dotStyle,
    },
    backgroundOptions: {
      color: style.transparentBackground ? 'transparent' : style.background,
    },
    cornersSquareOptions: {
      color: style.foreground,
      ...(gradient ? { gradient } : {}),
      type: style.cornerSquareStyle,
    },
    cornersDotOptions: {
      color: style.useGradient ? style.gradientTo : style.foreground,
      type: style.cornerDotStyle,
    },
  };
}

/** Builds a filesystem-safe download name from the content kind. */
export function fileNameFor(kind: string, date = new Date()): string {
  const stamp = date.toISOString().slice(0, 10);
  return `tessera-${kind}-${stamp}`;
}
