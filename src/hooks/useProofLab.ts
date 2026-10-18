import { useEffect, useState } from 'react';
import type { ErrorCorrectionLevel, QrStyle } from '@/types/qr';
import type { LadderResult } from '@/lib/proofLab';

/**
 * The symbol's module count, from the encoder the renderer uses. Loaded on
 * demand, like everything the proof sections need beyond the first paint.
 */
export function useModuleCount(payload: string, ec: ErrorCorrectionLevel): number | null {
  const [count, setCount] = useState<number | null>(null);

  // oxlint-disable react/set-state-in-effect
  useEffect(() => {
    if (!payload) {
      setCount(null);
      return;
    }
    let cancelled = false;
    void import('qrcode-generator')
      .then(({ default: qrcode }) => {
        const qr = qrcode(0, ec);
        qr.addData(payload);
        qr.make();
        if (!cancelled) setCount(qr.getModuleCount());
      })
      .catch(() => {
        // A payload too large for any symbol has no module count.
        if (!cancelled) setCount(null);
      });
    return () => {
      cancelled = true;
    };
  }, [payload, ec]);
  // oxlint-enable react/set-state-in-effect

  return count;
}

export type LadderStatus = 'idle' | 'running' | 'ready' | 'unavailable';

/**
 * Walks the scanlab distance ladder for a design: twenty captures, each
 * handed to a real decoder. It waits for the design to settle before it
 * starts, and abandons a walk as soon as the design changes under it.
 */
export function useLadder(
  payload: string,
  style: QrStyle,
  enabled: boolean,
  settleMs = 350,
): { status: LadderStatus; result: LadderResult | null } {
  const [status, setStatus] = useState<LadderStatus>('idle');
  const [result, setResult] = useState<LadderResult | null>(null);

  // oxlint-disable react/set-state-in-effect
  useEffect(() => {
    if (!enabled || !payload) {
      setStatus('idle');
      return;
    }
    const controller = new AbortController();
    setStatus('running');
    const timer = window.setTimeout(() => {
      void import('@/lib/proofLab')
        .then(({ walkLadder }) => walkLadder(payload, style, controller.signal))
        .then((walk) => {
          if (controller.signal.aborted) return;
          setResult(walk);
          setStatus(walk ? 'ready' : 'unavailable');
        })
        .catch(() => {
          if (!controller.signal.aborted) setStatus('unavailable');
        });
    }, settleMs);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [payload, style, enabled, settleMs]);
  // oxlint-enable react/set-state-in-effect

  return { status, result };
}
