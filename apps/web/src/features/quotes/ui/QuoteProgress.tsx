import type { QuoteDto } from '@quoteflow/shared';
import { type CSSProperties, useId } from 'react';
import { cn } from '@/lib/cn';
import { type QuoteStep, quoteSteps } from '../quote-outlook';

/** A pin under the tape at each step: navy once reached, in the status colour where it stopped. */
const PIN: Record<QuoteStep['state'], string> = {
  done: 'border-b-ink',
  todo: 'border-b-line-strong',
  stopped: 'border-b-current',
};

const LABEL: Record<QuoteStep['state'], string> = {
  done: 'font-semibold text-ink',
  todo: 'text-muted',
  stopped: 'font-semibold',
};

const STATE_TEXT: Record<QuoteStep['state'], string> = {
  done: ', done',
  todo: ', not yet',
  stopped: '',
};

/**
 * How far along the tape is pulled: to the middle of the furthest step reached, or all the way at
 * the end. A quote that stopped (declined or expired) is pulled only to the last step it reached.
 */
function reach(steps: QuoteStep[]): number {
  if (steps.every((step) => step.state === 'done')) return 100;
  const reached = steps.findLastIndex((step) => step.state === 'done');
  return ((reached * 2 + 1) / (steps.length * 2)) * 100;
}

/** How far a quote has come from created to invoiced, as a tape measure with a pin per step. */
export function QuoteProgress({ quote }: { quote: QuoteDto }) {
  const steps = quoteSteps(quote);
  const current = steps.findLastIndex((step) => step.state !== 'todo');
  const next = steps[current + 1];
  // Orange reads as progress, so a lost quote's tape stays neutral.
  const stopped = steps[current]?.state === 'stopped';
  const headingId = useId();
  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 id={headingId} className="label-mono text-muted">
          Progress
        </h2>
        <p aria-hidden="true" className="text-[13px] text-ink-2">
          <span className="font-semibold text-ink">{steps[current]?.label}</span>
          {next && <span className="text-muted"> · Next: {next.label}</span>}
        </p>
      </div>
      <div
        aria-hidden="true"
        style={
          {
            '--value': `${reach(steps)}%`,
            ...(stopped && { '--tape-fill': 'var(--color-edge)' }),
          } as CSSProperties
        }
        className="mt-3.5 h-3 tape-measure"
      />
      <ol
        aria-labelledby={headingId}
        className={cn('mt-1 grid', steps.length === 5 ? 'grid-cols-5' : 'grid-cols-4')}
      >
        {steps.map((step, index) => (
          <li
            key={step.label}
            aria-current={index === current ? 'step' : undefined}
            className={cn(
              'flex min-w-0 flex-col items-center text-center',
              // A declined quote stops in red, an expired one in khaki.
              step.state === 'stopped' &&
                (quote.status === 'expired' ? 'text-expired' : 'text-declined'),
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                'size-0 border-x-[5px] border-b-[6px] border-x-transparent',
                PIN[step.state],
              )}
            />
            <span
              className={cn(
                'mt-1.5 max-w-full truncate font-mono text-[10px] tracking-[0.04em] uppercase sm:text-[11px] sm:tracking-[0.06em]',
                LABEL[step.state],
              )}
            >
              {step.label}
              <span className="sr-only">{STATE_TEXT[step.state]}</span>
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
