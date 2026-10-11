import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

/**
 * A mono caps label above a heading. `marker` adds the small orange square the app's page
 * headers carry, for the label at the top of a page.
 */
export function Eyebrow({
  children,
  marker = false,
  className,
}: {
  children: ReactNode;
  marker?: boolean;
  className?: string;
}) {
  return (
    <p className={cn('flex items-center gap-2 label-mono text-muted', className)}>
      {marker && <span aria-hidden="true" className="size-2 shrink-0 bg-primary" />}
      {children}
    </p>
  );
}

const TITLE_SIZES = {
  /** A section of the page. */
  lg: 'heading-section',
  /** A row or a block within a section. */
  md: 'text-[1.75rem] leading-[1.06] font-[830] tracking-[-0.025em] font-stretch-118% sm:text-[2.375rem]',
} as const;

export interface SectionHeadingProps {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  size?: keyof typeof TITLE_SIZES;
  align?: 'left' | 'center';
  /** For aria-labelledby on the section. */
  id?: string;
  className?: string;
}

/** A website section's eyebrow, h2 and lead paragraph. */
export function SectionHeading({
  eyebrow,
  title,
  description,
  size = 'lg',
  align = 'left',
  id,
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(align === 'center' ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl', className)}
    >
      {eyebrow && (
        <Eyebrow className={align === 'center' ? 'justify-center' : undefined}>{eyebrow}</Eyebrow>
      )}
      <h2 id={id} className={cn(TITLE_SIZES[size], 'text-balance text-ink', eyebrow && 'mt-3.5')}>
        {title}
      </h2>
      {description && (
        <p className="mt-5 text-[1.0625rem] leading-[1.6] text-pretty text-ink-2 sm:text-lg">
          {description}
        </p>
      )}
    </div>
  );
}
