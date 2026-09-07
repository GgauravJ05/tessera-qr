import { useRef } from 'react';
import { clsx } from 'clsx';
import { ImagePlus, Trash2 } from 'lucide-react';
import type {
  CornerDotStyle,
  CornerSquareStyle,
  DotStyle,
  ErrorCorrectionLevel,
  QrStyle,
} from '@/types/qr';
import { PRESETS } from '@/lib/defaults';
import { Field } from './ui/Field';
import { Select } from './ui/Input';
import { Button } from './ui/Button';
import { Toggle } from './ui/Toggle';
import { Slider } from './ui/Slider';

interface StylePanelProps {
  style: QrStyle;
  onChange: (patch: Partial<QrStyle>) => void;
}

const DOT_STYLES: { value: DotStyle; label: string }[] = [
  { value: 'square', label: 'Square' },
  { value: 'dots', label: 'Dots' },
  { value: 'rounded', label: 'Rounded' },
  { value: 'classy', label: 'Classy' },
  { value: 'classy-rounded', label: 'Classy round' },
  { value: 'extra-rounded', label: 'Extra round' },
];

const CORNER_SQUARES: { value: CornerSquareStyle; label: string }[] = [
  { value: 'square', label: 'Square' },
  { value: 'dot', label: 'Dot' },
  { value: 'extra-rounded', label: 'Rounded' },
];

const CORNER_DOTS: { value: CornerDotStyle; label: string }[] = [
  { value: 'square', label: 'Square' },
  { value: 'dot', label: 'Dot' },
];

const EC_LEVELS: { value: ErrorCorrectionLevel; label: string }[] = [
  { value: 'L', label: 'L — 7% recovery' },
  { value: 'M', label: 'M — 15% recovery' },
  { value: 'Q', label: 'Q — 25% recovery' },
  { value: 'H', label: 'H — 30% recovery' },
];

/** Colour swatch paired with a hex field, sharing one label. */
function ColorControl({
  label,
  value,
  disabled,
  onChange,
}: {
  label: string;
  value: string;
  disabled?: boolean;
  onChange: (hex: string) => void;
}) {
  return (
    <Field label={label}>
      {(id) => (
        <div
          className={clsx(
            'flex items-center gap-2 rounded-lg border bg-raised p-1.5 transition-opacity',
            disabled && 'pointer-events-none opacity-50',
          )}
        >
          <input
            id={id}
            type="color"
            value={value}
            disabled={disabled}
            onChange={(e) => onChange(e.target.value)}
            className="h-7 w-9 rounded-md ring-1 ring-line"
            aria-label={`${label} colour picker`}
          />
          <input
            type="text"
            value={value.toUpperCase()}
            disabled={disabled}
            onChange={(e) => onChange(e.target.value)}
            aria-label={`${label} hex value`}
            className="w-full min-w-0 bg-transparent font-mono text-xs uppercase text-ink outline-none"
          />
        </div>
      )}
    </Field>
  );
}

