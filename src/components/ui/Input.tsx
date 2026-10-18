import { clsx } from 'clsx';
import type {
  InputHTMLAttributes,
  TextareaHTMLAttributes,
  SelectHTMLAttributes,
} from 'react';

/*
 * Entries are written onto the ticket: a ruled box in black ink on the sheet,
 * with the caret and any fault in magenta. No rounding, because nothing on a
 * proof is rounded except the registration targets.
 */
const base =
  'w-full border border-rule bg-sheet px-3 py-2.5 text-[15px] text-ink placeholder:text-ink-3 transition-colors hover:bg-tint focus:bg-sheet focus:outline-2 focus:outline-offset-0 focus:outline-cyan disabled:border-hair disabled:text-ink-3 disabled:hover:bg-sheet';

export function Input({
  className,
  invalid,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  return (
    <input
      {...props}
      aria-invalid={invalid || undefined}
      className={clsx(base, invalid && 'border-magenta outline-magenta', className)}
    />
  );
}

export function TextArea({
  className,
  invalid,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }) {
  return (
    <textarea
      {...props}
      aria-invalid={invalid || undefined}
      className={clsx(
        base,
        'min-h-24 resize-y leading-relaxed',
        invalid && 'border-magenta',
        className,
      )}
    />
  );
}

export function Select({
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={clsx(base, 'cursor-pointer appearance-none pr-9', className)}
    >
      {children}
    </select>
  );
}
