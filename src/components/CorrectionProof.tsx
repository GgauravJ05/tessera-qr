import { useMemo, useRef, useState } from 'react';
import { useInView } from 'motion/react';
import type { QrStyle } from '@/types/qr';
import { DEFAULT_STYLE } from '@/lib/defaults';
import { contrastRatio, strengthenToward } from '@/lib/contrast';
import { DISTANCE_LADDER } from '@/lib/ladder';
import { useQrCode } from '@/hooks/useQrCode';
import { useLadder } from '@/hooks/useProofLab';
import { LadderWedge } from './proof/LadderWedge';
import { ProofMark, RegistrationMark } from './proof/Marks';
import { SAMPLE_PAYLOAD } from './Hero';

/** The design people actually make: black that fades into a pale lilac. */
const DESIGNED: QrStyle = {
  ...DEFAULT_STYLE,
  margin: 0,
  foreground: '#111111',
  background: '#ffffff',
  useGradient: true,
  gradientTo: '#ece8ff',
  // Rotated so the pale end sits on the left, under the design as made, and
  // the dark start on the right reads the same in both renders.
  gradientRotation: 180,
  dotStyle: 'rounded',
  cornerSquareStyle: 'extra-rounded',
  cornerDotStyle: 'dot',
};

const CORRECTED: QrStyle = {
  ...DESIGNED,
  gradientTo: strengthenToward(DESIGNED.gradientTo, DESIGNED.background, 4.5),
};

const ratio = (hex: string) => contrastRatio(hex, DESIGNED.background).toFixed(1);

function verdict(rung: number | undefined, status: string) {
  if (status !== 'ready' || rung === undefined) return 'Decoding on this device…';
  if (rung < 0) return 'Does not decode, even at the closest rung.';
  if (rung === DISTANCE_LADDER.length - 1) return 'Decodes at every rung of the ladder.';
  return `Reads at ${rung + 1} of ${DISTANCE_LADDER.length} rungs, then breaks.`;
}

/**
 * The correction proof. Two renders of one design, one as made and one as
 * Tessera would mark it, under a divider the visitor drags. The ratios are
 * computed, the correction is the studio's own, and both are put through
 * the scanlab distance ladder and a real decoder in the visitor's browser,
 * so the verdict under each is measured, not written.
 */
