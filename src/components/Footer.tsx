import { Globe, Heart, Mail, Scale } from 'lucide-react';
import { Logo } from './Logo';
import { GithubIcon, LinkedinIcon } from './BrandIcons';

const STACK = ['React 19', 'TypeScript', 'Vite', 'Tailwind CSS', 'qr-code-styling'];

const SECTIONS = [
  {
    title: 'Product',
    links: [
      { label: 'Studio', href: '#studio' },
      { label: 'Features', href: '#features' },
      { label: 'FAQ', href: '#faq' },
    ],
  },
  {
    title: 'Content types',
    links: [
      { label: 'Link & text', href: '#studio' },
      { label: 'WiFi join', href: '#studio' },
      { label: 'vCard contact', href: '#studio' },
      { label: 'Calendar event', href: '#studio' },
    ],
  },
];

const REPO = 'https://github.com/GgauravJ05/tessera-qr';

const SOCIAL = [
  { label: 'Source on GitHub', href: REPO, Icon: GithubIcon },
  { label: 'Portfolio', href: 'https://gauravjadhav.vercel.app/', Icon: Globe },
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/in/ggauravj05',
    Icon: LinkedinIcon,
  },
  { label: 'Email', href: 'mailto:ggauravj5@gmail.com', Icon: Mail },
];

export function Footer() {
  return (
    <footer className="border-t border-line bg-surface/40">
      <div className="mx-auto max-w-[1240px] px-4 py-14 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.6fr)_repeat(2,minmax(0,1fr))]">
          <div>
            <div className="flex items-center gap-2.5">
              <Logo size={24} />
              <span className="text-[15px] font-semibold tracking-tight">Tessera</span>
            </div>
            <p className="mt-4 max-w-sm text-[14px] leading-relaxed text-ink-muted">
              A private, offline-capable QR studio. Static codes that never expire, styled
              to match your brand and exported print-ready.
            </p>
            <ul className="mt-5 flex flex-wrap gap-1.5">
              {STACK.map((tech) => (
                <li
                  key={tech}
                  className="rounded-md bg-raised px-2 py-1 font-mono text-[11px] text-ink-subtle ring-1 ring-line"
                >
                  {tech}
                </li>
              ))}
            </ul>
          </div>

          {SECTIONS.map((section) => (
            <nav key={section.title} aria-label={section.title}>
              <h2 className="text-[13px] font-semibold tracking-tight">
                {section.title}
              </h2>
              <ul className="mt-3.5 space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-[14px] text-ink-muted transition-colors hover:text-ink"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-5 border-t border-line pt-7 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[13.5px] text-ink-muted">
            Made with <Heart size={12} className="inline text-danger" aria-label="love" />{' '}
            by{' '}
            <a
              href="https://gauravjadhav.vercel.app/"
              target="_blank"
              rel="noreferrer noopener"
              className="font-semibold text-ink underline decoration-line-strong underline-offset-2 transition-colors hover:decoration-accent"
            >
              Gaurav Jadhav
            </a>
            <span className="mx-2 text-ink-subtle" aria-hidden>
              ·
            </span>
            <span className="text-ink-subtle">© {new Date().getFullYear()} Tessera</span>
          </p>

          <ul className="flex items-center gap-1">
            {SOCIAL.map(({ label, href, Icon }) => (
              <li key={label}>
                <a
                  href={href}
                  target={href.startsWith('http') ? '_blank' : undefined}
                  rel={href.startsWith('http') ? 'noreferrer noopener' : undefined}
                  aria-label={label}
                  className="inline-flex size-9 items-center justify-center rounded-lg text-ink-subtle transition-colors hover:bg-raised hover:text-ink"
                >
                  <Icon size={16} />
                </a>
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[12.5px] text-ink-muted">
          <Scale size={13} className="shrink-0" aria-hidden />
          <span>
            Free software under the{' '}
            <a
              href={`${REPO}/blob/main/LICENSE`}
              target="_blank"
              rel="noreferrer noopener"
              className="font-medium text-ink underline decoration-line-strong underline-offset-2 transition-colors hover:decoration-accent"
            >
              GNU AGPL v3
            </a>
            . The complete corresponding source is at{' '}
            <a
              href={REPO}
              target="_blank"
              rel="noreferrer noopener"
              className="font-medium text-ink underline decoration-line-strong underline-offset-2 transition-colors hover:decoration-accent"
            >
              github.com/GgauravJ05/tessera-qr
            </a>
            .
          </span>
        </p>

        <p className="mt-4 text-[12px] leading-relaxed text-ink-subtle">
          Tessera generates static QR codes: the payload is encoded in the symbol itself,
          so codes do not expire and no scan data is collected. QR Code is a registered
          trademark of Denso Wave Incorporated. Not affiliated with Denso Wave.
        </p>
      </div>
    </footer>
  );
}
