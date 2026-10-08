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
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  titleAs: Title = 'h2',
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center px-6 py-12 text-center sm:py-16', className)}>
      {Icon && (
        <div className="flex size-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-600/10">
          <Icon aria-hidden="true" className="size-6" strokeWidth={1.75} />
        </div>
      )}
      <Title className="mt-5 text-base font-semibold text-zinc-950">{title}</Title>
      {description && (
        <p className="mt-2 max-w-sm text-sm text-pretty text-zinc-600">{description}</p>
      )}
      {action && <div className="mt-6 flex flex-wrap justify-center gap-3">{action}</div>}
    </div>
  );
}
