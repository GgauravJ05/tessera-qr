import { useEffect, useRef, useState } from 'react';
import { useInView } from 'motion/react';
import type { QrStyle } from '@/types/qr';
import { DISTANCE_LADDER } from '@/lib/ladder';
import { ProofMark } from './proof/Marks';

/** Spread so the break usually falls somewhere inside the row. */
const SAMPLE_RUNGS: readonly number[] = [0, 6, 12, 17];

/**
 * Four rungs of the ladder, captured and decoded on this device: the method
 * shown working rather than described.
 */
export function LadderSamples({ payload, style }: { payload: string; style: QrStyle }) {
  const ref = useRef<HTMLDivElement>(null);
  const canvases = useRef<(HTMLCanvasElement | null)[]>([]);
  const inView = useInView(ref, { once: true, margin: '200px' });
  const [results, setResults] = useState<(boolean | null)[]>(() =>
    SAMPLE_RUNGS.map(() => null),
  );

  useEffect(() => {
    if (!inView) return;
    let cancelled = false;
    void (async () => {
      const lab = await import('@/lib/proofLab');
      const source = await lab.renderSource(payload, style);
      if (!source || cancelled) return;
      try {
        const next: (boolean | null)[] = [];
        for (const [i, r] of SAMPLE_RUNGS.entries()) {
          // oxlint-disable-next-line no-await-in-loop
          const img = await lab.capture(source, DISTANCE_LADDER[r]!, 1 + r * 7919);
          const canvas = canvases.current[i];
          if (canvas) {
            canvas.width = img.width;
            canvas.height = img.height;
            canvas.getContext('2d')?.putImageData(img, 0, 0);
          }
          // oxlint-disable-next-line no-await-in-loop
          next.push(await lab.decodes(img, payload));
          if (cancelled) return;
          setResults([...next, ...SAMPLE_RUNGS.slice(next.length).map(() => null)]);
        }
      } finally {
        source.bitmap.close();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [inView, payload, style]);

  return (
    <div
      ref={ref}
      className="grid grid-cols-2 border-l border-t border-rule sm:grid-cols-4"
    >
      {SAMPLE_RUNGS.map((r, i) => {
        const rung = DISTANCE_LADDER[r]!;
        const ok = results[i];
        return (
          <figure key={rung.name} className="border-b border-r border-rule">
            <div className="aspect-square bg-[#ffffff] p-2">
              <canvas
                ref={(el) => {
                  canvases.current[i] = el;
                }}
                role="img"
                aria-label={`Capture at rung ${r + 1} of ${DISTANCE_LADDER.length}`}
                className="pixelated h-full w-full"
              />
            </div>
            <figcaption className="border-t border-rule px-2.5 py-2">
              <span className="type-label block text-ink-2">Rung {r + 1}</span>
              <span className="mt-0.5 flex items-center justify-between text-[14px] font-semibold">
                <span className="type-reading">
                  {rung.ppm} px · {rung.blurModules} blur
                </span>
                {ok !== null && <ProofMark kind={ok ? 'pass' : 'fail'} size={13} />}
              </span>
              <span className="sr-only">
                {ok === null ? 'Decoding' : ok ? 'Decoded' : 'Did not decode'}
              </span>
            </figcaption>
          </figure>
        );
      })}
    </div>
  );
}
