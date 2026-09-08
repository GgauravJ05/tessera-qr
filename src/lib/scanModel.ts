/**
 * The learned scannability model, run on the device.
 *
 * Deliberately a hand-written forward pass over exported weights rather than a
 * model runtime. The network is three dense layers and about 1,200 weights;
 * loading ONNX Runtime Web to evaluate that would add several megabytes to a
 * 764 KB app and break the precache budget the offline promise depends on.
 * Forty lines of arithmetic cost nothing and keep the app dependency-free.
 *
 * The weights come from `tools/scanlab/train/train.py`, which writes
 * `scanModel.data.json` directly so nothing is copied by hand between training
 * and shipping. Features come from `scanFeatures.ts` — the same module the
 * training harness used, which is what keeps the numbers meaning the same
 * thing on both sides.
 */

export interface ScanModel {
  /** Column order the weights expect. Checked before any inference runs. */
  featureNames: string[];
  mean: number[];
  scale: number[];
  layers: { w: number[][]; b: number[] }[];
  /** Operating point chosen to match the heuristic's false-alarm rate. */
  threshold: number;
  auc: number;
}

/** How confident the model is that a design will decode. */
export type ScanBand = 'likely' | 'marginal' | 'unlikely';

/**
 * Band edges taken from the calibration table, not chosen for looks.
 *
 * Above 0.8 the model was right about 84% of the time and below 0.2 about 79%
 * of the time, and those two bands hold roughly 90% of all predictions. The
 * middle is measurably unreliable, so it is reported as uncertainty rather
 * than dressed up as a percentage the evidence cannot support.
 */
export const BAND_LIKELY_ABOVE = 0.8;
export const BAND_UNLIKELY_BELOW = 0.2;

export function bandFor(probability: number): ScanBand {
  if (probability >= BAND_LIKELY_ABOVE) return 'likely';
  if (probability < BAND_UNLIKELY_BELOW) return 'unlikely';
  return 'marginal';
}

const relu = (v: number) => (v > 0 ? v : 0);
const sigmoid = (v: number) => 1 / (1 + Math.exp(-v));

/**
 * Probability that the design decodes, from 0 to 1.
 *
 * Standardise, then dense + ReLU through the hidden layers, then a logistic
 * output — matching scikit-learn's MLPClassifier exactly. The parity test
 * pins this against numbers scikit-learn actually produced.
 */
export function predictScanProbability(model: ScanModel, features: number[]): number {
  if (features.length !== model.mean.length) {
    throw new Error(
      `Expected ${model.mean.length} features, received ${features.length}. ` +
        'The model and the feature extractor are out of step.',
    );
  }

  let activations = features.map(
    (value, i) => (value - model.mean[i]!) / model.scale[i]!,
  );

  model.layers.forEach((layer, index) => {
    const isOutput = index === model.layers.length - 1;
    const next = layer.b.slice();

    // Weights are stored input-major, matching scikit-learn's coefs_ shape.
    for (let i = 0; i < activations.length; i++) {
      const row = layer.w[i]!;
      const value = activations[i]!;
      if (value === 0) continue;
      for (let j = 0; j < row.length; j++) next[j]! += value * row[j]!;
    }

    activations = isOutput ? next : next.map(relu);
  });

  return sigmoid(activations[0]!);
}

/**
 * Loads the weights on demand.
 *
 * A dynamic import so the 14 KB of weights is a separate chunk: people who
 * never turn the beta on never download it, and the default bundle is
 * byte-for-byte what it was before any of this existed.
 */
export async function loadScanModel(): Promise<ScanModel> {
  const data = await import('./scanModel.data.json');
  return (data.default ?? data) as unknown as ScanModel;
}
