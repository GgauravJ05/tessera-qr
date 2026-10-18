import type { QrStyle } from '@/types/qr';
import { toQrOptions } from '@/lib/qrOptions';
import {
  DISTANCE_BASELINE,
  DISTANCE_LADDER,
  lastPassingRung,
  symbolGeometry,
} from '@/lib/ladder';
import type { LadderRung, SymbolGeometry } from '@/lib/ladder';

/**
 * The scanlab capture, run in the visitor's browser.
 *
 * A port of `tools/scanlab/page/lab.js`, in the same order the lab applies
 * its conditions: blur at source scale, resample to the sensor, then noise and
 * recompression. The decoder is jsQR, the same one the dataset was labelled
 * with. Everything here is loaded on demand and runs on the device; nothing
 * is sent anywhere.
 */

type Canvas2D = OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D;
type AnyCanvas = OffscreenCanvas | HTMLCanvasElement;

function makeCanvas(size: number): { canvas: AnyCanvas; ctx: Canvas2D } {
  const canvas: AnyCanvas =
    typeof OffscreenCanvas !== 'undefined'
      ? new OffscreenCanvas(size, size)
      : Object.assign(document.createElement('canvas'), { width: size, height: size });
  const ctx = canvas.getContext('2d', { willReadFrequently: true }) as Canvas2D | null;
  if (!ctx) throw new Error('Canvas 2D is not available.');
  return { canvas, ctx };
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gaussian(rng: () => number) {
  let u = 0;
  let v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/** Counts modules with the encoder the renderer itself uses. */
export async function moduleCountFor(
  payload: string,
  style: QrStyle,
): Promise<number | null> {
  try {
    const { default: qrcode } = await import('qrcode-generator');
    const qr = qrcode(0, style.errorCorrection);
    qr.addData(payload);
    qr.make();
    return qr.getModuleCount();
  } catch {
    return null;
  }
}

export interface ProofSource {
  bitmap: ImageBitmap;
  geometry: SymbolGeometry;
}

/** Renders the design at the lab's source resolution. */
export async function renderSource(
  payload: string,
  style: QrStyle,
): Promise<ProofSource | null> {
  const moduleCount = await moduleCountFor(payload, style);
  if (!moduleCount) return null;
  const geometry = symbolGeometry(moduleCount, style.margin, style.size);

  const { default: QRCodeStyling } = await import('qr-code-styling');
  const qr = new QRCodeStyling(toQrOptions(payload, style, geometry.renderSize));
  const raw = await qr.getRawData('png');
  if (!raw) return null;
  const blob = raw instanceof Blob ? raw : new Blob([raw as BlobPart]);
  const bitmap = await createImageBitmap(blob);
  return { bitmap, geometry };
}

/** What the camera would have captured at one rung. */
export async function capture(
  source: ProofSource,
  rung: LadderRung,
  seed: number,
): Promise<ImageData> {
  const { bitmap, geometry } = source;
  const size = bitmap.width;
  const blurPx = rung.blurModules * geometry.sourceDotPx;

  // Optical blur, at source scale. A transparent background is whatever the
  // code was printed on in the real world, which is white in almost every
  // case that matters.
  let stage: AnyCanvas | ImageBitmap = bitmap;
  if (blurPx > 0.01) {
    const blur = makeCanvas(size);
    blur.ctx.fillStyle = '#ffffff';
    blur.ctx.fillRect(0, 0, size, size);
    blur.ctx.filter = `blur(${blurPx}px)`;
    blur.ctx.drawImage(bitmap, 0, 0);
    blur.ctx.filter = 'none';
    stage = blur.canvas;
  }

  // Sensor sampling.
  const target = Math.max(21, Math.round((rung.ppm / geometry.sourceDotPx) * size));
  const sensor = makeCanvas(target);
  sensor.ctx.fillStyle = '#ffffff';
  sensor.ctx.fillRect(0, 0, target, target);
  sensor.ctx.drawImage(stage, 0, 0, target, target);
  const img = sensor.ctx.getImageData(0, 0, target, target);

  // Sensor noise. Gamma and compression stay at the baseline's identity.
  const rng = mulberry32(seed);
  const d = img.data;
  const sigma = DISTANCE_BASELINE.noiseSigma;
  for (let i = 0; i < d.length; i += 4) {
    const n = gaussian(rng) * sigma;
    d[i] = d[i]! + n;
    d[i + 1] = d[i + 1]! + n;
    d[i + 2] = d[i + 2]! + n;
  }

  // Recompression, as a phone's pipeline applies it after capture.
  if ('convertToBlob' in sensor.canvas) {
    sensor.ctx.putImageData(img, 0, 0);
    const blob = await sensor.canvas.convertToBlob({
      type: 'image/jpeg',
      quality: DISTANCE_BASELINE.jpegQuality,
    });
    const bm = await createImageBitmap(blob);
    sensor.ctx.drawImage(bm, 0, 0);
    bm.close();
    return sensor.ctx.getImageData(0, 0, target, target);
  }
  return img;
}

type JsQr = typeof import('jsqr').default;
let decoder: Promise<JsQr> | null = null;
const loadDecoder = () => (decoder ??= import('jsqr').then((m) => m.default));

/**
 * Asks the decoder to read a capture. A read that returns the wrong string
 * counts as a failure: a symbol that confidently reads as something else is
 * worse than one that does not read at all.
 */
export async function decodes(img: ImageData, payload: string): Promise<boolean> {
  const jsQR = await loadDecoder();
  const hit = jsQR(img.data, img.width, img.height, { inversionAttempts: 'attemptBoth' });
  return hit != null && hit.data === payload;
}

export interface LadderResult {
  trace: boolean[];
  /** Last rung read before the first failure; -1 if the closest rung fails. */
  rung: number;
  moduleCount: number;
}

/**
 * Walks the full ladder. Yields between rungs so a long walk never blocks
 * typing, and stops early when `signal` aborts because the design changed.
 */
export async function walkLadder(
  payload: string,
  style: QrStyle,
  signal?: AbortSignal,
): Promise<LadderResult | null> {
  const source = await renderSource(payload, style);
  if (!source) return null;
  try {
    const trace: boolean[] = [];
    for (let i = 0; i < DISTANCE_LADDER.length; i++) {
      if (signal?.aborted) return null;
      // oxlint-disable-next-line no-await-in-loop
      const img = await capture(source, DISTANCE_LADDER[i]!, 1 + i * 7919);
      // oxlint-disable-next-line no-await-in-loop
      trace.push(await decodes(img, payload));
      // oxlint-disable-next-line no-await-in-loop
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
    return {
      trace,
      rung: lastPassingRung(trace),
      moduleCount: source.geometry.moduleCount,
    };
  } finally {
    source.bitmap.close();
  }
}
