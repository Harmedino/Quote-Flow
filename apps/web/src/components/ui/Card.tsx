import type { ComponentProps, ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface CardProps extends ComponentProps<'div'> {
  /** Only for surfaces that float above the page (rare); ordinary cards sit on a hairline. */
  elevated?: boolean;
}

/** A panel of ticket stock on the page: rounded, with a hairline ring instead of a border. */
export function Card({ className, elevated = false, ...props }: CardProps) {
  return (
    <div
      // min-w-0 keeps long, unwrappable content (truncated rows, tables) from widening a grid or flex column.
      className={cn(
        'min-w-0 rounded-xl bg-surface',
        elevated ? 'shadow-(--shadow-elevated)' : 'shadow-(--shadow-card)',
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
        'flex flex-wrap items-start justify-between gap-4 border-b border-line px-5 py-4 sm:px-6',
        className,
      )}
    >
      <div className="min-w-0">
        <h2 className="heading-card text-ink">{title}</h2>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}

export function CardContent({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('px-5 py-5 sm:px-6', className)} {...props} />;
}

/** A receipt-style footer: a dashed rule, then the actions or a total. */
export function CardFooter({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-end gap-3 rounded-b-xl border-t-[1.5px] border-dashed border-line-strong px-5 py-4 sm:px-6',
        className,
      )}
      {...props}
    />
  );
}
