import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface PageHeroProps {
  title: ReactNode;
  description: ReactNode;
  /** The faint grid of the product pages (Features, Solutions, Pricing); plain ink otherwise. */
  grid?: boolean;
  /** Under the description: actions or anchor chips. */
  children?: ReactNode;
}

/** The ink band at the top of every marketing page but the home page. */
export function PageHero({ title, description, grid = false, children }: PageHeroProps) {
  return (
    <section className={grid ? 'bg-ink-grid' : 'bg-ink'}>
      <div
        className={cn(
          'mx-auto max-w-6xl px-4 sm:px-6 lg:px-8',
          grid ? 'pt-14 pb-16 sm:pt-20 sm:pb-20' : 'pt-12 pb-14 sm:pt-16 sm:pb-20',
        )}
      >
        <div className="max-w-3xl animate-fade-in-up">
          <h1 className="text-4xl leading-[1.05] font-semibold tracking-tight text-balance text-white sm:text-6xl">
            {title}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-pretty text-white/70 sm:text-lg">
            {description}
          </p>
        </div>
        {children}
      </div>
    </section>
  );
}
