import type { ReactNode } from 'react';
import { useId } from 'react';
import { ProofMark } from '@/components/proof/Marks';

interface FieldProps {
  label: string;
  hint?: string;
  error?: string;
  children: (id: string, describedBy: string | undefined) => ReactNode;
}

/**
 * A job-ticket field: the field name in the ticket's small capitals, the
 * entry beneath it, and any correction marked in magenta below. Wires up the
 * aria relationships so screen readers announce the whole group.
 */
export function Field({ label, hint, error, children }: FieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [error ? errorId : null, hint ? hintId : null]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="min-w-0 space-y-1.5">
      <label htmlFor={id} className="type-label block text-ink-2">
        {label}
      </label>
      {children(id, describedBy || undefined)}
      {error ? (
        <p
          id={errorId}
          role="alert"
          className="flex items-center gap-1.5 text-[13px] font-medium text-magenta-ink"
        >
          <ProofMark kind="fail" size={12} />
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-[13px] text-ink-2">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
