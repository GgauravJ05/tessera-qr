import type { ErrorCorrectionLevel } from '@/types/qr';

/**
 * The scanlab distance ladder, as the app uses it.
 *
 * These are the same rungs `tools/scanlab/ladder.mjs` labels its dataset with,
 * and a test pins the two together: the distance proof on the page is only
 * worth showing if it degrades a symbol the way the lab did when it measured
 * what breaks. See that file for why each unit is what it is.
 *
 *   ppm         — pixels per module at the sensor; falls as the camera moves away.
 *   blurModules — lens blur as a fraction of one module, so it stays physical
 *                 as ppm falls.
 */
export interface LadderRung {
  name: string;
  ppm: number;
  blurModules: number;
}

export const DISTANCE_LADDER: readonly LadderRung[] = [
  { name: 'd0', ppm: 10.0, blurModules: 0.05 },
  { name: 'd1', ppm: 8.0, blurModules: 0.07 },
  { name: 'd2', ppm: 6.0, blurModules: 0.09 },
  { name: 'd3', ppm: 5.0, blurModules: 0.11 },
  { name: 'd4', ppm: 4.5, blurModules: 0.13 },
  { name: 'd5', ppm: 4.0, blurModules: 0.15 },
  { name: 'd6', ppm: 3.6, blurModules: 0.17 },
  { name: 'd7', ppm: 3.3, blurModules: 0.19 },
  { name: 'd8', ppm: 3.0, blurModules: 0.22 },
  { name: 'd9', ppm: 2.8, blurModules: 0.25 },
  { name: 'd10', ppm: 2.6, blurModules: 0.28 },
  { name: 'd11', ppm: 2.4, blurModules: 0.32 },
  { name: 'd12', ppm: 2.2, blurModules: 0.36 },
  { name: 'd13', ppm: 2.1, blurModules: 0.4 },
  { name: 'd14', ppm: 2.0, blurModules: 0.44 },
  { name: 'd15', ppm: 1.9, blurModules: 0.48 },
  { name: 'd16', ppm: 1.8, blurModules: 0.53 },
  { name: 'd17', ppm: 1.7, blurModules: 0.58 },
  { name: 'd18', ppm: 1.6, blurModules: 0.64 },
  { name: 'd19', ppm: 1.5, blurModules: 0.7 },
];

/** Baseline camera realism applied at every rung: mild noise, no light loss. */
export const DISTANCE_BASELINE = {
  gamma: 1.0,
  compress: 1.0,
  noiseSigma: 4,
  jpegQuality: 0.9,
} as const;

/** Source render size for a symbol: about 12 px per module, clamped. */
export function sourceRenderSize(moduleCount: number): number {
  return Math.min(2400, Math.max(800, Math.round(moduleCount * 12)));
}

export interface SymbolGeometry {
  moduleCount: number;
  renderSize: number;
  marginPx: number;
  sourceDotPx: number;
}

/** Mirrors the lab runner, so a rung means the same thing in both places. */
export function symbolGeometry(
  moduleCount: number,
  margin: number,
  exportSize: number,
): SymbolGeometry {
  const renderSize = sourceRenderSize(moduleCount);
  const marginPx = Math.round((margin / exportSize) * renderSize);
  const sourceDotPx = Math.floor((renderSize - marginPx * 2) / moduleCount);
  return { moduleCount, renderSize, marginPx, sourceDotPx };
}

/** Quiet zone in modules: the blank border a decoder needs to find the symbol. */
export function quietZoneModules(
  moduleCount: number,
  margin: number,
  exportSize: number,
): number {
  const dot = (exportSize - margin * 2) / moduleCount;
  return dot > 0 ? margin / dot : 0;
}

/** Share of codewords each correction level can rebuild. */
export const EC_RECOVERY: Record<ErrorCorrectionLevel, number> = {
  L: 0.07,
  M: 0.15,
  Q: 0.25,
  H: 0.3,
};

/**
 * The last rung a design decodes at before its first failure, or -1 when it
 * fails at the closest rung. Scoring stops at the first failure, as the lab
 * does: a noise draw can rescue a rung further out, and that is luck.
 */
export function lastPassingRung(trace: readonly boolean[]): number {
  const first = trace.indexOf(false);
  return first === -1 ? trace.length - 1 : first - 1;
}
