import { clsx } from 'clsx';
import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost';

/*
 * Buttons on the sheet are ruled boxes. The primary is a block of magenta,
 * the colour the proof reserves for what needs doing; the rest are drawn in
 * black ink and fill on hover the way a pressed key would.
 */
const variants: Record<Variant, string> = {
  primary:
    'border border-magenta bg-magenta text-on-magenta hover:bg-magenta-ink disabled:border-hair disabled:bg-tint disabled:text-ink-3',
  secondary:
    'border border-rule bg-sheet text-ink hover:bg-ink hover:text-sheet disabled:border-hair disabled:text-ink-3 disabled:hover:bg-sheet',
  ghost: 'text-ink-2 hover:bg-tint hover:text-ink',
};

export function Button({
  variant = 'secondary',
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      type="button"
      {...props}
      className={clsx(
        'inline-flex items-center justify-center gap-2 px-3.5 py-2 text-[14px] font-semibold transition-colors active:translate-y-px disabled:cursor-not-allowed disabled:active:translate-y-0',
        variants[variant],
        className,
      )}
    />
  );
}
