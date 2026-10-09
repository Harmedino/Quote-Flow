import type { ComponentProps, ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface CardProps extends ComponentProps<'div'> {
  /** Only for surfaces that float above the page (rare); ordinary panels use a border. */
  elevated?: boolean;
}

export function Card({ className, elevated = false, ...props }: CardProps) {
  return (
    <div
      // min-w-0 keeps long, unwrappable content (truncated rows, tables) from widening a grid or flex column.
      className={cn(
        'min-w-0 rounded-xl border border-stone-200 bg-surface',
        elevated && 'shadow-[var(--shadow-elevated)]',
        className,
      )}
      {...props}
    />
  );
}

export interface CardHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function CardHeader({ title, description, actions, className }: CardHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-start justify-between gap-4 border-b border-stone-200 px-5 py-4 sm:px-6',
        className,
      )}
    >
      <div className="min-w-0">
        <h2 className="text-base font-semibold text-stone-900">{title}</h2>
        {description && <p className="mt-1 text-sm text-stone-500">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}

export function CardContent({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('px-5 py-5 sm:px-6', className)} {...props} />;
}

export function CardFooter({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-end gap-3 rounded-b-xl border-t border-stone-200 bg-surface-muted px-5 py-4 sm:px-6',
        className,
      )}
      {...props}
    />
  );
}
