import { describe, expect, it } from 'vitest';
import { clauseJoiner, summaryClauses } from './summary';

const counts = (pending: number, acceptedNotInvoiced: number, overdueCount: number) => ({
  quotes: { total: 9, pending, viewed: 0, accepted: acceptedNotInvoiced, acceptedNotInvoiced },
  invoices: {
    total: 4,
    totalInvoiced: 0,
    amountPaid: 0,
    outstanding: 0,
    outstandingCount: 0,
    overdueCount,
    overdueAmount: 0,
  },
});

function sentence(clauses: ReturnType<typeof summaryClauses>): string {
  return clauses
    .map((clause, index) => clause.strong + clause.rest + clauseJoiner(index, clauses.length))
    .join('');
}

describe('summaryClauses', () => {
  it('reads as one sentence, overdue money last', () => {
    const clauses = summaryClauses(counts(4, 1, 2));
    expect(sentence(clauses)).toBe(
      '4 quotes are waiting for an answer, 1 is ready to invoice and 2 invoices are overdue.',
    );
    expect(clauses.map((clause) => clause.overdue ?? false)).toEqual([false, false, true]);
  });

  it('names what is ready when no quote is waiting, and agrees in number', () => {
    expect(sentence(summaryClauses(counts(0, 2, 1)))).toBe(
      '2 accepted quotes are ready to invoice and 1 invoice is overdue.',
    );
    expect(sentence(summaryClauses(counts(1, 0, 0)))).toBe('1 quote is waiting for an answer.');
  });

  it('is empty when nothing is waiting', () => {
    expect(summaryClauses(counts(0, 0, 0))).toEqual([]);
  });
});
