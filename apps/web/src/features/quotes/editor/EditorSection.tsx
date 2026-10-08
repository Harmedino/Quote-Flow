import type { ReactNode } from 'react';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/cn';

export interface EditorSectionProps {
  title: string;
  description?: string;
  /** Id for the heading, so the section can be labelled by it. */
  headingId: string;
  actions?: ReactNode;
  className?: string;
  children: ReactNode;
}

export function EditorSection({
  title,
  description,
  headingId,
  actions,
  className,
  children,
}: EditorSectionProps) {
  return (
    <Card className={cn('p-5 sm:p-6', className)}>
      <section aria-labelledby={headingId}>
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 id={headingId} className="text-base font-semibold text-zinc-950">
              {title}
            </h2>
            {description && <p className="mt-1 text-sm text-zinc-600">{description}</p>}
          </div>
          {actions}
        </div>
        {children}
      </section>
    </Card>
  );
}
