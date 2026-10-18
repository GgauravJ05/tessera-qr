import { useState } from 'react';
import { clsx } from 'clsx';
import { Check, Copy } from 'lucide-react';
import type { CapacityReport } from '@/lib/validation';
import type { ScannabilityReport } from '@/lib/contrast';
import type { ProofCheck } from '@/lib/readiness';
import { verdictOf } from '@/lib/readiness';
import type { ExportFormat, QrStyle } from '@/types/qr';
import { useQrCode } from '@/hooks/useQrCode';
import { ScanModelBeta } from './ScanModelBeta';
import { ScannabilityBadge } from './ScannabilityBadge';
import { Button } from './ui/Button';
import { Select } from './ui/Input';
import { ProofMark, RegistrationMark } from './proof/Marks';
import { Stamp } from './proof/Stamp';

interface QrPreviewProps {
  payload: string;
  style: QrStyle;
  /** The ticket is blank, so the proof shows the labelled sample. */
  sample: boolean;
  ready: boolean;
  fileName: string;
  scannability: ScannabilityReport;
  capacity: CapacityReport;
  checks: ProofCheck[];
}

const FORMATS: ExportFormat[] = ['png', 'svg', 'jpeg', 'webp'];

/**
 * The proof itself: the live symbol inside its trim, the press check read off
 * it line by line, and the stamp that exports it. It sits beside the ticket
 * for as long as the ticket is being filled in.
 */
