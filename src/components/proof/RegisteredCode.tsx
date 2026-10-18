import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { useInView, useReducedMotion } from 'motion/react';
import { clsx } from 'clsx';
import type { QrStyle } from '@/types/qr';
import { toQrOptions } from '@/lib/qrOptions';

/** Where each process plate lands before it is pulled into register. */
const PLATES = [
  { ink: 'var(--cyan)', x: -10, y: 7 },
  { ink: 'var(--magenta)', x: 9, y: -6 },
  { ink: 'var(--yellow)', x: 6, y: 10 },
] as const;

/**
 * The live symbol, printed the way a press prints it. On first sight three
 * process plates arrive out of register, pull into alignment and give way to
 * the black, which is the code itself. After that it is simply the live
 * render, and every edit redraws it at once.
 *
 * The plates are masks cut from this payload's own modules, so what slides
 * into register is the visitor's code, not an illustration of one.
 */
export function RegisteredCode({
  containerRef,
  payload,
  style,
  label,
  className,
}: {
  containerRef: RefObject<HTMLDivElement | null>;
  payload: string;
  style: QrStyle;
  label: string;
  className?: string;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const inView = useInView(frameRef, { once: true, amount: 0.5 });
  const reduce = useReducedMotion();
  const [mask, setMask] = useState<string | null>(null);
  const [settled, setSettled] = useState(false);
  // The plates are the arrival, not a live layer, so they are cut once from
  // whatever the visitor first sees.
  const first = useRef({ payload, style });

  useEffect(() => {
    if (reduce) return;
    let url: string | null = null;
    let cancelled = false;
    const { payload: p, style: s } = first.current;
    void import('qr-code-styling')
      .then(async ({ default: QRCodeStyling }) => {
        const qr = new QRCodeStyling(
          toQrOptions(
            p,
            {
              ...s,
              foreground: '#000000',
              useGradient: false,
              transparentBackground: true,
              logo: null,
            },
            480,
          ),
        );
        const raw = await qr.getRawData('png');
        if (!raw || cancelled) return;
        url = URL.createObjectURL(
          raw instanceof Blob ? raw : new Blob([raw as BlobPart]),
        );
        setMask(url);
      })
      // Without the plates the code simply appears in register, which is
      // what reduced motion shows anyway.
      .catch(() => {});
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [reduce]);

  // Two frames after the plates mount they are released, so the browser has
  // painted them out of register before the transition pulls them in.
  const [aligned, setAligned] = useState(false);
  useEffect(() => {
    if (!mask || !inView || reduce) return;
    let raf = requestAnimationFrame(() => {
      raf = requestAnimationFrame(() => setAligned(true));
    });
    const done = window.setTimeout(() => setSettled(true), 2400);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(done);
    };
  }, [mask, inView, reduce]);

  return (
    <div ref={frameRef} className={clsx('relative', className)}>
      <div
        ref={containerRef}
        role="img"
        aria-label={label}
        className="w-full [&>canvas]:block [&>canvas]:h-auto [&>canvas]:w-full"
      />
      {mask && !settled && !reduce && (
        <div aria-hidden className="pointer-events-none absolute inset-0">
          {PLATES.map((plate, i) => (
            <span
              key={plate.ink}
              // Always multiply: the code is printed on white stock in either
              // theme, and ink on paper only ever darkens it.
              className="absolute inset-0 mix-blend-multiply"
              style={{
                background: plate.ink,
                maskImage: `url(${mask})`,
                WebkitMaskImage: `url(${mask})`,
                maskSize: '100% 100%',
                WebkitMaskSize: '100% 100%',
                transform: aligned ? 'none' : `translate(${plate.x}px, ${plate.y}px)`,
                opacity: aligned ? 0 : 0.9,
                transition: `transform 900ms cubic-bezier(0.16, 1, 0.3, 1) ${300 + i * 140}ms, opacity 600ms cubic-bezier(0.16, 1, 0.3, 1) ${1150 + i * 120}ms`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
