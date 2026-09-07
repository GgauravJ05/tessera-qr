import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { clsx } from 'clsx';
import type { Theme } from '@/hooks/useTheme';
import { Logo } from './Logo';
import { GithubIcon } from './BrandIcons';

const NAV = [
  { href: '#studio', label: 'Studio' },
  { href: '#features', label: 'Features' },
  { href: '#faq', label: 'FAQ' },
];

export function Header({
  theme,
  onToggleTheme,
}: {
  theme: Theme;
  onToggleTheme: () => void;
}) {
  // The border and blur only appear once the page has moved, so the hero
  // reads as one uninterrupted surface at rest.
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
        'sticky top-0 z-50 transition-all duration-300',
        scrolled
          ? 'border-b border-line bg-canvas/75 backdrop-blur-xl'
          : 'border-b border-transparent bg-transparent',
      )}
    >
      <div className="mx-auto flex h-16 max-w-[1240px] items-center gap-6 px-4 sm:px-6">
        <a
          href="#top"
          className="flex items-center gap-2.5 transition-opacity hover:opacity-80"
          aria-label="Tessera home"
        >
          <Logo size={26} />
          <span className="text-[15px] font-semibold tracking-tight">Tessera</span>
        </a>

        <nav aria-label="Sections" className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-1.5 text-[13.5px] font-medium text-ink-muted transition-colors hover:bg-raised hover:text-ink"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1.5">
          <span className="hidden items-center gap-1.5 rounded-full bg-raised px-3 py-1.5 text-[11.5px] font-medium text-ink-muted ring-1 ring-line lg:inline-flex">
            <span className="size-1.5 rounded-full bg-ok" aria-hidden />
            100% on-device
          </span>
          <a
            href="https://github.com/GgauravJ05/tessera-qr"
            target="_blank"
            rel="noreferrer noopener"
            aria-label="View the source on GitHub"
            className="inline-flex size-9 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-raised hover:text-ink"
          >
            <GithubIcon size={17} />
          </a>
          <button
            type="button"
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
            onClick={onToggleTheme}
            className="inline-flex size-9 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-raised hover:text-ink"
          >
            {theme === 'dark' ? (
              <Sun size={17} aria-hidden />
            ) : (
              <Moon size={17} aria-hidden />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
