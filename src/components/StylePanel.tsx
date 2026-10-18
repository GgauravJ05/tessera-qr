import { useRef } from 'react';
import type { ReactNode } from 'react';
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
import type { ProofCheck } from '@/lib/readiness';
import { assessScannability } from '@/lib/contrast';
import { Field } from './ui/Field';
import { Select } from './ui/Input';
import { Button } from './ui/Button';
import { Toggle } from './ui/Toggle';
import { Slider } from './ui/Slider';
import { ProofMark } from './proof/Marks';

interface StylePanelProps {
  style: QrStyle;
  checks: ProofCheck[];
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

/**
 * A group of controls on the ticket, headed by the press-check line it
 * answers to, so a fault is read right beside the controls that cause it.
 */
function Group({
  title,
  note,
  check,
  children,
}: {
  title: string;
  note: string;
  check?: ProofCheck;
  children: ReactNode;
}) {
  return (
    <fieldset className="min-w-0 border-t border-rule pt-5">
      <legend className="sr-only">{title}</legend>
      <div
        aria-hidden={false}
        className="mb-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1"
      >
        <h3 className="type-head">{title}</h3>
        {check ? (
          <span
            className={clsx(
              'flex items-center gap-1.5 text-[14px] font-semibold',
              check.status === 'fail' && 'text-magenta-ink',
            )}
          >
            <ProofMark kind={check.status} size={13} />
            {check.label} {check.reading}
          </span>
        ) : (
          <span className="text-[13px] text-ink-2">{note}</span>
        )}
      </div>
      {check && check.status !== 'pass' && (
        <p className="-mt-2 mb-4 text-[13px] text-ink-2">{check.detail}</p>
      )}
      {children}
    </fieldset>
  );
}

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
            'flex items-stretch border border-rule bg-sheet transition-opacity',
            disabled && 'pointer-events-none opacity-50',
          )}
        >
          <input
            id={id}
            type="color"
            value={value}
            disabled={disabled}
            onChange={(e) => onChange(e.target.value)}
            className="h-11 w-12 shrink-0 border-r border-rule"
            aria-label={`${label} colour picker`}
          />
          <input
            type="text"
            value={value.toUpperCase()}
            disabled={disabled}
            onChange={(e) => onChange(e.target.value)}
            aria-label={`${label} hex value`}
            className="w-full min-w-0 bg-transparent px-3 font-mono text-[14px] uppercase text-ink outline-none focus:bg-tint"
          />
        </div>
      )}
    </Field>
  );
}

export function StylePanel({ style, checks, onChange }: StylePanelProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const check = (id: string) => checks.find((c) => c.id === id);

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
    <div className="space-y-8">
      <Group title="Inks" note="" check={check('contrast')}>
        <div className="mb-5">
          <span className="type-label text-ink-2">Presets</span>
          <div className="mt-2 grid grid-cols-3 border-l border-t border-rule sm:grid-cols-6">
            {PRESETS.map((preset) => {
              const active =
                style.foreground.toLowerCase() === preset.style.foreground &&
                style.dotStyle === preset.style.dotStyle;
              const rating = assessScannability(
                preset.style.foreground,
                preset.style.background,
                preset.style.useGradient ? preset.style.gradientTo : undefined,
              );
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => onChange(preset.style)}
                  aria-pressed={active}
                  className={clsx(
                    'group flex flex-col items-stretch border-b border-r border-rule text-left transition-colors',
                    active ? 'bg-ink text-sheet' : 'hover:bg-tint',
                  )}
                >
                  <span
                    aria-hidden
                    className="block h-8 border-b border-rule"
                    style={{
                      background: preset.style.useGradient
                        ? `linear-gradient(90deg, ${preset.style.foreground}, ${preset.style.gradientTo})`
                        : preset.style.foreground,
                      boxShadow: `inset 0 -10px 0 ${preset.style.background}`,
                    }}
                  />
                  <span className="px-2 pt-1.5 text-[13px] font-semibold">
                    {preset.name}
                  </span>
                  <span
                    aria-hidden
                    className="type-reading px-2 pb-1.5 text-[12px] opacity-80"
                  >
                    {rating.ratio.toFixed(1)}:1
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

        <div className="mt-4 space-y-2 border-t border-hair pt-3">
          <Toggle
            label="Gradient fill"
            description="Blend two colours across the symbol. The paler end is the one rated."
            checked={style.useGradient}
            onChange={(v) => onChange({ useGradient: v })}
          />
          {style.useGradient && (
            <div className="grid gap-4 pb-2 sm:grid-cols-2">
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
            </div>
          )}
          <Toggle
            label="Transparent background"
            description="PNG and SVG only. JPEG falls back to white, and the paper is rated as white."
            checked={style.transparentBackground}
            onChange={(v) => onChange({ transparentBackground: v })}
          />
        </div>
      </Group>

      <Group title="Shape" note="The corners are what a decoder locates first.">
        <div className="grid gap-4 sm:grid-cols-3">
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
      </Group>

      <Group
        title="Centre logo"
        note="A logo covers modules the code has to rebuild."
        check={check('logo')}
      >
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/svg+xml,image/webp"
          className="sr-only"
          tabIndex={-1}
          aria-hidden
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
                className="h-10 w-10 border border-rule object-contain"
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
          <div className="mt-4">
            <Slider
              label="Logo size"
              value={style.logoSize}
              min={0.1}
              max={0.5}
              step={0.02}
              format={(v) => `${Math.round(v * 100)}%`}
              onChange={(v) => onChange({ logoSize: v })}
            />
          </div>
        )}
      </Group>

      <Group title="Output" note="" check={check('quiet')}>
        <div className="grid gap-4 sm:grid-cols-2">
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
              format={(v) => `${v} px`}
              onChange={(v) => onChange({ size: v })}
            />
            <Slider
              label="Quiet zone"
              value={style.margin}
              min={0}
              max={160}
              step={4}
              format={(v) => `${v} px`}
              onChange={(v) => onChange({ margin: v })}
            />
          </div>
        </div>
      </Group>
    </div>
  );
}
