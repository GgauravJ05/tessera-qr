import { useEffect, useState } from 'react';
import { clsx } from 'clsx';
import type { Theme } from '@/hooks/useTheme';
import { Logo } from './Logo';
import { GithubIcon } from './BrandIcons';
import { RegistrationMark } from './proof/Marks';
import type { SheetPage } from './Sheet';

const NAV: { href: string; label: string; page?: SheetPage }[] = [
  { href: '/#studio', label: 'Studio', page: 'studio' },
  { href: '/lab/', label: 'Lab', page: 'lab' },
  { href: '/gallery/', label: 'Proof wall', page: 'gallery' },
  { href: '/#faq', label: 'FAQ' },
];

/**
 * The slug line: the strip at the head of a proof that carries the job's
 * name and number. Here it carries the navigation too, and stays pinned to
 * the top of the sheet as the page scrolls, ruled off once it has moved.
 */
export function SlugLine({
  page,
  proofNumber,
  theme,
  onToggleTheme,
}: {
  page: SheetPage;
  proofNumber: string;
  theme: Theme;
  onToggleTheme: () => void;
}) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={clsx(
        'sticky top-0 z-40 border-b bg-sheet transition-colors',
        scrolled ? 'border-rule' : 'border-hair',
      )}
    >
      <div className="flex h-14 items-center gap-4 px-4 sm:px-6 lg:px-10">
        <a href="/" className="flex items-center gap-2.5" aria-label="Tessera home">
          <Logo size={22} />
          <span className="text-[17px] font-[850] tracking-[-0.01em] [font-stretch:112%]">
            Tessera
          </span>
        </a>
        <span className="type-label hidden text-ink-3 lg:inline">{proofNumber}</span>

        <nav aria-label="Pages" className="ml-auto hidden items-center md:flex">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              aria-current={item.page === page ? 'page' : undefined}
              className={clsx(
                'type-label px-3 py-2 transition-colors hover:text-ink',
                item.page === page
                  ? 'text-ink underline decoration-2 underline-offset-[6px]'
                  : 'text-ink-2',
              )}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1 md:ml-2">
          <span className="type-label mr-2 hidden items-center gap-1.5 text-ink-2 sm:inline-flex">
            <RegistrationMark size={13} className="text-cyan-ink" />
            On-device
          </span>
          <a
            href="https://github.com/GgauravJ05/tessera-qr"
            target="_blank"
            rel="noreferrer noopener"
            aria-label="Source on GitHub"
            className="inline-flex size-9 items-center justify-center text-ink-2 transition-colors hover:bg-tint hover:text-ink"
          >
            <GithubIcon size={17} />
          </a>
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={
              theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'
            }
            className="type-label inline-flex h-9 items-center gap-1.5 px-2 text-ink-2 transition-colors hover:bg-tint hover:text-ink"
          >
            <span
              aria-hidden
              className={clsx(
                'size-3.5 border border-rule',
                theme === 'dark' ? 'bg-sheet' : 'bg-ink',
              )}
            />
            {theme === 'dark' ? 'Film' : 'Paper'}
          </button>
        </div>
      </div>

      <nav
        aria-label="Pages"
        className="scroll-thin flex gap-1 overflow-x-auto border-t border-hair px-2 md:hidden"
      >
        {NAV.map((item) => (
          <a
            key={item.href}
            href={item.href}
            aria-current={item.page === page ? 'page' : undefined}
            className={clsx(
              'type-label shrink-0 px-2.5 py-2.5',
              item.page === page
                ? 'text-ink underline decoration-2 underline-offset-[6px]'
                : 'text-ink-2',
            )}
          >
            {item.label}
          </a>
        ))}
      </nav>
    </header>
  );
}
