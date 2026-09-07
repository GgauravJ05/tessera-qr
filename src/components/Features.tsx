import {
  Contrast,
  FileImage,
  Infinity as InfinityIcon,
  Layers,
  ShieldCheck,
  Wand2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface Feature {
  Icon: LucideIcon;
  title: string;
  body: string;
}

const FEATURES: Feature[] = [
  {
    Icon: ShieldCheck,
    title: 'Private by construction',
    body:
      'There is no backend to send anything to. Payloads are built and rendered on your device, so WiFi passwords and contact details never leave it.',
  },
  {
    Icon: InfinityIcon,
    title: 'Codes that never expire',
    body:
      'Every symbol is static — the data lives in the pattern itself, not behind a redirect. No subscription can switch your code off later.',
  },
  {
    Icon: Contrast,
    title: 'Scannability, checked live',
    body:
      'Contrast ratio and payload capacity are scored as you edit, so you find out a colour pair will fail before it reaches a printer.',
  },
  {
    Icon: Layers,
    title: 'Nine content types',
    body:
      'Links, plain text, WiFi joins, vCard contacts, email, SMS, phone, geo pins and calendar events — each with its own validated form.',
  },
  {
    Icon: Wand2,
    title: 'Design that stays on brand',
    body:
      'Dot and corner shapes, gradients, a centre logo and curated presets. Style it once and it still scans the way it should.',
  },
  {
    Icon: FileImage,
    title: 'Print-ready exports',
    body:
      'PNG, SVG, JPEG or WebP at up to 4096 px, re-rendered at full resolution on download — or copied straight to your clipboard.',
  },
];

export function Features() {
  return (
    <section id="features" className="border-t border-line bg-surface/40">
      <div className="mx-auto max-w-[1240px] px-4 py-16 sm:px-6 sm:py-24">
        <div className="max-w-2xl">
          <p className="eyebrow">Why Tessera</p>
          <h2 className="text-section-title mt-3 text-balance">
            Everything a good QR code needs, and nothing that phones home.
          </h2>
          <p className="mt-4 text-[15.5px] leading-relaxed text-ink-muted">
            Most generators are a redirect service with a UI on top. Tessera is the
            opposite: a design tool that hands you the finished artwork and gets out of
            the way.
          </p>
        </div>

        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ Icon, title, body }) => (
            <li
              key={title}
              className="group rounded-card border border-line bg-surface p-6 shadow-[var(--shadow-raise)] transition-all duration-300 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-[var(--shadow-float)]"
            >
              <span className="inline-flex size-10 items-center justify-center rounded-xl bg-accent-soft text-accent ring-1 ring-inset ring-accent/10 transition-transform duration-300 group-hover:scale-105">
                <Icon size={18} aria-hidden />
              </span>
              <h3 className="mt-4 text-[15px] font-semibold tracking-tight">{title}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-ink-muted">{body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
