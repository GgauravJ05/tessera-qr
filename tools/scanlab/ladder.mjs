/**
 * The degradation ladder.
 *
 * This file is the scientific core of the lab: it defines the simulated
 * conditions a rendered symbol is put through before a real decoder is asked
 * to read it. Everything downstream — the labels, the model, the claims the
 * app makes — inherits its credibility from how honest these numbers are, so
 * each one is expressed in physical units rather than as an opaque constant.
 *
 * Two units matter:
 *
 *   ppm  — pixels per module at the sensor. This is the quantity that actually
 *          encodes viewing distance. A symbol photographed from further away
 *          lands on fewer sensor pixels per module, regardless of how large it
 *          was printed. Expressing distance this way normalises across payload
 *          sizes: a 29-module URL and a 177-module vCard printed the same size
 *          are directly comparable at the same ppm. Nyquist puts the absolute
 *          floor at 2; real decoders want 3-4.
 *
 *   blur in modules — optical and motion blur expressed as a fraction of a
 *          module rather than in pixels, so it stays meaningful as ppm falls.
 *          A fixed pixel blur would be a different physical defect at every
 *          rung, which would make the ladder incomparable across designs.
 */

/**
 * The primary ladder: increasing viewing distance.
 *
 * ppm and blur move together because they are not independent in the physical
 * system — the further away the camera, the fewer pixels per module AND the
 * larger the lens' circle of confusion relative to a module. A small amount of
 * sensor noise and JPEG compression is present at every rung because a real
 * phone scan is never a clean render.
 *
 * The label a design earns is the index of the last rung it still decodes at.
 */
export const DISTANCE_LADDER = [
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

/** Baseline camera realism applied at every rung of the distance ladder. */
export const DISTANCE_BASELINE = {
  gamma: 1.0,
  compress: 1.0,
  noiseSigma: 4,
  jpegQuality: 0.9,
};

/**
 * The conditions the single-axis probes are run at: rung d8, three pixels per
 * module. Holding everything else at a rung most designs still pass isolates
 * the axis under test, so the breaking point measures that defect rather than
 * measuring distance again.
 *
 * Calibrated, not guessed. A first pass ran the probes at 4 px per module and
 * every sweep saturated — almost nothing broke, so the axis carried no signal
 * to learn from. Three is hard enough that defects bite while still being a
 * scan a real person would expect to succeed.
 */
export const PROBE_BASELINE = {
  ppm: 3.0,
  blurModules: 0.2,
  gamma: 1.0,
  compress: 1.0,
  noiseSigma: 4,
  jpegQuality: 0.9,
};

/**
 * Single-axis sweeps. Each runs from benign to severe; the reported breaking
 * point is the first value that fails to decode, which gives the model a
 * continuous-ish target per defect instead of one coarse ordinal.
 */
export const PROBES = {
  /** Optical / motion blur, in modules. */
  blur: {
    param: 'blurModules',
    values: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.85, 1.0, 1.2],
  },

  /**
   * Dim light and glare. Gamma darkens; compress pulls both ends toward mid
   * grey, which is what a washed-out photograph of a glossy print looks like.
   * The pair moves together because they co-occur in the real defect.
   */
  light: {
    param: 'lightStep',
    values: [
      { gamma: 1.0, compress: 1.0 },
      { gamma: 1.3, compress: 0.85 },
      { gamma: 1.6, compress: 0.7 },
      { gamma: 2.0, compress: 0.55 },
      { gamma: 2.4, compress: 0.45 },
      { gamma: 2.8, compress: 0.35 },
      { gamma: 3.2, compress: 0.28 },
      { gamma: 3.6, compress: 0.22 },
    ],
  },

  /** Sensor noise from high ISO in low light, as a sigma in 0-255 units. */
  noise: {
    param: 'noiseSigma',
    values: [0, 10, 20, 30, 40, 55, 70, 90, 110],
  },

  /** Recompression, as happens when a code is screenshotted and messaged on. */
  jpeg: {
    param: 'jpegQuality',
    values: [0.8, 0.6, 0.45, 0.3, 0.2, 0.12, 0.08, 0.05, 0.03],
  },
};

/**
 * Source render resolution. Scaled with the symbol so every design starts at
 * roughly 12 px per module before degradation — enough that the dot and corner
 * shapes are rendered faithfully rather than aliased at source, which would
 * confound a style effect with a rendering artefact.
 */
export function sourceRenderSize(moduleCount) {
  return Math.min(2400, Math.max(800, Math.round(moduleCount * 12)));
}
