/** The tessera mark: three finder squares plus two loose tiles. */
export function Logo({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden className="shrink-0">
      <rect x="1" y="1" width="8" height="8" rx="2.5" fill="currentColor" className="text-accent" />
      <rect x="15" y="1" width="8" height="8" rx="2.5" fill="currentColor" className="text-ink" opacity="0.85" />
      <rect x="1" y="15" width="8" height="8" rx="2.5" fill="currentColor" className="text-ink" opacity="0.85" />
      <rect x="15" y="15" width="3.5" height="3.5" rx="1.2" fill="currentColor" className="text-ink-subtle" />
      <rect x="19.5" y="19.5" width="3.5" height="3.5" rx="1.2" fill="currentColor" className="text-ink-subtle" />
    </svg>
  );
}
