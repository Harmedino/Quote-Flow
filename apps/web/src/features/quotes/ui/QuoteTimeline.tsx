import type { QuoteDto } from '@quoteflow/shared';
import { cn } from '@/lib/cn';
import { quoteTimelineEvents } from '../quote-timeline';

export function QuoteTimeline({ quote, timeZone }: { quote: QuoteDto; timeZone: string }) {
  const events = quoteTimelineEvents(quote, timeZone);
  return (
    <ol className="space-y-4">
      {events.map((event, index) => (
        <li key={event.key} className="relative flex gap-3">
          {index < events.length - 1 && (
            <span
              aria-hidden="true"
              className="absolute top-8 bottom-[-1rem] left-3.5 w-px bg-stone-200"
            />
          )}
          <span
            className={cn(
              'flex size-7 shrink-0 items-center justify-center rounded-full',
              event.tone,
            )}
          >
            <event.icon aria-hidden="true" className="size-3.5" />
          </span>
          <div className="min-w-0 pt-0.5">
            <p className="text-sm font-medium text-stone-900">{event.label}</p>
            <p className="text-xs text-stone-500">{event.when}</p>
            {event.detail && (
              <p className="mt-1.5 rounded-lg bg-stone-50 px-2.5 py-1.5 text-sm text-pretty text-stone-700">
                {event.detail}
              </p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
