import type { QrStyle } from '@/types/qr';
import type { ScannabilityReport } from '@/lib/contrast';
import type { CapacityReport } from '@/lib/validation';
import type { ProofCheck } from '@/lib/readiness';
import { verdictOf } from '@/lib/readiness';
import { useQrCode } from '@/hooks/useQrCode';
import { Input } from './ui/Input';
import { ControlStrip } from './proof/ControlStrip';
import { RegisteredCode } from './proof/RegisteredCode';
import { RegistrationMark } from './proof/Marks';
import { Stamp } from './proof/Stamp';
import { ProofMark } from './proof/Marks';

/** What the hero shows before the visitor has typed anything of their own. */
export const SAMPLE_PAYLOAD = 'https://tessera-qr.vercel.app';

/**
 * The first viewport is a working proof. The job ticket on the left takes
 * the visitor's own link; the code on the right is rendered from it as they
 * type; the control strip along the foot reads its inks; and the stamp
 * downloads the file it has just signed off. The full studio continues one
 * scroll below, on the same design.
 */
export function Hero({
  url,
  urlError,
  onUrlChange,
  payload,
  sample,
  ready,
  style,
  scannability,
  capacity,
  moduleCount,
  checks,
  fileName,
}: {
  url: string;
  urlError?: string;
  onUrlChange: (url: string) => void;
  payload: string;
  sample: boolean;
  ready: boolean;
  style: QrStyle;
  scannability: ScannabilityReport;
  capacity: CapacityReport;
  moduleCount: number | null;
  checks: ProofCheck[];
  fileName: string;
}) {
  const shown = payload;
  const { containerRef, download } = useQrCode(shown, style, 640);
  const verdict = verdictOf(checks);
  const faults = checks.filter((c) => c.status === 'fail' || c.status === 'warn');

  return (
    <section id="hero" aria-labelledby="hero-title" className="border-b border-rule">
      {/* Three parts, so a phone reads headline, code, ticket in that order,
          while the desktop sets the code beside the other two. */}
      <div className="grid gap-x-14 gap-y-8 px-4 pb-10 pt-8 sm:px-6 sm:pt-10 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,1fr)] lg:grid-rows-[auto_1fr] lg:px-10 lg:pb-10 lg:pt-10">
        <div className="min-w-0 lg:col-start-1 lg:row-start-1">
          <h1 id="hero-title" className="type-display max-w-[11ch] text-balance">
            Proof the code before the run.
          </h1>
          <p className="mt-6 max-w-[34rem] text-[18px] leading-snug text-ink-2 sm:text-[20px]">
            Every code measured to scan before it reaches the printer.
          </p>
        </div>

        <figure className="relative mx-auto w-full max-w-[340px] self-center sm:max-w-[560px] lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:max-w-none">
          <div className="relative mx-6 my-6 sm:mx-9 sm:my-9">
            <span
              aria-hidden
              className="pointer-events-none absolute -inset-4 border border-dashed border-ink-3 sm:-inset-6"
            />
            <RegistrationMark className="absolute -left-9 top-1/2 hidden -translate-y-1/2 text-ink-2 sm:block sm:-left-12" />
            <RegistrationMark className="absolute -right-9 top-1/2 hidden -translate-y-1/2 text-ink-2 sm:block sm:-right-12" />
            <RegistrationMark className="absolute -top-9 left-1/2 hidden -translate-x-1/2 text-ink-2 sm:block sm:-top-12" />
            <RegisteredCode
              containerRef={containerRef}
              payload={shown}
              style={style}
              label={sample ? 'A sample QR code' : `QR code for ${payload}`}
            />
          </div>
          <figcaption className="type-label mt-2 flex justify-between gap-3 text-ink-2">
            <span className="truncate">
              {sample ? 'Sample proof' : payload.replace(/^https?:\/\//, '')}
            </span>
            <span className="shrink-0">Static · never expires</span>
          </figcaption>
        </figure>

        <div className="min-w-0 lg:col-start-1 lg:row-start-2">
          <div className="max-w-[36rem] border border-rule">
            <div className="grid grid-cols-[96px_minmax(0,1fr)] border-b border-rule sm:grid-cols-[120px_minmax(0,1fr)]">
              <label
                htmlFor="hero-link"
                className="type-label flex items-center border-r border-rule px-3 text-ink-2"
              >
                Job link
              </label>
              <Input
                id="hero-link"
                type="url"
                inputMode="url"
                autoComplete="url"
                placeholder="yourcafe.com/menu"
                value={url}
                invalid={Boolean(urlError)}
                aria-describedby={urlError ? 'hero-link-error' : undefined}
                onChange={(e) => onUrlChange(e.target.value)}
                className="border-0 py-3.5 text-[17px] font-semibold"
              />
            </div>
            <div className="grid grid-cols-[96px_minmax(0,1fr)] border-b border-rule sm:grid-cols-[120px_minmax(0,1fr)]">
              <span className="type-label flex items-center border-r border-rule px-3 py-3 text-ink-2">
                Checked
              </span>
              <p className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1 px-3 py-3 text-[14px]">
                {urlError ? (
                  <span
                    id="hero-link-error"
                    role="alert"
                    className="flex items-center gap-1.5 font-semibold text-magenta-ink"
                  >
                    <ProofMark kind="fail" size={12} />
                    {urlError}
                  </span>
                ) : faults.length === 0 ? (
                  <span className="flex items-center gap-1.5 font-semibold">
                    <ProofMark kind="pass" size={13} />
                    {sample
                      ? 'Sample proof. Type your link above.'
                      : 'Every measured line passes.'}
                  </span>
                ) : (
                  faults.slice(0, 2).map((f) => (
                    <span key={f.id} className="flex items-center gap-1.5 font-semibold">
                      <ProofMark kind={f.status} size={13} />
                      {f.label} {f.reading}
                    </span>
                  ))
                )}
              </p>
            </div>
            <div className="grid grid-cols-[96px_minmax(0,1fr)] sm:grid-cols-[120px_minmax(0,1fr)]">
              <span className="type-label flex items-center border-r border-rule px-3 py-3 text-ink-2">
                Print at
              </span>
              <p className="px-3 py-3 text-[14px] font-semibold">
                2 cm or larger
                <span className="font-normal text-ink-2">
                  {' '}
                  · test with two phones first
                </span>
              </p>
            </div>
          </div>

          <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-4">
            {/* The stamp is never dead weight: before there is a link of the
                visitor's own, pressing it takes them to the field it needs. */}
            <Stamp
              verdict={verdict}
              detail={
                ready
                  ? 'Download PNG'
                  : sample
                    ? 'Type your link first'
                    : 'Fix the ticket first'
              }
              onPress={() => {
                if (ready) return download('png', fileName);
                document.getElementById('hero-link')?.focus();
              }}
            />
            <a
              href="#studio"
              className="text-[15px] font-semibold underline decoration-hair decoration-2 underline-offset-4 hover:decoration-ink"
            >
              Style it in the studio
            </a>
          </div>
        </div>
      </div>

      <ControlStrip
        style={style}
        scannability={scannability}
        capacity={capacity}
        moduleCount={moduleCount}
        className="border-l-0"
      />
    </section>
  );
}
