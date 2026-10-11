import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Ruler } from './Ruler';
import { Eyebrow } from './SectionHeading';
import { SITE_CONTAINER } from './site-container';

export interface PageHeroProps {
  /** The mono label above the title, e.g. "Features". */
  eyebrow: string;
  title: ReactNode;
  description: ReactNode;
  /** Under the description: actions or anchor links. */
  children?: ReactNode;
  /** Centred, for a page that is one statement (Pricing). */
  align?: 'left' | 'center';
}

/** The top of every website page but the home page: a big headline on site paper, over a ruler. */
export function PageHero({ eyebrow, title, description, children, align = 'left' }: PageHeroProps) {
  const centred = align === 'center';
  return (
    <section className={cn(SITE_CONTAINER, 'pt-12 sm:pt-16 lg:pt-20')}>
      <div
        className={cn(
          'animate-fade-in-up',
          centred ? 'mx-auto max-w-4xl text-center' : 'max-w-5xl',
        )}
      >
        <Eyebrow marker className={centred ? 'justify-center' : undefined}>
          {eyebrow}
        </Eyebrow>
        <h1 className="mt-5 heading-display text-balance text-ink">{title}</h1>
        <p
          className={cn(
            'mt-6 max-w-2xl text-[1.0625rem] leading-[1.55] text-pretty text-ink-2 sm:text-[1.1875rem]',
            centred && 'mx-auto',
          )}
        >
          {description}
        </p>
      </div>
      {children}
      <Ruler className="mt-12 sm:mt-16" />
    </section>
  );
}
