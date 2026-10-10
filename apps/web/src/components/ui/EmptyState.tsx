import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  /** Heading level for the title; defaults to h2 (below the page's h1). */
  titleAs?: 'h1' | 'h2' | 'h3';
  /**
   * `plain` (default) sits inside a card. `dashed` draws its own dashed box, for an empty
   * state placed straight on the page.
   */
  variant?: 'plain' | 'dashed';
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  titleAs: Title = 'h2',
  variant = 'plain',
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex animate-fade-in-up flex-col items-center px-6 py-12 text-center sm:py-14',
        variant === 'dashed' && 'rounded-xl border border-dashed border-stone-300 bg-surface',
        className,
      )}
    >
      {Icon && (
        <div className="flex size-11 items-center justify-center rounded-full bg-stone-100 text-stone-500">
          <Icon aria-hidden="true" className="size-5" strokeWidth={1.75} />
        </div>
      )}
      <Title className={cn('text-base font-semibold text-stone-900', Icon && 'mt-4')}>
        {title}
      </Title>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm text-pretty text-stone-500">{description}</p>
      )}
      {action && <div className="mt-5 flex flex-wrap justify-center gap-3">{action}</div>}
    </div>
  );
}
