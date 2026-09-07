import { useState } from 'react';
import { clsx } from 'clsx';
import { Check, Copy, Download } from 'lucide-react';
import type { CapacityReport } from '@/lib/validation';
import type { ScannabilityReport } from '@/lib/contrast';
import type { ExportFormat, QrStyle } from '@/types/qr';
import { useQrCode } from '@/hooks/useQrCode';
import { ScannabilityBadge } from './ScannabilityBadge';
import { Button } from './ui/Button';
import { Select } from './ui/Input';

interface QrPreviewProps {
  payload: string;
  style: QrStyle;
  ready: boolean;
  fileName: string;
  scannability: ScannabilityReport;
  capacity: CapacityReport;
}

const FORMATS: ExportFormat[] = ['png', 'svg', 'jpeg', 'webp'];

export function QrPreview({
  payload,
  style,
  ready,
  fileName,
  scannability,
  capacity,
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

  return (
    <div className="space-y-4">
      <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-2xl border border-line bg-[linear-gradient(45deg,#00000008_25%,transparent_25%,transparent_75%,#00000008_75%),linear-gradient(45deg,#00000008_25%,transparent_25%,transparent_75%,#00000008_75%)] bg-[length:16px_16px] bg-[position:0_0,8px_8px] p-6 shadow-[inset_0_1px_2px_rgb(0_0_0/0.04)]">
        <div
          ref={containerRef}
          aria-hidden={!ready}
          className={clsx(
            '[&>canvas]:h-auto [&>canvas]:w-full [&>canvas]:max-w-[360px] [&>svg]:h-auto [&>svg]:w-full',
            'transition-opacity duration-200',
            ready ? 'opacity-100' : 'opacity-15 blur-[1px]',
          )}
        />
        {!ready && (
          <p className="absolute inset-x-6 bottom-6 text-center text-sm text-ink-subtle">
            Fill in the details to generate your code.
          </p>
        )}
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-lg bg-danger-soft px-3 py-2 text-xs text-danger"
        >
          {error}
        </p>
      )}

      {ready && <ScannabilityBadge report={scannability} />}

      <div className="space-y-1.5">
        <div className="flex items-baseline justify-between text-xs">
          <span className="text-ink-muted">Capacity</span>
          <span
            className={clsx(
              'font-mono',
              capacity.overflow ? 'text-danger' : 'text-ink-subtle',
            )}
          >
            {capacity.bytes} / {capacity.limit} bytes
          </span>
        </div>
        <div
          className="h-1.5 overflow-hidden rounded-full bg-line"
          role="progressbar"
          aria-label="Payload capacity used"
          aria-valuenow={Math.round(Math.min(capacity.usage, 1) * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className={clsx(
              'h-full rounded-full transition-all',
              capacity.overflow
                ? 'bg-danger'
                : capacity.usage > 0.8
                  ? 'bg-warn'
                  : 'bg-accent',
            )}
            style={{ width: `${Math.min(capacity.usage, 1) * 100}%` }}
          />
        </div>
        {capacity.overflow && (
          <p role="alert" className="text-xs text-danger">
            Too much data for a single symbol. Shorten the content or drop the error
            correction level.
          </p>
        )}
      </div>

      <div className="flex gap-2">
        <Select
          value={format}
          aria-label="Export format"
          onChange={(e) => setFormat(e.target.value as ExportFormat)}
          className="h-11 w-24 shrink-0 rounded-xl"
        >
          {FORMATS.map((f) => (
            <option key={f} value={f}>
              {f.toUpperCase()}
            </option>
          ))}
        </Select>
        <Button
          variant="primary"
          className="h-11 flex-1 rounded-xl text-[14.5px] font-semibold shadow-[var(--shadow-float)]"
          disabled={blocked}
          onClick={() => void download(format, fileName)}
        >
          <Download size={16} aria-hidden />
          Download
        </Button>
        <Button
          aria-label="Copy PNG to clipboard"
          className="h-11 w-11 rounded-xl px-0"
          disabled={blocked}
          onClick={() => void handleCopy()}
        >
          {copied ? <Check size={15} aria-hidden /> : <Copy size={15} aria-hidden />}
        </Button>
      </div>
      <p aria-live="polite" className="sr-only">
        {copied ? 'QR code copied to clipboard' : ''}
      </p>
    </div>
  );
}
