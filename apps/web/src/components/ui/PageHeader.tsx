import { ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { cn } from '@/lib/cn';

export interface PageHeaderProps {
  title: string;
  /**
   * A mono line above the title with an orange marker, e.g. "Saturday · 10 Oct 2026 · Victoria
   * Island, Lagos" on the dashboard. It is set in capitals by CSS, so pass ordinary text.
   */
  eyebrow?: ReactNode;
  description?: ReactNode;
  /** Shown beside the title, e.g. a status tag. */
  badge?: ReactNode;
  actions?: ReactNode;
  back?: { to: string; label: string };
  className?: string;
}

/** The page's h1 in Archivo's wide heavy cut, with optional back link, eyebrow, description and actions. */
export function PageHeader({
  title,
  eyebrow,
  description,
  badge,
  actions,
  back,
  className,
}: PageHeaderProps) {
  return (
    <header className={cn('mb-5 sm:mb-6', className)}>
      {back && (
        <Link
          to={back.to}
          className="-ml-1.5 mb-2 inline-flex h-8 items-center gap-1.5 rounded-lg px-1.5 text-[13.5px] font-semibold text-ink-2 transition-colors hover:bg-surface-muted hover:text-ink"
        >
          <ArrowLeft aria-hidden="true" className="size-4" strokeWidth={2.25} />
          {back.label}
        </Link>
      )}
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:gap-6">
        <div className="min-w-0">
          {eyebrow && (
            <p className="mb-2 flex items-center gap-2 label-mono text-muted">
              <span aria-hidden="true" className="size-1.5 shrink-0 rounded-[2px] bg-primary" />
              <span className="min-w-0">{eyebrow}</span>
            </p>
          )}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <h1 className="heading-page text-balance text-ink">{title}</h1>
            {badge}
          </div>
          {description && (
            <p className="mt-2 max-w-2xl text-[14.5px] text-pretty text-ink-2 md:mt-2.5 md:text-[15.5px]">
              {description}
            </p>
          )}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2.5">{actions}</div>}
      </div>
    </header>
  );
}
