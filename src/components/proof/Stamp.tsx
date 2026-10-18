import { useState } from 'react';
import { m, useReducedMotion } from 'motion/react';
import { clsx } from 'clsx';

export type StampVerdict = 'pass' | 'warn' | 'fail';

const WORDING: Record<StampVerdict, string> = {
  pass: 'Pass for press',
  warn: 'Pass with notes',
  fail: 'Not for press',
};

/**
 * The approval stamp, which is also the download. Its wording is the press
 * check's verdict, so the action and the judgement are one object; a design
 * that fails still downloads, because the call is the visitor's to make, but
 * the stamp says plainly what it is signing off.
 *
 * Pressing it inks it: the stamp lands, fills, and lifts.
 */
export function Stamp({
  verdict,
  detail,
  disabled,
  onPress,
  className,
  size = 'lg',
}: {
  verdict: StampVerdict;
  detail: string;
  disabled?: boolean;
  onPress: () => void | Promise<void>;
  className?: string;
  size?: 'lg' | 'md';
}) {
  const reduce = useReducedMotion();
  const [inked, setInked] = useState(false);
  const fail = verdict === 'fail';

  const press = async () => {
    setInked(true);
    try {
      await onPress();
    } finally {
      window.setTimeout(() => setInked(false), 900);
    }
  };

  return (
    <m.button
      type="button"
      disabled={disabled}
      onClick={() => void press()}
      whileHover={disabled || reduce ? undefined : { rotate: 0 }}
      whileTap={disabled || reduce ? undefined : { scale: 0.95 }}
      animate={
        inked && !reduce
          ? { scale: [1, 1.06, 1], rotate: [-2.5, 0, -2.5] }
          : { rotate: -2.5 }
      }
      transition={{ type: 'spring', stiffness: 520, damping: 26 }}
      className={clsx(
        'group relative inline-flex flex-col items-start border-[3px] text-left uppercase transition-colors',
        size === 'lg' ? 'px-5 py-3' : 'px-4 py-2.5',
        disabled
          ? 'cursor-not-allowed border-hair text-ink-3'
          : fail
            ? 'border-ink text-ink hover:bg-yellow hover:text-[#111]'
            : 'border-magenta text-magenta-ink hover:bg-magenta hover:text-on-magenta',
        inked && !disabled && !fail && 'bg-magenta text-on-magenta',
        className,
      )}
    >
      <span
        className={clsx(
          'whitespace-nowrap font-[850] leading-none tracking-[0.02em] [font-stretch:115%]',
          size === 'lg' ? 'text-[22px] sm:text-[26px]' : 'text-[18px]',
        )}
      >
        {disabled ? 'Awaiting copy' : WORDING[verdict]}
      </span>
      <span className="type-label mt-1.5 text-current opacity-90">{detail}</span>
    </m.button>
  );
}
