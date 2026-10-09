import { ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { cn } from '@/lib/cn';

export interface PageHeaderProps {
  title: string;
  /** A short line above the title, e.g. today's date on the dashboard. */
  eyebrow?: ReactNode;
  description?: ReactNode;
  /** Shown beside the title, e.g. a status badge. */
  badge?: ReactNode;
  actions?: ReactNode;
  back?: { to: string; label: string };
  className?: string;
}

/** The page's h1 in the display face, with optional back link, eyebrow, description and actions. */
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
    <header className={cn('mb-6 sm:mb-8', className)}>
      {back && (
        <Link
          to={back.to}
          className="-ml-2 mb-3 inline-flex h-9 items-center gap-1.5 rounded-full px-2 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-100 hover:text-stone-900"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          {back.label}
        </Link>
      )}
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div className="min-w-0">
          {eyebrow && <p className="text-sm text-stone-500">{eyebrow}</p>}
          <div className={cn('flex flex-wrap items-center gap-x-3 gap-y-1', eyebrow ? 'mt-1' : '')}>
            <h1 className="text-2xl font-semibold tracking-tight text-balance text-stone-900 sm:text-[1.75rem]">
              {title}
            </h1>
            {badge}
          </div>
          {description && (
            <p className="mt-1.5 max-w-2xl text-sm text-pretty text-stone-600 sm:text-[0.9375rem]">
              {description}
            </p>
          )}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-3">{actions}</div>}
      </div>
    </header>
  );
}
