import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export function Eyebrow({ children, onInk = false }: { children: ReactNode; onInk?: boolean }) {
  return (
    <p className={cn('text-sm font-medium', onInk ? 'text-highlight' : 'text-brand-700')}>
      {children}
    </p>
  );
}

export interface SectionHeadingProps {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: 'left' | 'center';
  onInk?: boolean;
  /** For aria-labelledby on the section. */
  id?: string;
  className?: string;
}

/** A marketing section's eyebrow, h2 and lead paragraph. */
export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'left',
  onInk = false,
  id,
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(align === 'center' ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl', className)}
    >
      {eyebrow && <Eyebrow onInk={onInk}>{eyebrow}</Eyebrow>}
      <h2
        id={id}
        className={cn(
          'text-3xl leading-[1.1] font-semibold tracking-tight text-balance sm:text-[2.6rem]',
          eyebrow && 'mt-3',
          onInk ? 'text-white' : 'text-stone-900',
        )}
      >
        {title}
      </h2>
      {description && (
        <p
          className={cn(
            'mt-4 text-base leading-relaxed text-pretty sm:text-lg',
            onInk ? 'text-white/65' : 'text-stone-600',
          )}
        >
          {description}
        </p>
      )}
    </div>
  );
}
