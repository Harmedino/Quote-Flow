import type { QuoteDto } from '@quoteflow/shared';
import {
  CircleCheck,
  CircleX,
  Clock,
  Eye,
  FilePlus,
  type LucideIcon,
  Receipt,
  Send,
} from 'lucide-react';
import { formatCalendarDate } from '@/lib/format';

export interface TimelineEvent {
  key: string;
  icon: LucideIcon;
  label: string;
  /** Display text for when it happened. */
  when: string;
  detail?: string;
  tone: string;
}

function formatTimestamp(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone,
  }).format(new Date(iso));
}

/** What has happened to the quote so far, oldest first. */
export function quoteTimelineEvents(quote: QuoteDto, timeZone: string): TimelineEvent[] {
  const at = (iso: string) => formatTimestamp(iso, timeZone);
  const events: TimelineEvent[] = [
    {
      key: 'created',
      icon: FilePlus,
      label: 'Created',
      when: at(quote.createdAt),
      tone: 'bg-draft-tint text-draft',
    },
  ];
  if (quote.sentAt) {
    events.push({
      key: 'sent',
      icon: Send,
      label: 'Sent',
      when: at(quote.sentAt),
      tone: 'bg-sent-tint text-sent',
    });
  }
  if (quote.viewedAt) {
    events.push({
      key: 'viewed',
      icon: Eye,
      label: 'Viewed by customer',
      when: at(quote.viewedAt),
      tone: 'bg-viewed-tint text-viewed',
    });
  }
  if (quote.acceptedAt) {
    events.push({
      key: 'accepted',
      icon: CircleCheck,
      label: 'Accepted',
      when: at(quote.acceptedAt),
      tone: 'bg-accepted-tint text-accepted',
    });
  }
  if (quote.rejectedAt) {
    events.push({
      key: 'rejected',
      icon: CircleX,
      label: 'Declined',
      when: at(quote.rejectedAt),
      detail: quote.rejectionReason ? `“${quote.rejectionReason}”` : undefined,
      tone: 'bg-declined-tint text-declined',
    });
  }
  if (quote.status === 'expired') {
    events.push({
      key: 'expired',
      icon: Clock,
      label: 'Expired',
      when: `After ${formatCalendarDate(quote.expiryDate)}`,
      tone: 'bg-expired-tint text-expired',
    });
  }
  if (quote.convertedAt) {
    events.push({
      key: 'converted',
      icon: Receipt,
      label: 'Converted to invoice',
      when: at(quote.convertedAt),
      tone: 'bg-primary-tint text-primary-ink',
    });
  }
  return events;
}
