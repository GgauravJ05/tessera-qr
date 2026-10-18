import { useEffect, useRef, useState } from 'react';
import { clsx } from 'clsx';
import { ArrowDown } from 'lucide-react';
import type { ContentKind, QrContent, QrStyle } from '@/types/qr';
import type { ScannabilityReport } from '@/lib/contrast';
import type { CapacityReport } from '@/lib/validation';
import type { ProofCheck } from '@/lib/readiness';
import { verdictOf } from '@/lib/readiness';
import { JOBS } from '@/lib/jobs';
import type { Job } from '@/lib/jobs';
import { ContentTabs } from './ContentTabs';
import { ContentForm } from './ContentForm';
import { StylePanel } from './StylePanel';
import { QrPreview } from './QrPreview';
import { ProofMark } from './proof/Marks';
import { Reading } from './proof/Reading';

/**
 * The studio: the job ticket on the left, filled in top to bottom, and the
 * proof on the right, pinned beside it for as long as the ticket is being
 * worked. On a phone the proof follows below, and a slip pinned to the foot
 * of the screen keeps its verdict in view while the controls scroll.
 */
export function Studio({
  kind,
  onKindChange,
  content,
  errors,
  onContentChange,
  style,
  onStyleChange,
  onJob,
  payload,
  sample,
  ready,
  fileName,
  scannability,
  capacity,
  checks,
}: {
  kind: ContentKind;
  onKindChange: (kind: ContentKind) => void;
  content: QrContent;
  errors: Partial<Record<string, string>>;
  onContentChange: (content: QrContent) => void;
  style: QrStyle;
  onStyleChange: (patch: Partial<QrStyle>) => void;
  onJob: (job: Job) => void;
  payload: string;
  sample: boolean;
  ready: boolean;
  fileName: string;
  scannability: ScannabilityReport;
  capacity: CapacityReport;
  checks: ProofCheck[];
}) {
  const studioRef = useRef<HTMLElement>(null);
  const proofRef = useRef<HTMLDivElement>(null);
  const [slip, setSlip] = useState(false);

  // The slip shows while the studio's controls are on screen and neither the
  // proof nor the hero is, so it never sits over a ticket or a stamp.
  useEffect(() => {
    const studio = studioRef.current;
    const proof = proofRef.current;
    const hero = document.getElementById('hero');
    if (!studio || !proof || typeof IntersectionObserver === 'undefined') return;
    const seen = new Map<Element, boolean>();
    const observer = new IntersectionObserver((entries) => {
      for (const e of entries) seen.set(e.target, e.isIntersecting);
      setSlip(Boolean(seen.get(studio)) && !seen.get(proof) && !(hero && seen.get(hero)));
    });
    observer.observe(studio);
    observer.observe(proof);
    if (hero) observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  const verdict = verdictOf(checks);

  return (
    <section
      ref={studioRef}
      id="studio"
      aria-labelledby="studio-title"
      className="border-b border-rule"
    >
      <div className="px-4 pt-14 sm:px-6 lg:px-10 lg:pt-20">
        <h2 id="studio-title" className="type-title max-w-[16ch] text-balance">
          Fill in the ticket. Read the proof.
        </h2>
        <p className="mt-5 max-w-[40rem] text-[17px] leading-relaxed text-ink-2">
          Every control that can stop a code scanning sits beside the reading it moves.
          Start from a job, or pick the content type yourself.
        </p>

        <div className="mt-8">
          <h3 className="type-label text-ink-2">Start from a job</h3>
          <ul className="mt-2 grid border-l border-t border-rule sm:grid-cols-2 lg:grid-cols-5">
            {JOBS.map((job) => (
              <li key={job.id} className="border-b border-r border-rule">
                <button
                  type="button"
                  onClick={() => onJob(job)}
                  className="group flex h-full w-full flex-col items-start gap-2 px-3 py-3 text-left transition-colors hover:bg-ink hover:text-sheet"
                >
                  <span className="text-[15px] font-bold leading-tight">{job.title}</span>
                  <span className="text-[13px] leading-snug text-ink-2 group-hover:text-sheet/80">
                    {job.reason}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid gap-10 px-4 pb-16 pt-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:gap-12 lg:px-10 lg:pb-20 xl:grid-cols-[minmax(0,1fr)_460px]">
        <div className="min-w-0 space-y-8">
          <fieldset id="studio-ticket" className="min-w-0">
            <legend className="type-head mb-3">What it does</legend>
            <ContentTabs value={kind} onChange={onKindChange} />
            <div className="mt-6">
              <ContentForm content={content} errors={errors} onChange={onContentChange} />
            </div>
          </fieldset>

          <StylePanel style={style} checks={checks} onChange={onStyleChange} />
        </div>

        <aside aria-label="Proof" className="min-w-0 lg:sticky lg:top-20 lg:self-start">
          <div ref={proofRef}>
            <QrPreview
              payload={payload}
              style={style}
              sample={sample}
              ready={ready}
              fileName={fileName}
              scannability={scannability}
              capacity={capacity}
              checks={checks}
            />
          </div>
        </aside>
      </div>

      {/* The proof slip, phones only. */}
      <a
        href="#studio-proof"
        onClick={(e) => {
          e.preventDefault();
          proofRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }}
        aria-hidden={!slip}
        tabIndex={slip ? 0 : -1}
        className={clsx(
          'fixed inset-x-3 bottom-3 z-30 flex items-center gap-3 border-2 border-rule bg-sheet px-3 py-2.5 transition-transform duration-300 lg:hidden',
          slip ? 'translate-y-0' : 'translate-y-[140%]',
        )}
      >
        <ProofMark kind={ready || sample ? verdict : 'note'} size={16} />
        <span className="min-w-0 flex-1 text-[14px] font-bold">
          {sample
            ? 'Sample proof'
            : ready
              ? verdict === 'pass'
                ? 'Passes the press check'
                : verdict === 'warn'
                  ? 'Passes, with notes'
                  : 'Not ready for press'
              : 'Finish the ticket'}
        </span>
        <span className="text-[16px]">
          <Reading value={`${scannability.ratio.toFixed(1)}:1`} />
        </span>
        <span className="type-label inline-flex items-center gap-1 text-ink-2">
          Proof
          <ArrowDown size={13} strokeWidth={2.25} aria-hidden />
        </span>
      </a>
      <span id="studio-proof" />
    </section>
  );
}
