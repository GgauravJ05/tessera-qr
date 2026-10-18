import type { ReactNode } from 'react';
import { clsx } from 'clsx';
import { DEFAULT_STYLE } from '@/lib/defaults';
import { Sheet } from '@/components/Sheet';
import { LadderSamples } from '@/components/LadderSamples';
import { ProofMark } from '@/components/proof/Marks';
import { SAMPLE_PAYLOAD } from '@/components/Hero';

/*
 * Every figure on this page is copied from tools/scanlab/README.md and the
 * commit that introduced the weakest-end rule. Nothing here is rounded up,
 * restated as a distance, or extrapolated to phones the lab never held.
 */

const SECTIONS = [
  { id: 'question', label: 'The question' },
  { id: 'method', label: 'Method' },
  { id: 'dataset', label: 'Dataset' },
  { id: 'results', label: 'Results' },
  { id: 'weakest-end', label: 'The weakest end' },
  { id: 'features', label: 'What it leans on' },
  { id: 'calibration', label: 'Calibration' },
  { id: 'limits', label: 'What is not claimed' },
];

const RESULTS = [
  { model: 'Shipped heuristic (ratio < 3)', caught: '36.1%', fa: '5.1%', auc: '—' },
  { model: 'Logistic regression', caught: '37.6%', fa: '5.1%', auc: '0.791' },
  { model: 'Gradient boosting', caught: '57.6%', fa: '5.1%', auc: '0.895' },
  {
    model: 'MLP (24, 12), shipped',
    caught: '55.6%',
    fa: '5.1%',
    auc: '0.887',
    shipped: true,
  },
  { model: 'MLP, contrast features only', caught: '34.7%', fa: '5.1%', auc: '0.655' },
];

const IMPORTANCE = [
  { feature: 'gradient_min_contrast', drop: 0.149 },
  { feature: 'corner_square_square', drop: 0.078 },
  { feature: 'capacity_usage', drop: 0.072 },
  { feature: 'corner_square_dot', drop: 0.065 },
  { feature: 'corner_dot_dot', drop: 0.064 },
  { feature: 'corner_dot_square', drop: 0.06 },
  { feature: 'gradient_end_contrast', drop: 0.04 },
  { feature: 'contrast_log', drop: 0.033 },
];

const CALIBRATION = [
  { band: '0–20%', actual: '21%', n: 439 },
  { band: '20–40%', actual: '45%', n: 29 },
  { band: '40–60%', actual: '36%', n: 33 },
  { band: '60–80%', actual: '69%', n: 26 },
  { band: '80–100%', actual: '84%', n: 682 },
];

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className="scroll-mt-24 border-t border-rule pt-8"
    >
      <h2 id={`${id}-title`} className="type-head text-[1.6rem] sm:text-[1.9rem]">
        {title}
      </h2>
      <div className="mt-5 space-y-4 text-[17px] leading-relaxed text-ink-2 [&_strong]:text-ink">
        {children}
      </div>
    </section>
  );
}

