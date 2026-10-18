import { AnimatePresence, m } from 'motion/react';
import { clsx } from 'clsx';

/**
 * A measured value set in fixed character cells, like a densitometer's
 * display. When the value changes, only the cells whose character changed
 * roll over, so a ratio moving from 17.7 to 12.4 reads as a reading
 * updating, not a number being replaced, and nothing beside it reflows.
 *
 * The visible cells are hidden from assistive tech; the whole value is
 * announced once, as text.
 */
export function Reading({ value, className }: { value: string; className?: string }) {
  const chars = Array.from(value);
  return (
    <span className={clsx('type-reading relative inline-flex', className)}>
      <span className="sr-only">{value}</span>
      <span aria-hidden className="inline-flex overflow-hidden">
        {chars.map((char, i) => (
          // Cells are positions on the display, so the index is the identity:
          // a cell keeps its place and only its character rolls over.
          // oxlint-disable-next-line react/no-array-index-key
          <span key={i} className="relative inline-grid">
            <AnimatePresence mode="popLayout" initial={false}>
              <m.span
                key={char}
                className="col-start-1 row-start-1 whitespace-pre"
                initial={{ y: '-0.55em', opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: '0.55em', opacity: 0 }}
                transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1], delay: i * 0.025 }}
              >
                {char}
              </m.span>
            </AnimatePresence>
          </span>
        ))}
      </span>
    </span>
  );
}
