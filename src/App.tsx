import { useEffect, useMemo, useState } from 'react';
import type { ContentKind, QrContent, QrStyle } from '@/types/qr';
import { DEFAULT_STYLE, EMPTY_CONTENT } from '@/lib/defaults';
import { buildPayload } from '@/lib/payload';
import { assessCapacity, isBlank, validateContent } from '@/lib/validation';
import { assessScannability } from '@/lib/contrast';
import { fileNameFor } from '@/lib/qrOptions';
import { pressCheck } from '@/lib/readiness';
import { decodeDesign } from '@/lib/share';
import type { Job } from '@/lib/jobs';
import { useModuleCount } from '@/hooks/useProofLab';
import { Sheet } from '@/components/Sheet';
import { Hero, SAMPLE_PAYLOAD } from '@/components/Hero';
import { CorrectionProof } from '@/components/CorrectionProof';
import { Studio } from '@/components/Studio';
import { DistanceProof } from '@/components/DistanceProof';
import { Imprint } from '@/components/Imprint';
import { Faq } from '@/components/Faq';

/** A design handed over from the proof wall or the challenge, if any. */
function readLinkedDesign(): Partial<QrStyle> | null {
  try {
    const token = new URLSearchParams(window.location.search).get('design');
    return token ? decodeDesign(token) : null;
  } catch {
    return null;
  }
}

/** The proof's slug number: today's date, the way a print job is logged. */
const PROOF_NUMBER = new Date().toISOString().slice(2, 10).split('-').reverse().join('.');

export default function App() {
  const [kind, setKind] = useState<ContentKind>('url');
  // Each tab keeps its own draft, so switching away and back is lossless.
  const [drafts, setDrafts] = useState<Record<ContentKind, QrContent>>(EMPTY_CONTENT);
  const [style, setStyle] = useState<QrStyle>(() => ({
    ...DEFAULT_STYLE,
    ...readLinkedDesign(),
  }));

  // A linked design has been applied; drop it from the address bar so a
  // reload or a shared link does not keep overriding later edits.
  useEffect(() => {
    if (!window.location.search.includes('design=')) return;
    const url = new URL(window.location.href);
    url.searchParams.delete('design');
    window.history.replaceState(null, '', url.pathname + url.search + url.hash);
  }, []);

  const content = drafts[kind];
  const ownPayload = useMemo(() => buildPayload(content), [content]);
  const validation = useMemo(() => validateContent(content), [content]);
  // A blank ticket shows the sample proof everywhere at once, and every
  // reading on the page describes that sample, never an empty payload.
  const sample = isBlank(content);
  const payload = sample ? SAMPLE_PAYLOAD : ownPayload;
  const capacity = useMemo(
    () => assessCapacity(payload, style.errorCorrection),
    [payload, style.errorCorrection],
  );
  const scannability = useMemo(
    () =>
      assessScannability(
        style.foreground,
        style.transparentBackground ? '#ffffff' : style.background,
        style.useGradient ? style.gradientTo : undefined,
      ),
    [
      style.foreground,
      style.background,
      style.transparentBackground,
      style.useGradient,
      style.gradientTo,
    ],
  );
  const moduleCount = useModuleCount(payload, style.errorCorrection);
  const checks = useMemo(
    () => pressCheck({ style, scannability, capacity, moduleCount }),
    [style, scannability, capacity, moduleCount],
  );

  const urlDraft = drafts.url.kind === 'url' ? drafts.url.url : '';
  const urlValidation = useMemo(() => validateContent(drafts.url), [drafts.url]);

  const updateStyle = (patch: Partial<QrStyle>) =>
    setStyle((prev) => ({ ...prev, ...patch }));

  const loadJob = (job: Job) => {
    setKind(job.kind);
    updateStyle(job.style);
  };

  return (
    <Sheet page="studio" proofNumber={`Proof ${PROOF_NUMBER}`}>
      <Hero
        url={urlDraft}
        urlError={urlValidation.errors.url}
        onUrlChange={(url) => {
          setKind('url');
          setDrafts((d) => ({ ...d, url: { kind: 'url', url } }));
        }}
        payload={payload}
        sample={sample}
        ready={validation.ready && !sample}
        style={style}
        scannability={scannability}
        capacity={capacity}
        moduleCount={moduleCount}
        checks={checks}
        fileName={fileNameFor(kind)}
      />
      <CorrectionProof />
      <Studio
        kind={kind}
        onKindChange={setKind}
        content={content}
        errors={validation.errors}
        onContentChange={(next) => setDrafts((d) => ({ ...d, [kind]: next }))}
        style={style}
        onStyleChange={updateStyle}
        onJob={loadJob}
        payload={payload}
        sample={sample}
        ready={validation.ready && !sample}
        fileName={fileNameFor(kind)}
        scannability={scannability}
        capacity={capacity}
        checks={checks}
      />
      <DistanceProof
        payload={validation.ready || sample ? payload : SAMPLE_PAYLOAD}
        style={style}
        sample={sample || !validation.ready}
      />
      <Imprint />
      <Faq />
    </Sheet>
  );
}
