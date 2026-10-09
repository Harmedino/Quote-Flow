import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Card } from './Card';

export interface PanelCardProps {
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  className?: string;
}

/** A compact titled card for the side panel of a detail page. */
export function PanelCard({ title, description, children, className }: PanelCardProps) {
  return (
    <Card className={cn('p-5', className)}>
      <h2 className="text-sm font-semibold text-zinc-950">{title}</h2>
      {description && <p className="mt-1 text-sm text-pretty text-zinc-600">{description}</p>}
      {children && <div className="mt-4">{children}</div>}
    </Card>
  );
}
