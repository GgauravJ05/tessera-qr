import { clsx } from 'clsx';

/**
 * The printer's marks the sheet is built from. All of them are drawn rather
 * than set as glyphs, at a hairline weight that holds at any zoom.
 */

/** Corner crop marks: two short rules that sit just outside the trim. */
export function CropMarks({ className }: { className?: string }) {
  // Each mark extends a trim edge outward and stops short of the corner, so
  // the four of them locate the cut without touching the sheet.
  const corners = [
    { at: '-left-6 -top-6', d: 'M0 23.5H17M23.5 0V17' },
    { at: '-right-6 -top-6', d: 'M7 23.5H24M0.5 0V17' },
    { at: '-bottom-6 -left-6', d: 'M0 0.5H17M23.5 7V24' },
    { at: '-bottom-6 -right-6', d: 'M7 0.5H24M0.5 7V24' },
  ];
  return (
    <div aria-hidden className={clsx('pointer-events-none absolute inset-0', className)}>
      {corners.map(({ at, d }) => (
        <svg
          key={at}
          viewBox="0 0 24 24"
          className={clsx('absolute size-6 text-ink-2', at)}
        >
          <path d={d} stroke="currentColor" strokeWidth="1" fill="none" />
        </svg>
      ))}
    </div>
  );
}

/** The registration target: a ringed crosshair every plate is aligned to. */
export function RegistrationMark({
  size = 22,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden
      className={clsx('shrink-0', className)}
    >
      <circle cx="12" cy="12" r="7" fill="none" stroke="currentColor" strokeWidth="1" />
      <circle cx="12" cy="12" r="3" fill="currentColor" />
      <path d="M12 0V24M0 12H24" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

/**
 * A trim line between sections of the sheet: a hairline with a registration
 * target at its centre, the way a press sheet marks where it will be cut.
 */
export function Trim({ className }: { className?: string }) {
  return (
    <div aria-hidden className={clsx('flex items-center gap-3 text-ink-3', className)}>
      <span className="h-px flex-1 bg-hair" />
      <RegistrationMark size={18} />
      <span className="h-px flex-1 bg-hair" />
    </div>
  );
}

/** Proofreader's marks: a struck cross for a fault, a tick for a pass. */
export function ProofMark({
  kind,
  size = 16,
  className,
}: {
  kind: 'fail' | 'warn' | 'pass' | 'note';
  size?: number;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 16 16"
      width={size}
      height={size}
      aria-hidden
      className={clsx(
        'shrink-0',
        kind === 'fail' && 'text-magenta-ink',
        kind === 'warn' && 'text-ink',
        kind === 'pass' && 'text-ink',
        kind === 'note' && 'text-cyan-ink',
        className,
      )}
    >
      {kind === 'fail' && (
        <path
          d="M3 3L13 13M13 3L3 13"
          stroke="currentColor"
          strokeWidth="2.25"
          strokeLinecap="square"
        />
      )}
      {kind === 'warn' && (
        <>
          <rect x="1" y="1" width="14" height="14" fill="var(--yellow)" />
          <path d="M8 4V9.5" stroke="#111" strokeWidth="2" />
          <rect x="7" y="11" width="2" height="2" fill="#111" />
        </>
      )}
      {kind === 'pass' && (
        <path
          d="M2.5 8.5L6.5 12.5L13.5 3.5"
          stroke="currentColor"
          strokeWidth="2.25"
          fill="none"
          strokeLinecap="square"
        />
      )}
      {kind === 'note' && (
        <>
          <circle
            cx="8"
            cy="8"
            r="6.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <rect x="7.1" y="7" width="1.8" height="5" fill="currentColor" />
          <rect x="7.1" y="4" width="1.8" height="1.8" fill="currentColor" />
        </>
      )}
    </svg>
  );
}