export function CorrectionProof() {
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, { once: true, margin: '200px' });
  // Opens with most of the sheet showing the design as made, failing end and
  // all, so the first thing seen is the fault; dragging left marks it up.
  const [split, setSplit] = useState(64);

  const { containerRef: designedRef } = useQrCode(SAMPLE_PAYLOAD, DESIGNED, 520);
  const { containerRef: correctedRef } = useQrCode(SAMPLE_PAYLOAD, CORRECTED, 520);
  const before = useLadder(SAMPLE_PAYLOAD, DESIGNED, inView, 0);
  const after = useLadder(SAMPLE_PAYLOAD, CORRECTED, inView, 0);

  const readings = useMemo(
    () => ({
      start: ratio(DESIGNED.foreground),
      end: ratio(DESIGNED.gradientTo),
      fixed: ratio(CORRECTED.gradientTo),
    }),
    [],
  );

  return (
    <section
      ref={sectionRef}
      aria-labelledby="correction-title"
      className="border-b border-rule"
    >
      <div className="grid gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-14 lg:px-10 lg:py-20">
        <div className="min-w-0">
          <h2 id="correction-title" className="type-title max-w-[14ch] text-balance">
            A pretty code can fail on paper.
          </h2>
          <div className="mt-6 max-w-[36rem] space-y-4 text-[17px] leading-relaxed text-ink-2">
            <p>
              Black fading into lilac looks safe. The colour you picked rates{' '}
              <strong className="text-ink">{readings.start}:1</strong> against the paper,
              which most generators report as excellent.
            </p>
            <p>
              The far end rates{' '}
              <strong className="text-magenta-ink">{readings.end}:1</strong>, and the
              modules there have nothing to stand on. Tessera measures the weakest end,
              not the one you chose, and marks the correction: the same hue, darkened just
              far enough to reach <strong className="text-ink">{readings.fixed}:1</strong>
              .
            </p>
          </div>

          <dl className="mt-8 max-w-[36rem] border-t border-rule">
            {[
              { label: 'As designed', ladder: before, mark: 'fail' as const },
              { label: 'As corrected', ladder: after, mark: 'pass' as const },
            ].map(({ label, ladder }) => (
              <div key={label} className="border-b border-rule py-4">
                <dt className="type-label flex items-center justify-between text-ink-2">
                  {label}
                  <span aria-live="polite" className="normal-case tracking-normal">
                    {ladder.status === 'ready' && ladder.result ? (
                      <ProofMark
                        kind={ladder.result.rung >= 8 ? 'pass' : 'fail'}
                        size={13}
                      />
                    ) : null}
                  </span>
                </dt>
                <dd className="mt-1 text-[15px] font-semibold">
                  {verdict(ladder.result?.rung, ladder.status)}
                </dd>
                <LadderWedge
                  trace={ladder.result?.trace ?? null}
                  status={ladder.status}
                  className="mt-3"
                />
              </div>
            ))}
          </dl>
          <p className="mt-3 max-w-[36rem] text-[13px] text-ink-2">
            Decoded by jsQR on this device through the twenty-rung scanlab ladder.{' '}
            <a
              href="/lab/"
              className="font-semibold text-ink underline decoration-hair hover:decoration-ink"
            >
              How the ladder works
            </a>
          </p>
        </div>

        <figure className="min-w-0">
          <div className="relative mx-auto w-full max-w-[600px] select-none border border-rule bg-[#ffffff] p-6 sm:p-10">
            <div className="relative">
              <div
                ref={designedRef}
                aria-hidden
                className="[&>canvas]:block [&>canvas]:h-auto [&>canvas]:w-full"
              />
              <div
                ref={correctedRef}
                aria-hidden
                className="absolute inset-0 [&>canvas]:block [&>canvas]:h-auto [&>canvas]:w-full"
                style={{ clipPath: `inset(0 0 0 ${split}%)` }}
              />

              {/* The proofreader's marks: a ring around the failing end, and
                  the reading written in the margin. */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{ clipPath: `inset(0 ${100 - split}% 0 0)` }}
              >
                <span className="absolute left-[2%] top-[34%] size-[30%] rounded-full border-2 border-magenta" />
                <span className="absolute left-[4%] top-[calc(34%-28px)] bg-magenta px-1.5 py-0.5 text-[12px] font-bold text-on-magenta">
                  {readings.end}:1
                </span>
              </div>

              <div
                aria-hidden
                className="pointer-events-none absolute inset-y-[-24px] w-px bg-magenta sm:inset-y-[-40px]"
                style={{ left: `${split}%` }}
              >
                <RegistrationMark
                  size={26}
                  className="absolute -top-3 left-1/2 -translate-x-1/2 bg-sheet text-magenta-ink"
                />
                <RegistrationMark
                  size={26}
                  className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-sheet text-magenta-ink"
                />
              </div>
            </div>

            <label className="sr-only" htmlFor="correction-split">
              Compare the design as made with the corrected design
            </label>
            <input
              id="correction-split"
              type="range"
              min={0}
              max={100}
              value={split}
              onChange={(e) => setSplit(Number(e.target.value))}
              className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
            />
          </div>
          <figcaption className="mx-auto mt-3 grid max-w-[600px] grid-cols-2 gap-4">
            <span>
              <span className="type-label block text-ink-2">As designed</span>
              <span className="mt-1 flex items-center gap-1.5 text-[15px] font-semibold">
                <ProofMark kind="fail" size={13} />
                Far end {readings.end}:1
              </span>
            </span>
            <span className="text-right">
              <span className="type-label block text-ink-2">As corrected</span>
              <span className="mt-1 inline-flex items-center gap-1.5 text-[15px] font-semibold">
                <ProofMark kind="pass" size={13} />
                Far end {readings.fixed}:1
              </span>
            </span>
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
