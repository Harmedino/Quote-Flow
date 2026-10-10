import { Check } from 'lucide-react';
import type { ReactNode } from 'react';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/cn';

export interface EditorSectionProps {
  /** Its number in the builder, shown in a chip before the title. */
  step: number;
  title: string;
  description?: string;
  /** A required step that is filled in: the chip turns into a green check. */
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
            <h2
              id={headingId}
              className="flex items-center gap-2.5 text-base font-semibold text-stone-900"
            >
              <span
                aria-hidden="true"
                className={cn(
                  'flex size-6 shrink-0 items-center justify-center rounded-full font-sans text-xs font-bold transition-colors',
                  done ? 'bg-brand-600 text-white' : 'bg-stone-100 text-stone-600',
                )}
              >
                {done ? <Check className="size-3.5 animate-spin-in" strokeWidth={3} /> : step}
              </span>
              {title}
              {done && <span className="sr-only">(done)</span>}
            </h2>
            {description && (
              <p className="mt-1.5 text-sm text-stone-600 sm:pl-8.5">{description}</p>
            )}
          </div>
          {actions}
        </div>
        {children}
      </section>
    </Card>
  );
}