export function QrPreview({
  payload,
  style,
  sample,
  ready,
  fileName,
  scannability,
  capacity,
  checks,
}: QrPreviewProps) {
  const { containerRef, error, download, toBlob } = useQrCode(payload, style);
  const [format, setFormat] = useState<ExportFormat>('png');
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const blob = await toBlob('png');
    if (!blob) return;
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const blocked = !ready || capacity.overflow || Boolean(error);
  // The sample is a real proof of a real code, so it is drawn and read like
  // one; only the visitor's own half-filled ticket has nothing to show yet.
  const shown = sample || ready;

  // A stamp that cannot download yet still does something: it takes the
  // visitor to the field the ticket is waiting on.
  const toTicket = () => {
    const ticket = document.getElementById('studio-ticket');
    const target =
      ticket?.querySelector<HTMLElement>('[aria-invalid="true"]') ??
      ticket?.querySelector<HTMLElement>('input, textarea');
    target?.focus();
  };
  const stampDetail = !blocked
    ? `Download ${format.toUpperCase()}`
    : sample
      ? 'Add your content first'
      : capacity.overflow
        ? 'Too much data to fit'
        : 'Fix the ticket first';
  const measured = checks.filter((c) => c.status !== 'note');
  const notes = checks.filter((c) => c.status === 'note');

  return (
    <div className="space-y-5">
      <div className="relative px-5 py-5">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 border border-dashed border-ink-3"
        />
        <RegistrationMark
          size={16}
          className="absolute -top-2 left-1/2 -translate-x-1/2 bg-sheet text-ink-2"
        />
        <RegistrationMark
          size={16}
          className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-sheet text-ink-2"
        />
        <div
          className={clsx(
            'relative mx-auto flex aspect-square w-full max-w-[380px] items-center justify-center',
            style.transparentBackground && 'bg-transparency',
          )}
        >
          <div
            ref={containerRef}
            aria-hidden={!shown}
            className={clsx(
              'w-full [&>canvas]:block [&>canvas]:h-auto [&>canvas]:w-full',
              'transition-opacity duration-300',
              shown ? 'opacity-100' : 'opacity-0',
            )}
          />
          {/* The empty state replaces the ghost symbol rather than sitting on
              top of it, so the copy is never read against the pattern. */}
          {!shown && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
              <RegistrationMark size={30} className="text-ink-3" />
              <p className="max-w-[22ch] text-balance text-[15px] font-semibold leading-snug text-ink-2">
                Finish the marked fields to generate your code.
              </p>
            </div>
          )}
        </div>
        {sample && (
          <p className="type-label absolute left-0 top-0 border-b border-r border-rule bg-sheet px-2 py-1 text-ink">
            Sample proof
          </p>
        )}
      </div>
      {sample && (
        <p className="-mt-2 text-[14px] font-semibold text-ink-2">
          Fill in the details to generate your code. Until then, this is the sample.
        </p>
      )}

      {error && (
        <p
          role="alert"
          className="flex items-center gap-2 border-2 border-magenta px-3 py-2 text-[13px] font-semibold text-magenta-ink"
        >
          <ProofMark kind="fail" size={12} />
          {error}
        </p>
      )}

      {shown && <ScannabilityBadge report={scannability} />}

      {shown && (
        <div>
          <h3 className="type-label text-ink-2">Press check</h3>
          <ul className="mt-2 border-t border-rule">
            {measured
              .filter((c) => c.id !== 'contrast')
              .map((c) => (
                <li
                  key={c.id}
                  className="flex items-start gap-2.5 border-b border-hair py-2"
                >
                  <ProofMark kind={c.status} size={13} className="mt-1" />
                  <span className="min-w-0 flex-1">
                    <span className="flex justify-between gap-3 text-[14px] font-semibold">
                      <span>{c.label}</span>
                      <span className="type-reading">{c.reading}</span>
                    </span>
                    {c.status !== 'pass' && (
                      <span className="block text-[13px] text-ink-2">{c.detail}</span>
                    )}
                  </span>
                </li>
              ))}
            {notes.map((c) => (
              <li
                key={c.id}
                className="flex items-start gap-2.5 border-b border-hair py-2"
              >
                <ProofMark kind="note" size={13} className="mt-1" />
                <span className="text-[13px] text-ink-2">{c.detail}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {shown && <ScanModelBeta payload={payload} style={style} />}

      <div className="space-y-1.5">
        <div className="flex items-baseline justify-between text-[13px]">
          <span className="type-label text-ink-2">Capacity</span>
          <span
            className={clsx(
              'type-reading',
              capacity.overflow ? 'text-magenta-ink' : 'text-ink',
            )}
          >
            {capacity.bytes} / {capacity.limit} bytes
          </span>
        </div>
        <div
          className="h-2.5 border border-rule"
          role="progressbar"
          aria-label="Payload capacity used"
          aria-valuenow={Math.round(Math.min(capacity.usage, 1) * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className={clsx(
              'h-full transition-[width] duration-300',
              capacity.overflow
                ? 'bg-magenta'
                : capacity.usage > 0.8
                  ? 'bg-yellow'
                  : 'bg-ink',
            )}
            style={{ width: `${Math.min(capacity.usage, 1) * 100}%` }}
          />
        </div>
        {capacity.overflow && (
          <p role="alert" className="text-[13px] font-semibold text-magenta-ink">
            Too much data for a single symbol. Shorten the content or drop the error
            correction level.
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-end gap-3 border-t border-rule pt-5">
        <Stamp
          size="md"
          verdict={sample || ready ? verdictOf(checks) : 'fail'}
          detail={stampDetail}
          onPress={() => (blocked ? toTicket() : download(format, fileName))}
          className="flex-1"
        />
        <div className="flex gap-2">
          <div className="w-[96px]">
            <Select
              value={format}
              aria-label="Export format"
              onChange={(e) => setFormat(e.target.value as ExportFormat)}
              className="h-12"
            >
              {FORMATS.map((f) => (
                <option key={f} value={f}>
                  {f.toUpperCase()}
                </option>
              ))}
            </Select>
          </div>
          <Button
            aria-label="Copy PNG to clipboard"
            className="h-12 w-12 px-0"
            disabled={blocked}
            onClick={() => void handleCopy()}
          >
            {copied ? <Check size={16} aria-hidden /> : <Copy size={16} aria-hidden />}
          </Button>
        </div>
      </div>
      <p aria-live="polite" className="sr-only">
        {copied ? 'QR code copied to clipboard' : ''}
      </p>
    </div>
  );
}
