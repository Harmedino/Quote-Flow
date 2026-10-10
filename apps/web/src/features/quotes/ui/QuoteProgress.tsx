import type { QuoteDto } from '@quoteflow/shared';
import { cn } from '@/lib/cn';
import { type QuoteStep, quoteSteps } from '../quote-outlook';

const BAR: Record<QuoteStep['state'], string> = {
  done: 'bg-highlight',
  todo: 'bg-white/15',
  stopped: 'bg-white/45',
};

const STATE_TEXT: Record<QuoteStep['state'], string> = {
  done: ', done',
  todo: ', not yet',
  stopped: '',
};

/** How far a quote has come from draft to invoice, as a segmented bar on the ink hero. */
export function QuoteProgress({ quote }: { quote: QuoteDto }) {
  const steps = quoteSteps(quote);
  const current = steps.findLastIndex((step) => step.state !== 'todo');
  const next = steps[current + 1];
  return (
    <>
      <ol aria-label="Progress" className="mt-6 flex gap-1.5">
        {steps.map((step, index) => (
          <li
            key={step.label}
            aria-current={index === current ? 'step' : undefined}
            className="min-w-0 flex-1"
          >
            <span
              aria-hidden="true"
              style={{ animationDelay: `${index * 80}ms` }}
              className={cn(
                'block h-1.5 rounded-full',
                BAR[step.state],
                step.state === 'done' && 'animate-grow-width',
              )}
            />
            <span
              className={cn(
                'mt-2 block truncate text-xs font-medium max-sm:sr-only',
                step.state === 'todo' ? 'text-white/60' : 'text-white',
              )}
            >
              {step.label}
              <span className="sr-only">{STATE_TEXT[step.state]}</span>
            </span>
          </li>
        ))}
      </ol>
      {/* Five labels don't fit a phone, so there the bar gets one caption: where it is, what's next. */}
      <p aria-hidden="true" className="mt-2 text-xs font-medium text-white sm:hidden">
        {steps[current]?.label}
        {next && <span className="text-white/60"> · Next: {next.label}</span>}
      </p>
    </>
  );
}
