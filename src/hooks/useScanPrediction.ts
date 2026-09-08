import { useEffect, useRef, useState } from 'react';
import type { QrStyle } from '@/types/qr';
import type { ScanBand, ScanModel } from '@/lib/scanModel';

export type ScanPredictionStatus = 'off' | 'loading' | 'ready' | 'unavailable';

/**
 * qrcode-generator declares itself with `export =`, so in type position the
 * module resolves to the factory itself, while a dynamic import resolves to a
 * namespace carrying that factory on `.default`. Hence the asymmetry below:
 * the ref holds this type, but the awaited import is unwrapped first.
 *
 * The version is pinned to match the copy qr-code-styling encodes with. If
 * the two ever diverge, the app would count modules with one encoder while
 * the renderer drew with another, and the feature vector would quietly stop
 * describing the symbol on screen.
 */
type QrEncoder = typeof import('qrcode-generator');

export interface ScanPrediction {
  status: ScanPredictionStatus;
  probability: number | null;
  band: ScanBand | null;
}

/**
 * Runs the learned scannability model against the current design.
 *
 * The model and the encoder it needs are pulled in with dynamic imports, so
 * everything this feature costs — the weights, the module counter — is a
 * separate chunk that only downloads once someone turns the beta on. Visitors
 * who never touch it get the same bundle the app shipped before the model
 * existed.
 */
export function useScanPrediction(
  enabled: boolean,
  payload: string,
  style: QrStyle,
): ScanPrediction {
  const modelRef = useRef<ScanModel | null>(null);
  const encoderRef = useRef<QrEncoder | null>(null);
  const [status, setStatus] = useState<ScanPredictionStatus>('off');
  const [result, setResult] = useState<{ probability: number; band: ScanBand } | null>(
    null,
  );

  // oxlint-disable react/set-state-in-effect
  useEffect(() => {
    if (!enabled) {
      setStatus('off');
      setResult(null);
      return;
    }

    let cancelled = false;

    const run = async () => {
      try {
        setStatus((current) => (current === 'ready' ? current : 'loading'));

        // Everything the feature costs is imported here rather than at the top
        // of the module: the weights, the encoder, the feature extractor and
        // the forward pass. None of it reaches the main bundle, so visitors
        // who never turn the beta on download exactly what they did before.
        const [scanModel, { extractFeatures }, encoder] = await Promise.all([
          import('@/lib/scanModel'),
          import('@/lib/scanFeatures'),
          import('qrcode-generator'),
        ]);
        if (cancelled) return;

        if (!modelRef.current) modelRef.current = await scanModel.loadScanModel();
        if (!encoderRef.current) encoderRef.current = encoder.default;

        const model = modelRef.current;
        const qrcode = encoderRef.current;
        if (cancelled || !model || !qrcode || !payload) {
          if (!cancelled) setResult(null);
          return;
        }

        // The module count comes from the encoder rather than a guess: it is
        // what the payload and correction level actually produce, and the
        // model was trained against that same number.
        const qr = qrcode(0, style.errorCorrection);
        qr.addData(payload);
        qr.make();

        const features = extractFeatures({
          payload,
          style,
          moduleCount: qr.getModuleCount(),
        });

        if (cancelled) return;
        const probability = scanModel.predictScanProbability(model, features);
        setResult({ probability, band: scanModel.bandFor(probability) });
        setStatus('ready');
      } catch {
        // A payload too large to encode has no symbol to score, and a failed
        // chunk load should degrade to the heuristic rather than break the
        // studio. Either way the beta simply reports nothing.
        if (!cancelled) {
          setResult(null);
          setStatus('unavailable');
        }
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [enabled, payload, style]);
  // oxlint-enable react/set-state-in-effect

  return {
    status,
    probability: result?.probability ?? null,
    band: result?.band ?? null,
  };
}
