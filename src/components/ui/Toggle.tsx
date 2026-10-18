import { m } from 'motion/react';

interface ToggleProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  description?: string;
}

/**
 * An on/off entry on the ticket: a ruled two-cell switch whose ink block
 * slides to the side that is set, rather than a pill borrowed from a phone.
 */
export function Toggle({ checked, onChange, label, description }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="group flex w-full items-center justify-between gap-4 py-1.5 text-left"
    >
      <span className="min-w-0">
        <span className="block text-[15px] font-semibold text-ink">{label}</span>
        {description && (
          <span className="block text-[13px] text-ink-2">{description}</span>
        )}
      </span>
      <span
        aria-hidden
        className="relative grid h-7 w-[60px] shrink-0 grid-cols-2 border border-rule text-[10px] font-bold uppercase"
      >
        <m.span
          className={
            checked
              ? 'absolute inset-y-0 right-0 w-1/2 bg-magenta'
              : 'absolute inset-y-0 left-0 w-1/2 bg-ink'
          }
          layout
          transition={{ type: 'spring', stiffness: 600, damping: 38 }}
        />
        <span
          className={`relative z-10 grid place-items-center ${checked ? 'text-ink-3' : 'text-sheet'}`}
        >
          Off
        </span>
        <span
          className={`relative z-10 grid place-items-center ${checked ? 'text-on-magenta' : 'text-ink-3'}`}
        >
          On
        </span>
      </span>
    </button>
  );
}