function Table({
  caption,
  head,
  rows,
  className,
}: {
  caption: string;
  head: string[];
  rows: { cells: ReactNode[]; strong?: boolean }[];
  className?: string;
}) {
  return (
    <div className={clsx('scroll-thin overflow-x-auto', className)}>
      <table className="w-full min-w-[30rem] border-collapse text-left text-[15px] text-ink">
        <caption className="type-label pb-2 text-left text-ink-2">{caption}</caption>
        <thead>
          <tr className="border-y-2 border-rule">
            {head.map((h, i) => (
              <th
                key={h}
                scope="col"
                className={clsx('type-label px-2 py-2 text-ink-2', i > 0 && 'text-right')}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={String(row.cells[0])}
              className={clsx('border-b border-hair', row.strong && 'bg-tint font-bold')}
            >
              {row.cells.map((cell, i) => (
                <td
                  key={head[i]}
                  className={clsx('px-2 py-2.5', i > 0 && 'type-reading text-right')}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * The lab report. A Read surface on the same sheet: a contents column that
 * stays put, and a single reading column set to a comfortable measure, with
 * the tables allowed to run wider than the prose.
 */
export function LabPage() {
  const maxDrop = IMPORTANCE[0]!.drop;
  return (
    <Sheet page="lab" proofNumber="Lab report">
      <header className="border-b border-rule px-4 pb-10 pt-10 sm:px-6 lg:px-10 lg:pb-14 lg:pt-14">
        <h1 className="type-display max-w-[13ch] text-balance">
          How a code gets proofed.
        </h1>
        <p className="mt-9 max-w-[40rem] text-[19px] leading-snug text-ink-2">
          Tessera&rsquo;s checks are not taste. A harness called scanlab renders designs
          through the app&rsquo;s own code, degrades them the way a camera would, and asks
          a real decoder to read them. This is what it found, and what it has not proved
          yet.
        </p>

        <dl className="mt-10 grid grid-cols-2 border-l border-t border-rule sm:grid-cols-3 lg:grid-cols-6">
          {[
            { k: 'Designs labelled', v: '5,000' },
            { k: 'Held out for test', v: '1,250' },
            { k: 'Failures in set', v: '40.1%' },
            { k: 'Ladder rungs', v: '20' },
            { k: 'Decoder', v: 'jsQR' },
            { k: 'Real phones', v: 'Pending' },
          ].map(({ k, v }) => (
            <div key={k} className="border-b border-r border-rule px-3 py-3">
              <dt className="type-label text-ink-2">{k}</dt>
              <dd className="type-reading mt-1 text-[26px] leading-none">{v}</dd>
            </div>
          ))}
        </dl>
      </header>

      <div className="grid gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-16 lg:px-10 lg:py-16">
        <nav aria-label="On this page" className="lg:sticky lg:top-24 lg:self-start">
          <h2 className="type-label text-ink-2">On this page</h2>
          <ol className="mt-3 border-t border-rule">
            {SECTIONS.map((s, i) => (
              <li key={s.id} className="border-b border-hair">
                <a
                  href={`#${s.id}`}
                  className="flex gap-3 py-2 text-[15px] font-semibold hover:text-magenta-ink"
                >
                  <span className="type-reading w-5 text-ink-3">{i + 1}</span>
                  {s.label}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <article className="min-w-0 max-w-[72ch] space-y-14">
          <Section id="question" title="The question">
            <p>
              For a given design,{' '}
              <strong>at what point does it stop being readable?</strong> Most generators
              answer with a contrast threshold borrowed from text accessibility. That
              threshold says nothing about dot shape, corner shape, logo coverage or
              density, which is where styled codes actually fail.
            </p>
          </Section>

          <Section id="method" title="Method">
            <p>
              Each design is rendered by the same{' '}
              <code className="font-mono text-[15px] text-ink">qr-code-styling</code>{' '}
              build, through the same option mapping, onto the same canvas the app uses,
              then walked down a ladder of simulated viewing conditions. At every rung a
              decoder is asked to read it, and a read that returns the wrong string counts
              as a failure.
            </p>
            <p>
              Everything is measured in <strong>modules</strong>, not pixels. A rung is a
              number of camera pixels per module, from 10 down to 1.5, with lens blur
              growing as a fraction of a module, plus a little sensor noise and JPEG
              recompression at every step. A design&rsquo;s label is the last rung it
              reads at before its first failure; a lucky read further out is not credited.
            </p>
            <p>The same capture, run on this device for the sample code:</p>
            <LadderSamples payload={SAMPLE_PAYLOAD} style={DEFAULT_STYLE} />
            <p className="text-[14px]">
              This is the ladder the studio&rsquo;s distance proof uses. A test pins the
              app&rsquo;s copy of it to the lab&rsquo;s, so the two cannot drift apart.
            </p>
          </Section>

          <Section id="dataset" title="Dataset">
            <p>
              5,000 designs, drawn from a seeded sampler and resumable, so the set is the
              set its seed claims to be. It runs <strong>40.1% failures</strong>, with 894
              designs penalised for being light on dark and none unencodable.
            </p>
            <p>
              The sampler was rebuilt twice. A first trial with flat contrast bins came
              back 47% failures, and 18 of 19 were explained by contrast below 3:1 alone,
              so a model would only have rediscovered the threshold. The budget now goes
              above 3:1, where shape, logo coverage, quiet zone and density decide the
              outcome. Gradient ends drawn at random made two thirds of gradients pale;
              they are now drawn within a colour family, with a minority drawn freely.
            </p>
          </Section>

          <Section id="results" title="Results">
            <p>
              Judged at the heuristic&rsquo;s own false-alarm rate. Any classifier can
              catch more failures by crying wolf more often, so matching the false-alarm
              budget is the only fair comparison.
            </p>
            <Table
              caption="Failures caught on 1,250 held-out designs"
              head={['Model', 'Failures caught', 'False alarms', 'AUC']}
              rows={RESULTS.map((r) => ({
                strong: r.shipped,
                cells: [r.model, r.caught, r.fa, r.auc],
              }))}
            />
            <p>
              Trained on contrast features alone, the model catches 34.7%, slightly{' '}
              <em>worse</em> than the two-line rule it was meant to replace. With the
              design features added, the shipped MLP reaches 0.887 AUC. Contrast was never
              the hard part. Five-fold AUC is 0.896 ± 0.011 for the MLP.
            </p>
            <p>
              Gradient boosting is the better model and is not the one shipped. Pickled,
              it is <strong>1,067 KB</strong> against a 764 KB app; the MLP is about 1,200
              weights, <strong>13.8 KB</strong>, and keeps 96% of the improvement. It
              downloads only when you turn the beta on.
            </p>
          </Section>

          <Section id="weakest-end" title="The weakest end">
            <p>
              The strongest single feature the model found was the contrast of a
              gradient&rsquo;s paler end, which the app did not check at all. Most of what
              that bought needed no model, so the contrast rule now rates whichever end is
              weaker. Measured over the same 5,000 designs:
            </p>
            <Table
              caption="The contrast rule, before and after rating the weakest end"
              head={['Rule', 'Failures caught', 'False alarms']}
              rows={[
                { cells: ['Foreground only', '38.0%', '6.0%'] },
                { cells: ['Weakest end', '50.2%', '10.0%'], strong: true },
              ]}
            />
            <p>
              The extra false alarms are a real cost. Every one is a gradient whose far
              end sits below the app&rsquo;s own 3:1 floor, so the warning is honest even
              when a lenient decoder happens to read it.
            </p>
          </Section>

          <Section id="features" title="What it leans on">
            <p>Permutation importance: the AUC lost when one feature is shuffled.</p>
            <figure>
              <figcaption className="type-label pb-2 text-ink-2">
                AUC drop when shuffled
              </figcaption>
              <ul className="border-t-2 border-rule">
                {IMPORTANCE.map((f) => (
                  <li
                    key={f.feature}
                    className="grid grid-cols-[minmax(0,13rem)_minmax(0,1fr)_3.5rem] items-center gap-3 border-b border-hair py-2 text-ink"
                  >
                    <code className="truncate font-mono text-[13px]">{f.feature}</code>
                    <span
                      aria-hidden
                      className="h-3 bg-ink"
                      style={{ width: `${(f.drop / maxDrop) * 100}%` }}
                    />
                    <span className="type-reading text-right text-[14px]">
                      {f.drop.toFixed(3)}
                    </span>
                  </li>
                ))}
              </ul>
            </figure>
            <p>
              Corner-shape features take four of the top six places. The finder patterns
              are what a decoder uses to locate the symbol at all, so deforming them costs
              more than dimming the whole code. Plain contrast ratio does not reach the
              top ten.
            </p>
          </Section>

          <Section id="calibration" title="Calibration">
            <p>
              Brier score 0.167. The extremes are well calibrated and hold 90% of all
              predictions; the middle bands are unreliable and thinly populated. That is
              why the studio shows a band (likely, uncertain, unlikely) and not a precise
              percentage the middle of the range cannot support.
            </p>
            <Table
              caption="Predicted against actual decode rate"
              head={['Predicted', 'Actual', 'Designs']}
              rows={CALIBRATION.map((c) => ({ cells: [c.band, c.actual, c.n] }))}
            />
          </Section>

          <Section id="limits" title="What is not claimed">
            <ul className="space-y-3">
              {[
                'Simulated, not photographed. The ladder is a physical model, not a camera, and no rung is quoted as a real-world distance.',
                'One decoder. jsQR is stricter than ZXing, which most phones use, so results are conservative.',
                'No perspective. Codes photographed off-axis are not modelled yet.',
                'No distance promise. A regressor predicts reach to within 2.29 rungs on average, too coarse to say “reads to about two metres”, so the claim is dropped rather than dressed up.',
              ].map((line) => (
                <li key={line} className="flex gap-3">
                  <ProofMark kind="note" size={15} className="mt-1.5" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
            <p>
              The apparatus for checking all of this against real phones exists: a
              printable sheet built around the designs where the model and the rule
              disagree, scored so that a code failing on any phone counts as failed. Until
              it has run, the model stays an opt-in second opinion beside the contrast
              rule, not a replacement for it.
            </p>
            <p>
              <a
                href="https://github.com/GgauravJ05/tessera-qr/tree/main/tools/scanlab"
                target="_blank"
                rel="noreferrer noopener"
                className="font-semibold text-ink underline decoration-hair hover:decoration-ink"
              >
                Read the full scanlab write-up and source
              </a>
            </p>
          </Section>
        </article>
      </div>
    </Sheet>
  );
}
