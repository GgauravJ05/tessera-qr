import { describe, expect, it } from 'vitest';
import { FEATURE_NAMES } from '../scanFeatures';
import {
  BAND_LIKELY_ABOVE,
  BAND_UNLIKELY_BELOW,
  bandFor,
  predictScanProbability,
  type ScanModel,
} from '../scanModel';
import modelData from '../scanModel.data.json';
import parity from './scanModel.parity.json';

const model = modelData as unknown as ScanModel;

describe('scanModel', () => {
  it('reproduces scikit-learn probabilities exactly', () => {
    // The point of this test. Features are extracted by one shared module, and
    // this pins the other half: if the TypeScript forward pass ever drifts
    // from the Python that produced the weights, the model silently starts
    // scoring designs differently in the browser than it did in training, and
    // nothing else would catch it.
    for (const testCase of parity.cases) {
      const actual = predictScanProbability(model, testCase.features);
      // Tight enough that a wrong architecture, a transposed matrix or a
      // missing activation fails by orders of magnitude; loose enough to
      // tolerate float64 addition being non-associative, since numpy sums a
      // matmul in a different order than this loop does.
      expect(actual).toBeCloseTo(testCase.expected, 9);
    }
  });

  it('covers a real spread of predictions, not just one corner', () => {
    // A parity suite where every case scores 0.99 would pass while proving
    // nothing about the middle of the range.
    const values = parity.cases.map((c) => c.expected);
    expect(Math.min(...values)).toBeLessThan(0.2);
    expect(Math.max(...values)).toBeGreaterThan(0.8);
  });

  it('agrees with the feature extractor on the column order', () => {
    // The weights are only meaningful against the exact order they were
    // trained on, and reading them in the wrong order fails silently.
    expect(model.featureNames).toEqual([...FEATURE_NAMES]);
  });

  it('carries one scaling term per feature', () => {
    expect(model.mean).toHaveLength(FEATURE_NAMES.length);
    expect(model.scale).toHaveLength(FEATURE_NAMES.length);
    expect(model.scale.every((s) => s > 0)).toBe(true);
  });

  it('has layers that chain end to end and finish at a single output', () => {
    expect(model.layers[0]!.w).toHaveLength(FEATURE_NAMES.length);
    for (let i = 0; i < model.layers.length - 1; i++) {
      expect(model.layers[i]!.b).toHaveLength(model.layers[i + 1]!.w.length);
    }
    expect(model.layers.at(-1)!.b).toHaveLength(1);
  });

  it('returns a probability for every parity case', () => {
    for (const testCase of parity.cases) {
      const p = predictScanProbability(model, testCase.features);
      expect(p).toBeGreaterThanOrEqual(0);
      expect(p).toBeLessThanOrEqual(1);
    }
  });

  it('rejects a feature vector of the wrong length rather than guessing', () => {
    expect(() => predictScanProbability(model, [1, 2, 3])).toThrow(/out of step/);
  });

  it('bands predictions at the edges the calibration supports', () => {
    expect(bandFor(0.95)).toBe('likely');
    expect(bandFor(BAND_LIKELY_ABOVE)).toBe('likely');
    expect(bandFor(0.5)).toBe('marginal');
    expect(bandFor(BAND_UNLIKELY_BELOW)).toBe('marginal');
    expect(bandFor(0.05)).toBe('unlikely');
  });
});
