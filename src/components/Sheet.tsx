import type { ReactNode } from 'react';
import { LazyMotion, MotionConfig } from 'motion/react';
import { useTheme } from '@/hooks/useTheme';
import { CropMarks } from './proof/Marks';
import { SlugLine } from './SlugLine';
import { Footer } from './Footer';

const loadFeatures = () => import('./motionFeatures').then((mod) => mod.default);

export type SheetPage = 'studio' | 'lab' | 'gallery';

/**
 * Every page is one proof sheet lying in the viewing booth: a single tall
 * sheet of stock with crop marks at its corners and the slug line across its
 * head. More content goes further down the same sheet, never onto a second
 * one beside it.
 */
export function Sheet({
  page,
  proofNumber,
  children,
}: {
  page: SheetPage;
  proofNumber: string;
  children: ReactNode;
}) {
  const { theme, toggle } = useTheme();
  return (
    <LazyMotion features={loadFeatures} strict>
      <MotionConfig reducedMotion="user">
        <div className="min-h-dvh px-0 pb-0 pt-0 sm:px-8 sm:pb-12 sm:pt-8 lg:px-12">
          <div className="relative mx-auto max-w-[1480px] bg-sheet">
            <CropMarks className="hidden sm:block" />
            <SlugLine
              page={page}
              proofNumber={proofNumber}
              theme={theme}
              onToggleTheme={toggle}
            />
            <main id="top">{children}</main>
            <Footer />
          </div>
        </div>
      </MotionConfig>
    </LazyMotion>
  );
}
