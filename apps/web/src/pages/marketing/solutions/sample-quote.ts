import {
  type DocumentTotals,
  calculateDocumentTotals,
  calculateLineAmount,
} from '@quoteflow/shared';
import type { SampleLine, SampleQuote } from './trade-details';

const KOBO_PER_NAIRA = 100;

export interface PricedSampleQuote {
  /** Line amounts in kobo. */
  lines: (SampleLine & { amount: number })[];
  /** In kobo. */
  totals: DocumentTotals;
}

const unitPriceOf = (line: SampleLine) => line.rate * KOBO_PER_NAIRA;

/** Works out a sample quote with QuoteFlow's own maths, so the website's figures always add up. */
export function priceSampleQuote({ lines, discount, taxRate }: SampleQuote): PricedSampleQuote {
  return {
    lines: lines.map((line) => ({
      ...line,
      amount: calculateLineAmount(line.quantity, unitPriceOf(line)),
    })),
    totals: calculateDocumentTotals({
      items: lines.map((line) => ({ quantity: line.quantity, unitPrice: unitPriceOf(line) })),
      discount:
        discount?.type === 'fixed'
          ? { type: 'fixed', value: discount.value * KOBO_PER_NAIRA }
          : discount,
      taxRate,
    }),
  };
}