export function StylePanel({ style, onChange }: StylePanelProps) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleLogo = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () =>
      onChange({
        logo: String(reader.result),
        // A logo covers data modules, so lift recovery to survive the hole.
        errorCorrection: 'H',
      });
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <span className="text-[13px] font-medium text-ink-muted">Presets</span>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {PRESETS.map((preset) => {
            const active =
              style.foreground.toLowerCase() === preset.style.foreground &&
              style.dotStyle === preset.style.dotStyle;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => onChange(preset.style)}
                aria-pressed={active}
                title={preset.name}
                className={clsx(
                  'group flex flex-col items-center gap-1.5 rounded-lg border p-2 transition-all hover:border-line-strong',
                  active ? 'border-accent bg-accent-soft' : 'border-line',
                )}
              >
                <span
                  className="h-7 w-7 rounded-md ring-1 ring-black/5"
                  style={{
                    background: preset.style.useGradient
                      ? `linear-gradient(135deg, ${preset.style.foreground}, ${preset.style.gradientTo})`
                      : preset.style.foreground,
                  }}
                />
                <span className="text-[10px] font-medium text-ink-muted">
                  {preset.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <ColorControl
          label={style.useGradient ? 'Gradient from' : 'Foreground'}
          value={style.foreground}
          onChange={(hex) => onChange({ foreground: hex })}
        />
        {style.useGradient ? (
          <ColorControl
            label="Gradient to"
            value={style.gradientTo}
            onChange={(hex) => onChange({ gradientTo: hex })}
          />
        ) : (
          <ColorControl
            label="Background"
            value={style.background}
            disabled={style.transparentBackground}
            onChange={(hex) => onChange({ background: hex })}
          />
        )}
      </div>

      <div className="space-y-3 border-t border-line pt-4">
        <Toggle
          label="Gradient fill"
          description="Blend two colours across the symbol."
          checked={style.useGradient}
          onChange={(v) => onChange({ useGradient: v })}
        />
        {style.useGradient && (
          <>
            <ColorControl
              label="Background"
              value={style.background}
              disabled={style.transparentBackground}
              onChange={(hex) => onChange({ background: hex })}
            />
            <Slider
              label="Gradient angle"
              value={style.gradientRotation}
              min={0}
              max={360}
              step={15}
              format={(v) => `${v}°`}
              onChange={(v) => onChange({ gradientRotation: v })}
            />
          </>
        )}
        <Toggle
          label="Transparent background"
          description="PNG and SVG only — JPEG will fall back to white."
          checked={style.transparentBackground}
          onChange={(v) => onChange({ transparentBackground: v })}
        />
      </div>

      <div className="grid gap-4 border-t border-line pt-4 sm:grid-cols-3">
        <Field label="Dot shape">
          {(id) => (
            <Select
              id={id}
              value={style.dotStyle}
              onChange={(e) => onChange({ dotStyle: e.target.value as DotStyle })}
            >
              {DOT_STYLES.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Eye frame">
          {(id) => (
            <Select
              id={id}
              value={style.cornerSquareStyle}
              onChange={(e) =>
                onChange({ cornerSquareStyle: e.target.value as CornerSquareStyle })
              }
            >
              {CORNER_SQUARES.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Eye centre">
          {(id) => (
            <Select
              id={id}
              value={style.cornerDotStyle}
              onChange={(e) =>
                onChange({ cornerDotStyle: e.target.value as CornerDotStyle })
              }
            >
              {CORNER_DOTS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          )}
        </Field>
      </div>

      <div className="space-y-4 border-t border-line pt-4">
        <span className="text-[13px] font-medium text-ink-muted">Centre logo</span>
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/svg+xml,image/webp"
          className="sr-only"
          onChange={(e) => handleLogo(e.target.files?.[0])}
        />
        <div className="flex items-center gap-2">
          <Button onClick={() => fileRef.current?.click()}>
            <ImagePlus size={15} aria-hidden />
            {style.logo ? 'Replace image' : 'Upload image'}
          </Button>
          {style.logo && (
            <>
              <img
                src={style.logo}
                alt=""
                className="h-9 w-9 rounded-md border border-line object-contain"
              />
              <Button
                variant="ghost"
                aria-label="Remove logo"
                onClick={() => onChange({ logo: null })}
              >
                <Trash2 size={15} aria-hidden />
              </Button>
            </>
          )}
        </div>
        {style.logo && (
          <Slider
            label="Logo size"
            value={style.logoSize}
            min={0.1}
            max={0.5}
            step={0.02}
            format={(v) => `${Math.round(v * 100)}%`}
            onChange={(v) => onChange({ logoSize: v })}
          />
        )}
      </div>

      <div className="grid gap-4 border-t border-line pt-4 sm:grid-cols-2">
        <Field
          label="Error correction"
          hint="Higher recovery survives damage and logos, but packs more modules in."
        >
          {(id, describedBy) => (
            <Select
              id={id}
              aria-describedby={describedBy}
              value={style.errorCorrection}
              onChange={(e) =>
                onChange({ errorCorrection: e.target.value as ErrorCorrectionLevel })
              }
            >
              {EC_LEVELS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <div className="space-y-4">
          <Slider
            label="Export size"
            value={style.size}
            min={256}
            max={4096}
            step={128}
            format={(v) => `${v}px`}
            onChange={(v) => onChange({ size: v })}
          />
          <Slider
            label="Quiet zone"
            value={style.margin}
            min={0}
            max={80}
            step={4}
            format={(v) => `${v}px`}
            onChange={(v) => onChange({ margin: v })}
          />
        </div>
      </div>
    </div>
  );
}
