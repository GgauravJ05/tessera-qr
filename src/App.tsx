import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { ShieldCheck } from 'lucide-react';
import type { ContentKind, QrContent, QrStyle } from '@/types/qr';
import { DEFAULT_STYLE, EMPTY_CONTENT } from '@/lib/defaults';
import { buildPayload } from '@/lib/payload';
import { assessCapacity, validateContent } from '@/lib/validation';
import { assessScannability } from '@/lib/contrast';
import { fileNameFor } from '@/lib/qrOptions';
import { useTheme } from '@/hooks/useTheme';
import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { Features } from '@/components/Features';
import { Faq } from '@/components/Faq';
import { Footer } from '@/components/Footer';
import { ContentTabs } from '@/components/ContentTabs';
import { ContentForm } from '@/components/ContentForm';
import { StylePanel } from '@/components/StylePanel';
import { QrPreview } from '@/components/QrPreview';

/** A studio panel with a numbered step header, so the flow reads top to bottom. */
function Panel({
  step,
  title,
  description,
  className,
  children,
}: {
  step: string;
  title: string;
  description: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      className={`rounded-panel min-w-0 border border-line bg-surface p-4 shadow-[var(--shadow-raise)] sm:p-6 lg:p-7 ${className ?? ''}`}
    >
      <div className="mb-5 flex items-start gap-3.5">
        <span className="mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-lg bg-accent-soft font-mono text-[11px] font-semibold text-accent">
          {step}
        </span>
        <div>
          <h2 className="text-[15px] font-semibold tracking-tight">{title}</h2>
          <p className="mt-0.5 text-[13px] text-ink-muted">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

export default function App() {
  const { theme, toggle } = useTheme();
  const [kind, setKind] = useState<ContentKind>('url');
  // Each tab keeps its own draft, so switching away and back is lossless.
  const [drafts, setDrafts] = useState<Record<ContentKind, QrContent>>(EMPTY_CONTENT);
  const [style, setStyle] = useState<QrStyle>(DEFAULT_STYLE);

  const content = drafts[kind];
  const payload = useMemo(() => buildPayload(content), [content]);
  const validation = useMemo(() => validateContent(content), [content]);
  const capacity = useMemo(
    () => assessCapacity(payload, style.errorCorrection),
    [payload, style.errorCorrection],
  );
  const scannability = useMemo(
    () =>
      assessScannability(
        style.foreground,
        style.transparentBackground ? '#ffffff' : style.background,
      ),
    [style.foreground, style.background, style.transparentBackground],
  );

  const updateStyle = (patch: Partial<QrStyle>) =>
    setStyle((prev) => ({ ...prev, ...patch }));

  return (
    <div className="min-h-dvh">
      <Header theme={theme} onToggleTheme={toggle} />

      <main>
        <Hero />

        <div id="studio" className="mx-auto max-w-[1240px] px-4 py-14 sm:px-6 sm:py-24">
          <div className="mb-10 max-w-2xl">
            <p className="eyebrow">The studio</p>
            <h2 className="text-section-title mt-3 text-balance">
              Pick your content, style it, take the file.
            </h2>
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_396px] lg:items-start lg:gap-8">
            <div className="animate-rise min-w-0 space-y-6">
              <Panel
                step="01"
                title="Content"
                description="What the code should do when someone scans it."
              >
                <ContentTabs value={kind} onChange={setKind} />
                <div className="mt-6">
                  <ContentForm
                    content={content}
                    errors={validation.errors}
                    onChange={(next) => setDrafts((d) => ({ ...d, [kind]: next }))}
                  />
                </div>
              </Panel>

              <Panel
                step="02"
                title="Design"
                description="Shape, colour and finish — checked for scannability as you go."
              >
                <StylePanel style={style} onChange={updateStyle} />
              </Panel>
            </div>

            <aside className="animate-rise delay-1 min-w-0 lg:sticky lg:top-24">
              <Panel step="03" title="Preview" description="Live render at full quality.">
                <QrPreview
                  payload={payload}
                  style={style}
                  ready={validation.ready}
                  fileName={fileNameFor(kind)}
                  scannability={scannability}
                  capacity={capacity}
                />
              </Panel>

              <p className="mt-4 flex gap-2.5 px-1 text-xs leading-relaxed text-ink-subtle">
                <ShieldCheck size={15} className="mt-px shrink-0 text-ok" aria-hidden />
                <span>
                  Nothing you type here leaves your device — encoding and rendering happen
                  locally. Print at 2&nbsp;cm or larger and test with two phones before a
                  large run.
                </span>
              </p>
            </aside>
          </div>
        </div>

        <Features />
        <Faq />
      </main>

      <Footer />
    </div>
  );
}
