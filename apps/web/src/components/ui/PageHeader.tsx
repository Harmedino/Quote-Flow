import { ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { cn } from '@/lib/cn';

export interface PageHeaderProps {
  title: string;
  description?: ReactNode;
  /** Shown beside the title, e.g. a status badge. */
  badge?: ReactNode;
  actions?: ReactNode;
  back?: { to: string; label: string };
  className?: string;
}

export function PageHeader({
  title,
  description,
  badge,
  actions,
  back,
  className,
}: PageHeaderProps) {
  return (
    <header className={cn('mb-8', className)}>
      {back && (
        <Link
          to={back.to}
          className="mb-4 inline-flex items-center gap-1.5 rounded-md text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-950"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          {back.label}
        </Link>
      )}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h1 className="text-2xl font-semibold tracking-tight text-balance text-zinc-950">
              {title}
            </h1>
            {badge}
          </div>
          {description && (
            <p className="mt-1.5 max-w-2xl text-sm text-pretty text-zinc-600 sm:text-[0.9375rem]">
              {description}
            </p>
          )}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-3">{actions}</div>}
      </div>
    </header>
  );
}
