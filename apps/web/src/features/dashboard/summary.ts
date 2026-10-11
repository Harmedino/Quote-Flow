import type { DashboardDto } from '@quoteflow/shared';
import { plural } from './dashboard-format';

/** Part of the line under the greeting: `strong` is set in bold, an overdue part in red. */
export interface SummaryClause {
  strong: string;
  rest: string;
  overdue?: boolean;
}

/**
 * What is waiting on customers, as clauses for one sentence: "4 quotes are waiting for an
 * answer, 1 is ready to invoice and 2 invoices are overdue". Empty when nothing is waiting.
 */
export function summaryClauses({
  quotes,
  invoices,
}: Pick<DashboardDto, 'quotes' | 'invoices'>): SummaryClause[] {
  const clauses: SummaryClause[] = [];
  const are = (count: number) => (count === 1 ? 'is' : 'are');
  if (quotes.pending > 0) {
    clauses.push({
      strong: plural(quotes.pending, 'quote'),
      rest: ` ${are(quotes.pending)} waiting for an answer`,
    });
  }
  const ready = quotes.acceptedNotInvoiced;
  if (ready > 0) {
    // After the quotes clause the noun is understood: "4 quotes are waiting…, 1 is ready".
    clauses.push({
      strong: clauses.length ? String(ready) : plural(ready, 'accepted quote'),
      rest: ` ${are(ready)} ready to invoice`,
    });
  }
  if (invoices.overdueCount > 0) {
    clauses.push({
      strong: `${plural(invoices.overdueCount, 'invoice')} ${are(invoices.overdueCount)} overdue`,
      rest: '',
      overdue: true,
    });
  }
  return clauses;
}

/** The words between clause `index` and the next: ", " in a list, " and " before the last. */
export function clauseJoiner(index: number, count: number): string {
  if (index === count - 1) return '.';
  return index === count - 2 ? ' and ' : ', ';
}
