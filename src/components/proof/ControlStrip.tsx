import { clsx } from 'clsx';
import type { QrStyle } from '@/types/qr';
import type { ScannabilityReport } from '@/lib/contrast';
import { contrastRatio, CONTRAST_FAIL_BELOW, CONTRAST_WARN_BELOW } from '@/lib/contrast';
import type { CapacityReport } from '@/lib/validation';
import { EC_RECOVERY, quietZoneModules } from '@/lib/ladder';
import { SPEC_QUIET_ZONE } from '@/lib/readiness';
import { ProofMark } from './Marks';
import { Reading } from './Reading';

interface Patch {
  id: string;
  label: string;
  reading: string;
  swatch?: string;
  transparent?: boolean;
  status: 'pass' | 'warn' | 'fail' | 'none';
  weakest?: boolean;
  /** For a reading cell: how full its gauge is, 0 to 1. */
  gauge?: number;
}

const statusOf = (ratio: number): Patch['status'] =>
  ratio < CONTRAST_FAIL_BELOW ? 'fail' : ratio < CONTRAST_WARN_BELOW ? 'warn' : 'pass';

/**
 * The colour control strip printed along the edge of a press sheet, made of
 * this design's own inks. Every patch is a live reading: the inks against
 * the paper, then what the symbol carries. The weakest ink is the one a
 * printer would circle, so it is marked whether or not it fails.
 */
export function ControlStrip({
  style,
  scannability,
  capacity,
  moduleCount,
  dense = false,
  className,
}: {
  style: QrStyle;
  scannability: ScannabilityReport;
  capacity: CapacityReport;
  moduleCount: number | null;
  dense?: boolean;
  className?: string;
}) {
  const paper = style.transparentBackground ? '#ffffff' : style.background;
  const inkRatio = scannability.foregroundRatio;
  const endRatio = style.useGradient ? contrastRatio(style.gradientTo, paper) : null;
  const weakestIsEnd = endRatio !== null && endRatio < inkRatio;

  const patches: Patch[] = [
    {
      id: 'ink',
      label: style.useGradient ? 'Ink, start' : 'Ink',
      reading: `${inkRatio.toFixed(1)}:1`,
      swatch: style.foreground,
      status: statusOf(inkRatio),
      weakest: !weakestIsEnd,
    },
  ];
  if (endRatio !== null) {
    patches.push({
      id: 'end',
      label: 'Ink, end',
      reading: `${endRatio.toFixed(1)}:1`,
      swatch: style.gradientTo,
      status: statusOf(endRatio),
      weakest: weakestIsEnd,
    });
  }
  patches.push({
    id: 'paper',
    label: style.transparentBackground ? 'Paper, clear' : 'Paper',
    reading: paper.toUpperCase(),
    swatch: paper,
    transparent: style.transparentBackground,
    status: 'none',
  });
  patches.push({
    id: 'capacity',
    label: 'Capacity',
    reading: `${Math.round(Math.min(capacity.usage, 9.99) * 100)}%`,
    status: capacity.overflow ? 'fail' : capacity.usage > 0.8 ? 'warn' : 'none',
    gauge: Math.min(capacity.usage, 1),
  });
  patches.push({
    id: 'ec',
    label: 'Recovery',
    reading: `${style.errorCorrection} ${Math.round(EC_RECOVERY[style.errorCorrection] * 100)}%`,
    status: 'none',
    // Against the most any level can rebuild, which is H's 30%.
    gauge: EC_RECOVERY[style.errorCorrection] / EC_RECOVERY.H,
  });
  if (moduleCount) {
    const quiet = quietZoneModules(moduleCount, style.margin, style.size);
    patches.push({
      id: 'quiet',
      label: 'Quiet zone',
      reading: `${quiet.toFixed(1)} of ${SPEC_QUIET_ZONE}`,
      status: quiet < SPEC_QUIET_ZONE ? 'warn' : 'none',
      gauge: Math.min(quiet / SPEC_QUIET_ZONE, 1),
    });
    if (!dense) {
      patches.push({
        id: 'modules',
        label: 'Modules',
        reading: `${moduleCount}²`,
        status: 'none',
        // Against the largest symbol there is, version 40 at 177 modules.
        gauge: moduleCount / 177,
      });
    }
  }

  return (
    <ul
      aria-label="Colour control strip"
      className={clsx(
        'grid border-l border-t border-rule',
        dense ? 'grid-cols-3' : 'grid-cols-[repeat(auto-fit,minmax(9.5rem,1fr))]',
        className,
      )}
    >
      {patches.map((p) => (
        <li
          key={p.id}
          className={clsx(
            'relative flex min-w-0 flex-col border-b border-r border-rule',
            p.weakest && 'outline-2 -outline-offset-4 outline-magenta',
          )}
        >
          {p.swatch !== undefined ? (
            <span
              aria-hidden
              className={clsx(
                'block h-7 border-b border-rule',
                p.transparent && 'bg-transparency',
              )}
              style={p.transparent ? undefined : { background: p.swatch }}
            />
          ) : (
            // A reading cell's patch is its gauge, inset in a hairline frame so
            // it can never run into the next cell, and filled in cyan, the
            // information ink, so it is never mistaken for one of the code's
            // own inks. Yellow while short of its target, magenta on a fail.
            <span aria-hidden className="block h-7 border-b border-rule p-1.5">
              <span className="relative block h-full border border-hair bg-sheet">
                <span
                  className={clsx(
                    'absolute inset-y-0 left-0 transition-[width] duration-500',
                    p.status === 'fail'
                      ? 'bg-magenta'
                      : p.status === 'warn'
                        ? 'bg-yellow'
                        : 'bg-cyan',
                  )}
                  style={{ width: `${(p.gauge ?? 0) * 100}%` }}
                />
              </span>
            </span>
          )}
          <span className="flex items-start justify-between gap-1 px-2 pt-1.5">
            <span className="type-label truncate text-ink-2">{p.label}</span>
            {p.status !== 'none' && p.status !== 'pass' && (
              <ProofMark kind={p.status} size={13} />
            )}
          </span>
          <span className="px-2 pb-2 text-[17px] leading-tight">
            <Reading value={p.reading} />
          </span>
          {p.weakest && (
            <span className="type-label absolute right-1.5 top-1.5 bg-sheet px-1 text-[9.5px] text-magenta-ink">
              Weakest
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
