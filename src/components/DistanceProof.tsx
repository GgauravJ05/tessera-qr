import { useEffect, useRef, useState } from 'react';
import { useInView } from 'motion/react';
import type { QrStyle } from '@/types/qr';
import { DISTANCE_LADDER } from '@/lib/ladder';
import type { ProofSource } from '@/lib/proofLab';
import { useLadder } from '@/hooks/useProofLab';
import { LadderWedge } from './proof/LadderWedge';
import { ProofMark } from './proof/Marks';
import { Reading } from './proof/Reading';

/**
 * Move the camera away. One parameter, the ladder rung, drives the whole
 * section: the image is what the lab's simulated camera captures at that
 * rung, decoded live; the wedge beneath is the same decode at every rung.
 * It runs on the visitor's own design, so styling it in the studio changes
 * where it breaks.
 */
export function DistanceProof({
  payload,
  style,
  sample,
}: {
  payload: string;
  style: QrStyle;
  sample: boolean;
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Measured once it has been seen, and kept: scrolling past must not throw
  // away a finished walk.
  const inView = useInView(sectionRef, { once: true, margin: '200px' });
  const [rung, setRung] = useState(8);
  const [decoded, setDecoded] = useState<boolean | null>(null);
  const sourceRef = useRef<{ key: string; source: ProofSource } | null>(null);
  const { status, result } = useLadder(payload, style, inView);

  // The capture at the chosen rung, drawn at the camera's own pixel count.
  useEffect(() => {
    if (!inView || !payload) return;
    let cancelled = false;
    const key = JSON.stringify([payload, style]);
    const timer = window.setTimeout(async () => {
      const lab = await import('@/lib/proofLab');
      if (sourceRef.current?.key !== key) {
        sourceRef.current?.source.bitmap.close();
        const source = await lab.renderSource(payload, style);
        if (cancelled || !source) return;
        sourceRef.current = { key, source };
      }
      const img = await lab.capture(
        sourceRef.current.source,
        DISTANCE_LADDER[rung]!,
        1 + rung * 7919,
      );
      if (cancelled) return;
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = img.width;
        canvas.height = img.height;
        canvas.getContext('2d')?.putImageData(img, 0, 0);
      }
      const ok = await lab.decodes(img, payload);
      if (!cancelled) setDecoded(ok);
    }, 60);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [payload, style, rung, inView]);

  useEffect(() => () => sourceRef.current?.source.bitmap.close(), []);

  const current = DISTANCE_LADDER[rung]!;
  const last = result?.rung;

  return (
    <section
      ref={sectionRef}
      aria-labelledby="distance-title"
      className="border-b border-rule"
    >
      <div className="grid gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-14 lg:px-10 lg:py-20">
        <div className="min-w-0 lg:order-2">
          <h2 id="distance-title" className="type-title max-w-[13ch] text-balance">
            Now hold it further away.
          </h2>
          <p className="mt-6 max-w-[36rem] text-[17px] leading-relaxed text-ink-2">
            As a camera backs off, each module lands on fewer pixels and the lens blurs
            them together. Drag the ladder to move it. This is{' '}
            {sample ? 'a sample code' : 'your code'}, captured the way Tessera&rsquo;s lab
            simulates a phone, and handed to a real decoder at every step.
          </p>

          <div className="mt-8 max-w-[36rem]">
            <label
              htmlFor="distance-rung"
              className="type-label flex justify-between text-ink-2"
            >
              <span>Camera distance</span>
              <span>
                Rung {rung + 1} of {DISTANCE_LADDER.length}
              </span>
            </label>
            <input
              id="distance-rung"
              type="range"
              min={0}
              max={DISTANCE_LADDER.length - 1}
              value={rung}
              onChange={(e) => setRung(Number(e.target.value))}
              aria-valuetext={`Rung ${rung + 1} of ${DISTANCE_LADDER.length}, ${current.ppm} pixels per module`}
              className="mt-1 w-full"
            />

            <dl className="mt-4 grid grid-cols-3 border-l border-t border-rule">
              {[
                { k: 'Pixels a module', v: current.ppm.toFixed(1) },
                { k: 'Blur, modules', v: current.blurModules.toFixed(2) },
                { k: 'Decoded', v: decoded === null ? '…' : decoded ? 'Yes' : 'No' },
              ].map(({ k, v }) => (
                <div key={k} className="border-b border-r border-rule px-3 py-2.5">
                  <dt className="type-label text-ink-2">{k}</dt>
                  <dd className="mt-1 flex items-center gap-1.5 text-[22px] leading-none">
                    {k === 'Decoded' && decoded !== null && (
                      <ProofMark kind={decoded ? 'pass' : 'fail'} size={15} />
                    )}
                    <Reading value={v} />
                  </dd>
                </div>
              ))}
            </dl>

            <LadderWedge
              trace={result?.trace ?? null}
              status={status}
              selected={rung}
              onSelect={setRung}
              className="mt-6"
            />
            <p aria-live="polite" className="mt-3 text-[15px] font-semibold">
              {status !== 'ready' || last === undefined
                ? 'Walking the ladder on this device…'
                : last < 0
                  ? 'It does not decode even at the closest rung. Check the contrast first.'
                  : last === DISTANCE_LADDER.length - 1
                    ? 'It decodes at every rung, down to 1.5 pixels a module.'
                    : `It reads at ${last + 1} of ${DISTANCE_LADDER.length} rungs, down to ${DISTANCE_LADDER[last]!.ppm} pixels a module, then breaks.`}
            </p>
            <p className="mt-4 text-[13px] leading-relaxed text-ink-2">
              Simulated, not photographed: one decoder (jsQR, stricter than most phone
              scanners) and no perspective. Rungs are not distances in centimetres, and
              they will not be quoted as such until real-phone validation is done.{' '}
              <a
                href="/lab/"
                className="font-semibold text-ink underline decoration-hair hover:decoration-ink"
              >
                Read the method
              </a>
            </p>
          </div>
        </div>

        <figure className="min-w-0 lg:order-1">
          <div className="relative mx-auto aspect-square w-full max-w-[560px] border border-rule bg-[#ffffff]">
            <canvas
              ref={canvasRef}
              aria-label={`Simulated camera capture at rung ${rung + 1}`}
              role="img"
              className="pixelated h-full w-full"
            />
            <span className="type-label absolute left-2 top-2 bg-sheet px-1.5 py-1 text-ink">
              Sensor view
            </span>
          </div>
          <figcaption className="type-label mx-auto mt-2 flex max-w-[560px] justify-between gap-3 text-ink-2">
            <span>Each square is one camera pixel</span>
            <span>Noise σ 4 · JPEG 0.9</span>
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
