import { GithubIcon, LinkedinIcon } from './BrandIcons';
import { Logo } from './Logo';

const REPO = 'https://github.com/GgauravJ05/tessera-qr';

const LINKS = [
  { label: 'Source on GitHub', href: REPO, Icon: GithubIcon },
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/in/ggauravj05',
    Icon: LinkedinIcon,
  },
];

const PAGES = [
  { label: 'Studio', href: '/#studio' },
  { label: 'Lab', href: '/lab/' },
  { label: 'Proof wall', href: '/gallery/' },
  { label: 'FAQ', href: '/#faq' },
];

/**
 * The foot of the sheet, set as a colophon: who made it, under what licence,
 * with which tools. The ruled cells are the same job-ticket grid the studio
 * uses, so the sheet ends in its own vocabulary.
 */
export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-rule">
      <div className="grid sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr]">
        <div className="border-b border-hair px-4 py-8 sm:px-6 lg:border-b-0 lg:border-r lg:px-10">
          <div className="flex items-center gap-2.5">
            <Logo size={22} />
            <span className="text-[17px] font-[850] [font-stretch:112%]">Tessera</span>
          </div>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-ink-2">
            A QR code studio that proofs every code before it goes to print. It runs
            entirely on your device, and the codes are static, so they keep working after
            this site is gone.
          </p>
        </div>

        <nav
          aria-label="Footer"
          className="border-b border-hair px-4 py-8 sm:border-l sm:px-6 lg:border-b-0 lg:border-l-0 lg:border-r lg:px-8"
        >
          <h2 className="type-label text-ink-2">Pages</h2>
          <ul className="mt-3 space-y-2">
            {PAGES.map((link) => (
              <li key={link.href}>
                <a href={link.href} className="text-[15px] font-semibold hover:underline">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="px-4 py-8 sm:col-span-2 sm:px-6 lg:col-span-1 lg:px-8">
          <h2 className="type-label text-ink-2">Made by</h2>
          <p className="mt-3 text-[15px]">
            <a
              href="https://gauravjadhav.vercel.app/"
              target="_blank"
              rel="noreferrer noopener"
              className="font-semibold underline decoration-hair hover:decoration-ink"
            >
              Gaurav Jadhav
            </a>
            <span className="text-ink-2"> · </span>
            <a
              href="mailto:ggauravj5@gmail.com"
              className="underline decoration-hair hover:decoration-ink"
            >
              Email
            </a>
          </p>
          <ul className="mt-3 flex gap-1">
            {LINKS.map(({ label, href, Icon }) => (
              <li key={label}>
                <a
                  href={href}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label={label}
                  className="inline-flex size-9 items-center justify-center border border-hair text-ink-2 transition-colors hover:border-rule hover:text-ink"
                >
                  <Icon size={16} />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="space-y-2 border-t border-hair px-4 py-5 text-[13px] leading-relaxed text-ink-2 sm:px-6 lg:px-10">
        <p>
          Free software under the{' '}
          <a
            href={`${REPO}/blob/main/LICENSE`}
            target="_blank"
            rel="noreferrer noopener"
            className="font-semibold text-ink underline decoration-hair hover:decoration-ink"
          >
            GNU AGPL v3
          </a>
          . The complete corresponding source is at{' '}
          <a
            href={REPO}
            target="_blank"
            rel="noreferrer noopener"
            className="font-semibold text-ink underline decoration-hair hover:decoration-ink"
          >
            github.com/GgauravJ05/tessera-qr
          </a>
          . Set in Archivo and JetBrains Mono, both served from this site.
        </p>
        <p>
          © {year} Tessera. Tessera generates static QR codes: the payload is encoded in
          the symbol itself, so codes do not expire and no scan data is collected. QR Code
          is a registered trademark of Denso Wave Incorporated. Not affiliated with Denso
          Wave.
        </p>
      </div>
    </footer>
  );
}
