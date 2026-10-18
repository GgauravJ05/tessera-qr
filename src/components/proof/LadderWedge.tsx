import { clsx } from 'clsx';
import { DISTANCE_LADDER } from '@/lib/ladder';
import type { LadderStatus } from '@/hooks/useProofLab';

/**
 * A step wedge, the strip of graded patches a printer reads to see where
 * tone breaks up. Here each step is one rung of the distance ladder, and
 * each patch is a real decode: black where the symbol read, struck in
 * magenta where it did not.
 */
export function LadderWedge({
  trace,
  status,
  selected,
  onSelect,
  compact = false,
  className,
}: {
  trace: boolean[] | null;
  status: LadderStatus;
  selected?: number;
  onSelect?: (rung: number) => void;
  /** A thin single row with no scale, for use inside a tile. */
  compact?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      <ol
        aria-label="Decode result at each rung of the distance ladder"
        className={clsx(
          'grid border-l border-t border-rule',
          compact ? 'grid-cols-20' : 'grid-cols-10 sm:grid-cols-20',
        )}
      >
        {DISTANCE_LADDER.map((rung, i) => {
          const result = trace?.[i];
          const known = status === 'ready' && result !== undefined;
          const Tag = onSelect ? 'button' : 'span';
          return (
            <li key={rung.name} className="border-b border-r border-rule">
              <Tag
                {...(onSelect
                  ? {
                      type: 'button' as const,
                      onClick: () => onSelect(i),
                      'aria-pressed': selected === i,
                    }
                  : {})}
                aria-label={`Rung ${i + 1}, ${rung.ppm} pixels per module: ${
                  known ? (result ? 'decoded' : 'did not decode') : 'not measured yet'
                }`}
                className={clsx(
                  'relative block w-full transition-colors',
                  compact ? 'h-4' : 'h-12',
                  !known && 'bg-tint',
                  known && result && 'bg-ink',
                  known && !result && 'bg-sheet',
                  selected === i && 'outline-2 -outline-offset-[5px] outline-magenta',
                  status === 'running' && 'animate-pulse',
                )}
              >
                {known && !result && (
                  <svg
                    viewBox="0 0 10 10"
                    aria-hidden
                    className={clsx(
                      'absolute text-magenta-ink',
                      compact ? 'inset-0.5' : 'inset-2',
                    )}
                    preserveAspectRatio="none"
                  >
                    <path
                      d="M0 0L10 10M10 0L0 10"
                      stroke="currentColor"
                      strokeWidth="1.2"
                      vectorEffect="non-scaling-stroke"
                    />
                  </svg>
                )}
              </Tag>
            </li>
          );
        })}
      </ol>
      {!compact && (
        <div className="type-label mt-1.5 flex justify-between text-ink-2">
          <span>Close · 10 px a module</span>
          <span>Far · 1.5 px a module</span>
        </div>
      )}
    </div>
  );
}
