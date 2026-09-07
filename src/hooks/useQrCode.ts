import { useEffect, useRef, useState } from 'react';
import QRCodeStyling from 'qr-code-styling';
import type { ExportFormat, QrStyle } from '@/types/qr';
import { toQrOptions } from '@/lib/qrOptions';

/** On-screen preview resolution; exports re-render at the chosen output size. */
const PREVIEW_SIZE = 360;

/**
 * Owns the QRCodeStyling instance for the live preview and produces
 * full-resolution downloads on demand.
 */
export function useQrCode(payload: string, style: QrStyle) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const instanceRef = useRef<QRCodeStyling | null>(null);
  const [error, setError] = useState<string | null>(null);

  // The QR library renders imperatively into the DOM, so its failures can only
  // surface from the effect that drives it.
  // oxlint-disable react/set-state-in-effect
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    try {
      const options = toQrOptions(payload || ' ', style, PREVIEW_SIZE);
      if (!instanceRef.current) {
        instanceRef.current = new QRCodeStyling(options);
        instanceRef.current.append(container);
      } else {
        instanceRef.current.update(options);
      }
      setError(null);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'This content could not be encoded.',
      );
    }
  }, [payload, style]);
  // oxlint-enable react/set-state-in-effect

  /** Renders a fresh instance at full output size and triggers a download. */
  const download = async (format: ExportFormat, name: string) => {
    const exporter = new QRCodeStyling({
      ...toQrOptions(payload, style, style.size),
      type: format === 'svg' ? 'svg' : 'canvas',
    });
    await exporter.download({ name, extension: format });
  };

  /** Returns the rendered symbol as a Blob, for copying to the clipboard. */
  const toBlob = async (format: ExportFormat): Promise<Blob | null> => {
    const exporter = new QRCodeStyling({
      ...toQrOptions(payload, style, style.size),
      type: format === 'svg' ? 'svg' : 'canvas',
    });
    const data = await exporter.getRawData(format);
    if (!data) return null;
    return data instanceof Blob ? data : new Blob([data as BlobPart]);
  };

  return { containerRef, error, download, toBlob, previewSize: PREVIEW_SIZE };
}
