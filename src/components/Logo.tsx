/**
 * The Tessera mark: a finder pattern struck in black, with one tile of each
 * process ink set beside it, the three plates a proof is checked against.
 */
export function Logo({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden className="shrink-0">
      <rect
        x="1"
        y="1"
        width="14"
        height="14"
        fill="none"
        stroke="var(--ink)"
        strokeWidth="2.5"
      />
      <rect x="5" y="5" width="6" height="6" fill="var(--ink)" />
      <rect x="17" y="1" width="6" height="6" fill="var(--cyan)" />
      <rect x="17" y="9" width="6" height="6" fill="var(--magenta)" />
      <rect x="1" y="17" width="6" height="6" fill="var(--yellow)" />
      <rect x="9" y="17" width="6" height="6" fill="var(--ink)" />
      <rect
        x="17"
        y="17"
        width="6"
        height="6"
        fill="none"
        stroke="var(--ink)"
        strokeWidth="1.5"
      />
    </svg>
  );
}
