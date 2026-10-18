import { useEffect, useMemo, useRef, useState } from 'react';
import { m, useInView } from 'motion/react';
import { clsx } from 'clsx';
import { assessScannability } from '@/lib/contrast';
import { DISTANCE_LADDER } from '@/lib/ladder';
import type { LadderResult } from '@/lib/proofLab';
import { studioLinkFor } from '@/lib/share';
import { WALL, WALL_PAYLOAD } from '@/lib/wall';
import type { WallDesign } from '@/lib/wall';
import { useQrCode } from '@/hooks/useQrCode';
import { LadderWedge } from './proof/LadderWedge';
import { ProofMark } from './proof/Marks';

function Tile({
  design,
  rank,
  result,
  measuring,
}: {
  design: WallDesign;
  rank: number | null;
  result: LadderResult | null | undefined;
  measuring: boolean;
}) {
  const { containerRef } = useQrCode(WALL_PAYLOAD, design.style, 280);
  const report = assessScannability(
    design.style.foreground,
    design.style.transparentBackground ? '#ffffff' : design.style.background,
    design.style.useGradient ? design.style.gradientTo : undefined,
  );
  const rung = result?.rung;

  return (
    <article aria-label={design.name} className="flex h-full flex-col">
      <div className="relative p-4" style={{ background: design.style.background }}>
        <div
          ref={containerRef}
          aria-hidden
          className="mx-auto max-w-[220px] [&>canvas]:block [&>canvas]:h-auto [&>canvas]:w-full"
        />
        <span className="type-reading absolute left-0 top-0 border-b border-r border-rule bg-sheet px-2 py-1 text-[15px]">
          {rank === null ? '—' : `#${rank}`}
        </span>
      </div>
      <div className="flex flex-1 flex-col border-t border-rule px-3 pb-3 pt-2.5">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="text-[16px] font-bold">{design.name}</h3>
          <span className="type-label text-ink-3">{design.source}</span>
        </div>
        <p className="text-[13px] text-ink-2">{design.note}</p>
        <dl className="mt-3 grid grid-cols-2 gap-2 text-[13px]">
          <div>
            <dt className="type-label text-ink-2">Weakest</dt>
            <dd
              className={clsx(
                'type-reading text-[17px]',
                report.risk === 'fail' && 'text-magenta-ink',
              )}
            >
              {report.ratio.toFixed(1)}:1
            </dd>
          </div>
          <div>
            <dt className="type-label text-ink-2">Rungs read</dt>
            <dd className="type-reading flex items-center gap-1.5 text-[17px]">
              {rung === undefined ? (
                measuring ? (
                  'Measuring'
                ) : (
                  '…'
                )
              ) : rung < 0 ? (
                <>
                  <ProofMark kind="fail" size={12} /> No read
                </>
              ) : (
                `${rung + 1} of ${DISTANCE_LADDER.length}`
              )}
            </dd>
          </div>
        </dl>
        <LadderWedge
          trace={result?.trace ?? null}
          status={result ? 'ready' : measuring ? 'running' : 'idle'}
          compact
          className="mt-3"
        />
        <a
          href={studioLinkFor(design.style)}
          className="mt-3 self-start text-[14px] font-semibold underline decoration-hair decoration-2 underline-offset-4 hover:decoration-ink"
        >
          Open in the studio
        </a>
      </div>
    </article>
  );
}

/**
 * A contact sheet of proofs, every one measured on this device and hung in
 * the order it reads: furthest rung first. The wall re-hangs itself as the
 * measurements come in, one design at a time so the page stays responsive.
 */
export function ProofWall() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '300px' });
  const [results, setResults] = useState<Record<string, LadderResult | null>>({});
  const [current, setCurrent] = useState<string | null>(null);

  useEffect(() => {
    if (!inView) return;
    const controller = new AbortController();
    void (async () => {
      const { walkLadder } = await import('@/lib/proofLab');
      for (const design of WALL) {
        if (controller.signal.aborted) return;
        setCurrent(design.id);
        // Measured one at a time on purpose: twenty decodes each, and the
        // page has to stay usable while they run.
        // oxlint-disable-next-line no-await-in-loop
        const result = await walkLadder(WALL_PAYLOAD, design.style, controller.signal);
        if (controller.signal.aborted) return;
        setResults((prev) => ({ ...prev, [design.id]: result }));
      }
      setCurrent(null);
    })();
    return () => controller.abort();
  }, [inView]);

  const ordered = useMemo(() => {
    const score = (d: WallDesign) => results[d.id]?.rung ?? -2;
    return [...WALL].sort((a, b) => score(b) - score(a));
  }, [results]);

  const measured = Object.keys(results).length;
  const ranks = new Map(
    ordered.filter((d) => results[d.id] !== undefined).map((d, i) => [d.id, i + 1]),
  );

  return (
    <section aria-labelledby="wall-title" className="border-b border-rule">
      <div className="px-4 pb-6 pt-10 sm:px-6 lg:px-10 lg:pt-14">
        <h1 id="wall-title" className="type-display max-w-[12ch] text-balance">
          The proof wall.
        </h1>
        <div className="mt-6 flex flex-wrap items-end justify-between gap-6">
          <p className="max-w-[40rem] text-[19px] leading-snug text-ink-2">
            Twelve designs, each run down the twenty-rung ladder and read by a real
            decoder on this device, then hung by how far they read. Same link in every
            code, so only the design differs.
          </p>
          <p aria-live="polite" className="type-label text-ink-2">
            {measured < WALL.length
              ? `Measured ${measured} of ${WALL.length}`
              : `All ${WALL.length} measured · ${DISTANCE_LADDER.length} rungs each`}
          </p>
        </div>
      </div>

      <div ref={ref}>
        <ol className="grid border-t border-rule sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {ordered.map((design) => (
            <m.li
              key={design.id}
              layout
              transition={{ type: 'spring', stiffness: 260, damping: 32 }}
              className="border-b border-rule sm:border-r"
            >
              <Tile
                design={design}
                rank={ranks.get(design.id) ?? null}
                result={results[design.id]}
                measuring={current === design.id}
              />
            </m.li>
          ))}
        </ol>
      </div>
    </section>
  );
}
