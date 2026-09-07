import { ArrowDown, Lock, Sparkles, Zap } from 'lucide-react';

const STATS = [
  { value: '9', label: 'Content types' },
  { value: '4', label: 'Export formats' },
  { value: '0', label: 'Servers involved' },
];

export function Hero() {
  return (
    <section
      id="top"
      className="hero-glow hero-grid relative isolate overflow-hidden border-b border-line"
    >
      <div className="relative z-10 mx-auto max-w-[1240px] px-4 pb-16 pt-14 sm:px-6 sm:pb-24 sm:pt-20">
        <div className="mx-auto max-w-3xl text-center">
          <span className="animate-rise inline-flex items-center gap-2 rounded-full border border-line bg-surface/70 px-3.5 py-1.5 text-[12.5px] font-medium text-ink-muted shadow-[var(--shadow-raise)] backdrop-blur">
            <Sparkles size={13} className="text-accent" aria-hidden />
            Static codes that never expire
          </span>

          <h1 className="animate-rise delay-1 text-display mt-6 text-balance">
            Craft QR codes
            <br className="hidden sm:block" />{' '}
            <span className="bg-gradient-to-r from-accent to-ink bg-clip-text text-transparent">
              worth scanning.
            </span>
          </h1>

          <p className="animate-rise delay-2 mx-auto mt-6 max-w-xl text-pretty text-[16.5px] leading-relaxed text-ink-muted sm:text-[17.5px]">
            Links, WiFi, contacts and more — styled to match your brand, checked for
            real-world scannability, and exported print-ready. Everything runs in your
            browser; nothing you type is ever uploaded.
          </p>

          <div className="animate-rise delay-3 mt-9 flex flex-wrap items-center justify-center gap-3">
            <a
              href="#studio"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-6 py-3 text-[15px] font-semibold text-on-accent shadow-[var(--shadow-float)] transition-all hover:bg-accent-hover active:scale-[0.98]"
            >
              Open the studio
              <ArrowDown size={16} aria-hidden />
            </a>
            <a
              href="#features"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-line bg-surface px-6 py-3 text-[15px] font-semibold text-ink shadow-[var(--shadow-raise)] transition-all hover:border-line-strong active:scale-[0.98]"
            >
              How it works
            </a>
          </div>

          <ul className="animate-rise delay-3 mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[13px] text-ink-subtle">
            <li className="inline-flex items-center gap-1.5">
              <Lock size={13} aria-hidden /> No account, no tracking
            </li>
            <li className="inline-flex items-center gap-1.5">
              <Zap size={13} aria-hidden /> Renders as you type
            </li>
            <li className="inline-flex items-center gap-1.5">
              <Sparkles size={13} aria-hidden /> Free forever
            </li>
          </ul>
        </div>

        <dl className="animate-rise delay-3 mx-auto mt-14 grid max-w-2xl grid-cols-3 divide-x divide-line rounded-card border border-line bg-surface/60 py-5 shadow-[var(--shadow-raise)] backdrop-blur">
          {STATS.map((stat) => (
            <div key={stat.label} className="px-3 text-center">
              <dt className="sr-only">{stat.label}</dt>
              <dd>
                <span className="block text-2xl font-semibold tracking-tight sm:text-3xl">
                  {stat.value}
                </span>
                <span className="mt-1 block text-[12px] text-ink-subtle">
                  {stat.label}
                </span>
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
