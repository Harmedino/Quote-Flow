import type { LineItemDraft } from '@/features/documents/line-items';
import type { SelectedCustomer } from './selected-customer';

/** Rows with a name, i.e. the items the customer will see. */
export function filledItemCount(items: readonly LineItemDraft[]): number {
  return items.filter((item) => item.name.trim()).length;
}

/** The line under the total on the phone action bar, e.g. "For Daniel Nguyen · 2 items". */
export function editorSummaryLine(
  customer: SelectedCustomer | null,
  items: readonly LineItemDraft[],
): string {
  const count = filledItemCount(items);
  const who = customer ? `For ${customer.name}` : 'No customer yet';
  return `${who} · ${count === 0 ? 'no items yet' : `${count} ${count === 1 ? 'item' : 'items'}`}`;
}
