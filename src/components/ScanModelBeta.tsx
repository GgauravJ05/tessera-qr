import { useState } from 'react';
import { clsx } from 'clsx';
import { FlaskConical } from 'lucide-react';
import type { QrStyle } from '@/types/qr';
import { useScanPrediction } from '@/hooks/useScanPrediction';
import type { ScanBand } from '@/lib/scanModel';
import { Toggle } from './ui/Toggle';

const STORAGE_KEY = 'tessera:scan-model-beta';

const BAND: Record<ScanBand, { label: string; className: string; detail: string }> = {
  likely: {
    label: 'Likely to scan',
    className: 'text-ok',
    detail: 'Nothing in the design stands out as a risk.',
  },
  marginal: {
    label: 'Uncertain',
    className: 'text-warn',
    detail: 'The model is not confident either way. Test this one before printing.',
  },
  unlikely: {
    label: 'Unlikely to scan',
    className: 'text-danger',
    detail: 'Shape, colour or density look like designs that failed to decode.',
  },
};

/**
 * The learned scannability model, offered as an opt-in second opinion.
 *
 * It sits beside the contrast check rather than replacing it, and it is off by
 * default. The model is trained on simulated camera conditions and one
 * decoder; the ordering it produces is trustworthy but the absolute rates have
 * not yet been validated against real phones, so it has not earned the right
 * to overrule a rule that has. Showing both also makes the comparison visible
 * on real designs, which is the cheapest way to find out where they disagree.
 */
function readInitialEnabled(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'on';
  } catch {
    // Private windows and blocked site data both throw here. Staying off is
    // the default anyway.
    return false;
  }
}

export function ScanModelBeta({ payload, style }: { payload: string; style: QrStyle }) {
  const [enabled, setEnabled] = useState(readInitialEnabled);

  const change = (next: boolean) => {
    setEnabled(next);
    try {
      localStorage.setItem(STORAGE_KEY, next ? 'on' : 'off');
    } catch {
      // Not being able to remember the choice is not a reason to refuse it.
    }
  };

  const { status, probability, band } = useScanPrediction(enabled, payload, style);

  return (
    <div className="rounded-lg border border-line px-3 py-2.5">
      <Toggle
        checked={enabled}
        onChange={change}
        label="Scan prediction (beta)"
        description="A model trained on 5,000 decoded symbols, run on your device."
      />

      {enabled && (
        <div className="mt-2 border-t border-line pt-2 text-xs" aria-live="polite">
          {status === 'loading' && <p className="text-ink-subtle">Loading the model…</p>}

          {status === 'unavailable' && (
            <p className="text-ink-subtle">
              No prediction for this design. The contrast check above still applies.
            </p>
          )}

          {status === 'ready' && band && probability !== null && (
            <>
              <div className="flex items-center gap-2">
                <FlaskConical size={13} aria-hidden className={BAND[band].className} />
                <span className={clsx('font-medium', BAND[band].className)}>
                  {BAND[band].label}
                </span>
                <span className="ml-auto font-mono text-ink-subtle">
                  {Math.round(probability * 100)}%
                </span>
              </div>
              <p className="mt-1 text-ink-subtle">{BAND[band].detail}</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
