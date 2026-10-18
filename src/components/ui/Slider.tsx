import { useId } from 'react';

const identity = (value: number) => String(value);

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  format?: (value: number) => string;
  onChange: (value: number) => void;
}

/** A ruler with a registration-mark thumb and its reading set beside it. */
export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  format = identity,
  onChange,
}: SliderProps) {
  const id = useId();
  return (
    <div className="min-w-0 space-y-1">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="type-label text-ink-2">
          {label}
        </label>
        <span className="type-reading text-[14px] text-ink">{format(value)}</span>
      </div>
      <input
        id={id}
        type="range"
        aria-label={label}
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
      />
    </div>
  );
}
