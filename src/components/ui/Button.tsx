import { clsx } from 'clsx';
import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost';

const variants: Record<Variant, string> = {
  primary:
    'bg-accent text-on-accent hover:bg-accent-hover shadow-sm disabled:bg-line-strong disabled:text-ink-subtle disabled:shadow-none',
  secondary:
    'border border-line bg-raised text-ink hover:border-line-strong hover:bg-surface',
  ghost: 'text-ink-muted hover:bg-raised hover:text-ink',
};

export function Button({
  variant = 'secondary',
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      {...props}
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:active:scale-100',
        variants[variant],
        className,
      )}
    />
  );
}
