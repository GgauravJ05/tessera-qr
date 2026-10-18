import { useMemo, useState } from 'react';
import { clsx } from 'clsx';
import type { CornerDotStyle, CornerSquareStyle, DotStyle, QrStyle } from '@/types/qr';
import { DEFAULT_STYLE } from '@/lib/defaults';
import { boldness, MAX_REACH, scoreDesign, totalBoldness } from '@/lib/challenge';
import type { ChallengeResult } from '@/lib/challenge';
import { studioLinkFor } from '@/lib/share';
import { WALL_PAYLOAD } from '@/lib/wall';
import { useQrCode } from '@/hooks/useQrCode';
import { useLadder } from '@/hooks/useProofLab';
import { Field } from './ui/Field';
import { Select } from './ui/Input';
import { Toggle } from './ui/Toggle';
import { Button } from './ui/Button';
import { LadderWedge } from './proof/LadderWedge';
import { ProofMark } from './proof/Marks';
import { Reading } from './proof/Reading';

const BEST_KEY = 'tessera:break-it-best';

interface Best extends ChallengeResult {
  style: QrStyle;
}

function readBest(): Best | null {
  try {
    const raw = localStorage.getItem(BEST_KEY);
    return raw ? (JSON.parse(raw) as Best) : null;
  } catch {
    // Private windows and blocked storage both throw. No best yet, then.
    return null;
  }
}

function writeBest(best: Best) {
  try {
    localStorage.setItem(BEST_KEY, JSON.stringify(best));
  } catch {
    // Failing to remember a score is not a reason to refuse the proof.
  }
}

const START: QrStyle = {
  ...DEFAULT_STYLE,
  margin: 0,
  logo: null,
  foreground: '#000000',
  background: '#ffffff',
  useGradient: false,
  dotStyle: 'square',
  cornerSquareStyle: 'square',
  cornerDotStyle: 'square',
};

function Swatch({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (hex: string) => void;
}) {
  return (
    <Field label={label}>
      {(id) => (
        <div className="flex items-stretch border border-rule">
          <input
            id={id}
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="h-11 w-12 shrink-0 border-r border-rule"
          />
          <span className="flex items-center px-3 font-mono text-[14px] uppercase">
            {value}
          </span>
        </div>
      )}
    </Field>
  );
}

/**
 * Break it. The visitor pushes a plain black code as far as they dare, then
 * sends it to proof. Boldness comes from a published table; reach is the
 * ladder, decoded on the device. Their best is kept in this browser only.
 */
