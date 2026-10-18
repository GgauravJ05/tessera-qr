import type { QrStyle } from '@/types/qr';
import type { ScannabilityReport } from '@/lib/contrast';
import { CONTRAST_FAIL_BELOW, CONTRAST_WARN_BELOW } from '@/lib/contrast';
import type { CapacityReport } from '@/lib/validation';
import { EC_RECOVERY, quietZoneModules } from '@/lib/ladder';

export type CheckStatus = 'pass' | 'warn' | 'fail' | 'note';

export interface ProofCheck {
  id: string;
  label: string;
  reading: string;
  status: CheckStatus;
  detail: string;
}

/** The quiet zone the QR specification asks for, in modules. */
export const SPEC_QUIET_ZONE = 4;

/**
 * The press check: everything the studio can measure about a design before it
 * goes to print, in the order a printer would look at it. Every line is a
 * measurement the app actually makes, and the two notes at the end are the
 * advice it already gives. Nothing here guesses at a real-world distance,
 * because the evidence does not support one.
 */
export function pressCheck({
  style,
  scannability,
  capacity,
  moduleCount,
}: {
  style: QrStyle;
  scannability: ScannabilityReport;
  capacity: CapacityReport;
  moduleCount: number | null;
}): ProofCheck[] {
  const checks: ProofCheck[] = [];
  const ratio = scannability.ratio;

  checks.push({
    id: 'contrast',
    label: style.useGradient ? 'Contrast, weakest end' : 'Contrast',
    reading: `${ratio.toFixed(1)}:1`,
    status:
      ratio < CONTRAST_FAIL_BELOW
        ? 'fail'
        : ratio < CONTRAST_WARN_BELOW
          ? 'warn'
          : 'pass',
    detail:
      ratio < CONTRAST_FAIL_BELOW
        ? 'Below 3:1 most phone cameras fail outright.'
        : ratio < CONTRAST_WARN_BELOW
          ? 'Between 3 and 4.5:1 it decodes only in good light on a clean print.'
          : 'Comfortably above the 4.5:1 floor.',
  });

  checks.push({
    id: 'polarity',
    label: 'Dark on light',
    reading: scannability.inverted ? 'No' : 'Yes',
    status: scannability.inverted ? 'warn' : 'pass',
    detail: scannability.inverted
      ? 'Some older scanners only read dark modules on a light ground.'
      : 'Every scanner expects this polarity.',
  });

  checks.push({
    id: 'capacity',
    label: 'Capacity',
    reading: `${Math.round(Math.min(capacity.usage, 9.99) * 100)}%`,
    status: capacity.overflow ? 'fail' : capacity.usage > 0.8 ? 'warn' : 'pass',
    detail: capacity.overflow
      ? 'Too much data for one symbol. Shorten it or lower the error correction.'
      : capacity.usage > 0.8
        ? 'A near-full symbol is dense, so it needs a larger print.'
        : `${capacity.bytes} of ${capacity.limit} bytes at level ${style.errorCorrection}.`,
  });

  if (moduleCount) {
    const quiet = quietZoneModules(moduleCount, style.margin, style.size);
    const short = quiet < SPEC_QUIET_ZONE || style.transparentBackground;
    checks.push({
      id: 'quiet',
      label: 'Quiet zone',
      reading: `${quiet.toFixed(1)} of ${SPEC_QUIET_ZONE} mod`,
      status: short ? 'warn' : 'pass',
      detail: short
        ? `The specification asks for ${SPEC_QUIET_ZONE} modules of clear space. Leave it around the code when you place it on the page.`
        : 'The file carries its own clear border.',
    });
  }

  if (style.logo) {
    const coverage = style.logoSize * style.logoSize;
    const recovery = EC_RECOVERY[style.errorCorrection];
    checks.push({
      id: 'logo',
      label: 'Logo coverage',
      reading: `${Math.round(coverage * 100)}%`,
      status: coverage > recovery ? 'fail' : coverage > recovery * 0.7 ? 'warn' : 'pass',
      detail:
        coverage > recovery
          ? `More than level ${style.errorCorrection} can rebuild (${Math.round(recovery * 100)}%). Shrink the logo or raise the level.`
          : `Within the ${Math.round(recovery * 100)}% that level ${style.errorCorrection} can rebuild.`,
    });
  }

  checks.push({
    id: 'size',
    label: 'Print size',
    reading: '≥ 2 cm',
    status: 'note',
    detail: 'Keep the printed symbol at 2 cm or larger for close-range scanning.',
  });

  checks.push({
    id: 'phones',
    label: 'Proof scan',
    reading: '2 phones',
    status: 'note',
    detail: 'Scan a printed proof with two different phones before a large run.',
  });

  return checks;
}

/** The single verdict the stamp carries: the worst measured line wins. */
export function verdictOf(checks: readonly ProofCheck[]): 'pass' | 'warn' | 'fail' {
  if (checks.some((c) => c.status === 'fail')) return 'fail';
  if (checks.some((c) => c.status === 'warn')) return 'warn';
  return 'pass';
}
