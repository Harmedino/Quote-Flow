import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Card } from './Card';

export interface PanelCardProps {
  title: string;
  description?: ReactNode;
  /** Shown at the end of the title row, e.g. an "Edit" link. */
  action?: ReactNode;
  children?: ReactNode;
  className?: string;
}

/** A compact titled card for the side panel of a detail page. */
export function PanelCard({ title, description, action, children, className }: PanelCardProps) {
  return (
    <Card className={cn('p-5', className)}>
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-base font-semibold text-stone-900">{title}</h2>
        {action && <div className="shrink-0 text-sm">{action}</div>}
      </div>
      {description && <p className="mt-1 text-sm text-pretty text-stone-500">{description}</p>}
      {children && <div className="mt-4">{children}</div>}
    </Card>
  );
}