export function BreakIt() {
  const [style, setStyle] = useState<QrStyle>(START);
  const [submitted, setSubmitted] = useState<QrStyle | null>(null);
  const [best, setBest] = useState<Best | null>(readBest);
  const { containerRef } = useQrCode(WALL_PAYLOAD, style, 420);
  const ladder = useLadder(WALL_PAYLOAD, submitted ?? START, Boolean(submitted), 0);

  const lines = useMemo(() => boldness(style), [style]);
  const bold = totalBoldness(lines);
  const set = (patch: Partial<QrStyle>) => {
    setStyle((s) => ({ ...s, ...patch }));
    setSubmitted(null);
  };

  const result =
    submitted && ladder.status === 'ready' && ladder.result
      ? scoreDesign(submitted, ladder.result.rung)
      : null;

  // Record a new best the moment a proof beats it.
  if (result && submitted && result.score > 0 && (!best || result.score > best.score)) {
    const next = { ...result, style: submitted };
    writeBest(next);
    setBest(next);
  }

  return (
    <section id="break-it" aria-labelledby="break-title" className="border-b border-rule">
      <div className="px-4 pt-14 sm:px-6 lg:px-10 lg:pt-20">
        <h2 id="break-title" className="type-title max-w-[14ch] text-balance">
          Break it, without breaking it.
        </h2>
        <p className="mt-5 max-w-[42rem] text-[17px] leading-relaxed text-ink-2">
          Start from a plain black square and push it: paler inks, gradients, softer
          shapes. Every daring choice earns boldness points. Then send it to proof. The
          score is boldness times the number of rungs it still reads at, so a design that
          stops decoding scores nothing.
        </p>
      </div>

      <div className="grid gap-10 px-4 pb-16 pt-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,0.9fr)] lg:gap-10 lg:px-10 lg:pb-20">
        <div className="min-w-0 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Swatch
              label={style.useGradient ? 'Ink, start' : 'Ink'}
              value={style.foreground}
              onChange={(v) => set({ foreground: v })}
            />
            <Swatch
              label="Paper"
              value={style.background}
              onChange={(v) => set({ background: v })}
            />
          </div>
          <Toggle
            label="Gradient fill"
            checked={style.useGradient}
            onChange={(v) =>
              set({ useGradient: v, gradientTo: style.gradientTo || '#6366f1' })
            }
          />
          {style.useGradient && (
            <Swatch
              label="Ink, end"
              value={style.gradientTo}
              onChange={(v) => set({ gradientTo: v })}
            />
          )}
          <div className="grid grid-cols-3 gap-3">
            <Field label="Dots">
              {(id) => (
                <Select
                  id={id}
                  value={style.dotStyle}
                  onChange={(e) => set({ dotStyle: e.target.value as DotStyle })}
                >
                  {[
                    'square',
                    'dots',
                    'rounded',
                    'classy',
                    'classy-rounded',
                    'extra-rounded',
                  ].map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <Field label="Eye frame">
              {(id) => (
                <Select
                  id={id}
                  value={style.cornerSquareStyle}
                  onChange={(e) =>
                    set({ cornerSquareStyle: e.target.value as CornerSquareStyle })
                  }
                >
                  {['square', 'dot', 'extra-rounded'].map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <Field label="Eye centre">
              {(id) => (
                <Select
                  id={id}
                  value={style.cornerDotStyle}
                  onChange={(e) =>
                    set({ cornerDotStyle: e.target.value as CornerDotStyle })
                  }
                >
                  {['square', 'dot'].map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
          </div>

          <div className="border-t border-rule pt-4">
            <h3 className="type-label text-ink-2">Boldness</h3>
            <ul className="mt-2">
              {lines.map((l) => (
                <li
                  key={l.label}
                  className="flex justify-between border-b border-hair py-1.5 text-[14px]"
                >
                  <span>{l.label}</span>
                  <span className="type-reading">+{l.points}</span>
                </li>
              ))}
              <li className="flex justify-between py-1.5 text-[15px] font-bold">
                <span>Total</span>
                <Reading value={String(bold)} />
              </li>
            </ul>
          </div>
        </div>

        <figure className="min-w-0">
          <div
            className="border border-rule p-6"
            style={{ background: style.background }}
          >
            <div
              ref={containerRef}
              aria-hidden
              className="mx-auto max-w-[360px] [&>canvas]:block [&>canvas]:h-auto [&>canvas]:w-full"
            />
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button
              variant="primary"
              className="h-12 px-6 text-[15px]"
              onClick={() => setSubmitted(style)}
              disabled={submitted === style && ladder.status === 'running'}
            >
              Send to proof
            </Button>
            <Button className="h-12" onClick={() => set(START)}>
              Start over
            </Button>
          </div>
        </figure>

        <div className="min-w-0" aria-live="polite">
          <h3 className="type-label text-ink-2">Proof result</h3>
          {!submitted ? (
            <p className="mt-3 text-[15px] text-ink-2">
              Not sent yet. The ladder runs when you press Send to proof.
            </p>
          ) : !result ? (
            <p className="mt-3 text-[15px] font-semibold">
              Walking the ladder on this device…
            </p>
          ) : (
            <div className="mt-3">
              <p
                className={clsx(
                  'inline-block -rotate-2 border-[3px] px-4 py-2 text-[26px] font-[850] uppercase leading-none [font-stretch:115%]',
                  result.rank === 'Broken'
                    ? 'border-ink text-ink'
                    : 'border-magenta text-magenta-ink',
                )}
              >
                {result.rank}
              </p>
              <dl className="mt-5 grid grid-cols-3 border-l border-t border-rule">
                {[
                  { k: 'Boldness', v: String(result.boldness) },
                  { k: 'Reach', v: `${result.reach}/${MAX_REACH}` },
                  { k: 'Score', v: String(result.score) },
                ].map(({ k, v }) => (
                  <div key={k} className="border-b border-r border-rule px-3 py-2">
                    <dt className="type-label text-ink-2">{k}</dt>
                    <dd className="type-reading text-[22px]">{v}</dd>
                  </div>
                ))}
              </dl>
              {ladder.result && ladder.result.trace.slice(result.reach).some(Boolean) && (
                <p className="mt-3 text-[13px] text-ink-2">
                  It read at some rungs further out, but reach stops at the first failure,
                  as it does in the lab: a read after a miss is luck.
                </p>
              )}
            </div>
          )}
          <LadderWedge
            trace={ladder.result?.trace ?? null}
            status={submitted ? ladder.status : 'idle'}
            compact
            className="mt-4"
          />

          <div className="mt-8 border-t border-rule pt-4">
            <h3 className="type-label text-ink-2">Your best, in this browser</h3>
            {best ? (
              <div className="mt-2 flex items-center justify-between gap-3">
                <p className="text-[15px]">
                  <span className="font-bold">{best.rank}</span>
                  <span className="text-ink-2"> · score </span>
                  <span className="type-reading font-bold">{best.score}</span>
                </p>
                <a
                  href={studioLinkFor(best.style)}
                  className="text-[14px] font-semibold underline decoration-hair decoration-2 underline-offset-4 hover:decoration-ink"
                >
                  Open in the studio
                </a>
              </div>
            ) : (
              <p className="mt-2 text-[14px] text-ink-2">None yet.</p>
            )}
            <p className="mt-3 flex gap-2 text-[13px] text-ink-2">
              <ProofMark kind="note" size={13} className="mt-0.5" />
              Kept on this device only. There is no shared leaderboard, because there is
              no server to keep one.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
