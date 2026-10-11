import { Check } from 'lucide-react';
import type { ReactNode } from 'react';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/cn';

export interface EditorSectionProps {
  /** Its number in the builder, shown on a small ticket before the title. */
  step: number;
  title: string;
  description?: string;
  /** A required step that is filled in: the ticket turns orange with a check. */
  done?: boolean;
  /** Id for the heading, so the section can be labelled by it. */
  headingId: string;
  actions?: ReactNode;
  className?: string;
  children: ReactNode;
}

/** One numbered step of the quote or invoice builder. */
export function EditorSection({
  step,
  title,
  description,
  done = false,
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
            <h2 id={headingId} className="flex items-center gap-3 heading-card text-ink">
              <span
                aria-hidden="true"
                className={cn(
                  'flex h-7 w-10 shrink-0 items-center justify-center rounded-md font-mono text-[12.5px] font-semibold tracking-normal transition-colors notch-mid [--notch:4px] font-stretch-100%',
                  done ? 'bg-primary text-on-primary' : 'bg-surface-muted text-ink-2',
                )}
              >
                {done ? (
                  <Check className="size-4 animate-spin-in" strokeWidth={3} />
                ) : (
                  String(step).padStart(2, '0')
                )}
              </span>
              {title}
              {done && <span className="sr-only">(done)</span>}
            </h2>
            {description && (
              <p className="mt-1.5 text-sm text-muted sm:pl-[3.25rem]">{description}</p>
            )}
          </div>
          {actions}
        </div>
        {children}
      </section>
    </Card>
  );
}
