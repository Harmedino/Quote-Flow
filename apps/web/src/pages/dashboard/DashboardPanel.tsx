import { type ReactNode, useId } from 'react';
import { cn } from '@/lib/cn';

export interface DashboardPanelProps {
  title: ReactNode;
  /** Beside the title: a count ("3 jobs"), a link ("All invoices") or a control. */
  aside?: ReactNode;
  /**
   * On phones the title sits on the page and the content below it is one card; leave it off
   * when the content brings its own cards (the attention jobs).
   */
  phoneCard?: boolean;
  className?: string;
  headerClassName?: string;
  titleClassName?: string;
  children: ReactNode;
}

/**
 * A dashboard section. From `lg` it is a card with its title inside, as in the concept's
 * desktop dashboard; on phones the title is a section heading on the page above the content.
 */
export function DashboardPanel({
  title,
  aside,
  phoneCard = true,
  className,
  headerClassName,
  titleClassName,
  children,
}: DashboardPanelProps) {
  const titleId = useId();
  return (
    <section
      aria-labelledby={titleId}
      className={cn('min-w-0 lg:rounded-xl lg:bg-surface lg:shadow-(--shadow-card)', className)}
    >
      <div
        className={cn(
          'mb-2.5 flex min-h-8 items-center justify-between gap-x-4 gap-y-2 lg:mb-0 lg:px-6 lg:pt-4 lg:pb-3',
          headerClassName,
        )}
      >
        <h2 id={titleId} className={cn('heading-card min-w-0 text-ink', titleClassName)}>
          {title}
        </h2>
        {aside}
      </div>
      <div
        className={cn(
          'min-w-0',
          phoneCard && 'max-lg:rounded-xl max-lg:bg-surface max-lg:shadow-(--shadow-card)',
        )}
      >
        {children}
      </div>
    </section>
  );
}

/** A count beside a panel's title, e.g. "3 jobs". */
export function PanelCount({ children }: { children: ReactNode }) {
  return <span className="shrink-0 label-mono text-muted">{children}</span>;
}

/** What shows up in an empty panel, and how it gets there. */
export function PanelEmpty({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="px-6 py-8 text-center">
      <p className="text-[14.5px] font-bold text-ink">{title}</p>
      <p className="mx-auto mt-1 max-w-sm text-[13.5px] text-pretty text-muted">{description}</p>
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}
