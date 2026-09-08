/**
 * The bridge between the app and the lab.
 *
 * The harness renders through the app's own modules rather than a copy, so a
 * change to how Tessera maps style onto the renderer, builds a payload or
 * rates contrast automatically changes what the lab measures. Duplicating any
 * of this here would let the training data drift away from the shipped app
 * without anything failing loudly.
 */
export { toQrOptions } from '../../../src/lib/qrOptions';
export { buildPayload } from '../../../src/lib/payload';
export {
  assessScannability,
  contrastRatio,
  parseHex,
  relativeLuminance,
} from '../../../src/lib/contrast';
export { assessCapacity, payloadBytes } from '../../../src/lib/validation';
export { DEFAULT_STYLE, PRESETS } from '../../../src/lib/defaults';
export { extractFeatures, FEATURE_NAMES } from '../../../src/lib/scanFeatures';
