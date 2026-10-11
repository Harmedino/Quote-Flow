import type { QuoteDto } from '@quoteflow/shared';
import { cn } from '@/lib/cn';
import { quoteTimelineEvents } from '../quote-timeline';

/** What has happened to the quote, oldest first, joined by a perforated line. */
export function QuoteTimeline({ quote, timeZone }: { quote: QuoteDto; timeZone: string }) {
  const events = quoteTimelineEvents(quote, timeZone);
  return (
    <ol className="space-y-4">
      {events.map((event, index) => (
        <li key={event.key} className="relative flex gap-3">
          {index < events.length - 1 && (
            <span
              aria-hidden="true"
              className="absolute top-9 -bottom-3 left-[15px] border-l-[1.5px] border-dashed border-line-strong"
            />
          )}
          <span
            className={cn(
              'flex size-8 shrink-0 items-center justify-center rounded-lg',
              event.tone,
            )}
          >
            <event.icon aria-hidden="true" className="size-4" strokeWidth={2.25} />
          </span>
          <div className="min-w-0 pt-0.5">
            <p className="text-sm font-semibold text-ink">{event.label}</p>
            <p className="font-mono text-xs text-muted">{event.when}</p>
            {event.detail && (
              <p className="mt-1.5 rounded-lg bg-surface-muted px-2.5 py-1.5 text-sm text-pretty text-ink-2">
                {event.detail}
              </p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
