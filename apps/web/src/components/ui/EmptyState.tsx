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
   * `plain` (default) sits inside a card. `dashed` draws its own perforated box, for an empty
   * state placed straight on the page.
   */
  variant?: 'plain' | 'dashed';
  className?: string;
}

/** Nothing here yet: the icon on a small orange ticket, a title, a line of help and an action. */
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
        variant === 'dashed' &&
          'rounded-xl border-[1.5px] border-dashed border-line-strong bg-surface/70',
        className,
      )}
    >
      {Icon && (
        <div className="flex h-11 w-14 items-center justify-center rounded-[9px] bg-primary-tint text-primary-ink notch-mid [--notch:6px]">
          <Icon aria-hidden="true" className="size-5" strokeWidth={2} />
        </div>
      )}
      <Title className={cn('heading-card text-ink', Icon && 'mt-4')}>{title}</Title>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm text-pretty text-muted">{description}</p>
      )}
      {action && <div className="mt-5 flex flex-wrap justify-center gap-3">{action}</div>}
    </div>
  );
}
