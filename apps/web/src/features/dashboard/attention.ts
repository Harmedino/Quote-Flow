import type { DashboardAwaitingQuoteDto, DashboardDto, QuoteListItemDto } from '@quoteflow/shared';
import { daysBetween } from './dashboard-format';
import type { ChecklistItem } from './getting-started';

export type AttentionItem =
  | { kind: 'overdue'; count: number; amount: number; oldestDays: number | null }
  | { kind: 'ready'; quote: QuoteListItemDto }
  | { kind: 'viewed'; quote: DashboardAwaitingQuoteDto }
  | { kind: 'setup'; done: number; total: number; next: ChecklistItem };

/** More jobs than this crowd the side column; the rest are a tab away. */
export const MAX_ATTENTION_ITEMS = 3;

/**
 * The jobs that need the owner, most urgent first: overdue money, then customers who said yes
 * (an invoice to create), then customers who opened a quote without answering (a follow-up),
 * then the setup steps left. `total` counts every such job, shown or not.
 */
export function attentionItems(
  dashboard: Pick<
    DashboardDto,
    'quotes' | 'invoices' | 'readyToInvoice' | 'awaitingQuotes' | 'upcomingInvoices'
  >,
  today: string,
  checklist: readonly ChecklistItem[] = [],
): { items: AttentionItem[]; total: number } {
  const { quotes, invoices } = dashboard;
  const items: AttentionItem[] = [];
  if (invoices.overdueCount > 0) {
    // Unpaid invoices come soonest due first, so the first overdue one is the oldest.
    const oldest = dashboard.upcomingInvoices.find((invoice) => invoice.status === 'overdue');
    items.push({
      kind: 'overdue',
      count: invoices.overdueCount,
      amount: invoices.overdueAmount,
      oldestDays: oldest ? -daysBetween(today, oldest.dueDate) : null,
    });
  }
  for (const quote of dashboard.readyToInvoice) items.push({ kind: 'ready', quote });
  for (const quote of dashboard.awaitingQuotes) {
    if (quote.status === 'viewed') items.push({ kind: 'viewed', quote });
  }
  const next = checklist.find((item) => !item.done);
  if (next) {
    const done = checklist.filter((item) => item.done).length;
    items.push({ kind: 'setup', done, total: checklist.length, next });
  }
  const total =
    (invoices.overdueCount > 0 ? 1 : 0) +
    quotes.acceptedNotInvoiced +
    quotes.viewed +
    (next ? 1 : 0);
  return { items: items.slice(0, MAX_ATTENTION_ITEMS), total };
}
