import type { CurrencyCode, LineItemDto } from '@quoteflow/shared';
import { formatMoney } from '@/lib/format';
import { formatQuantity } from './document-format';

interface DocumentItemsProps {
  items: LineItemDto[];
  currency: CurrencyCode;
}

const HEADER_TEXT = 'text-xs font-medium tracking-wider text-zinc-500 uppercase';
const HEADER_CELL = `py-3 whitespace-nowrap ${HEADER_TEXT}`;

function unitPriceLabel(item: LineItemDto, currency: CurrencyCode): string {
  const price = formatMoney(item.unitPrice, currency);
  return item.unit ? `${price} / ${item.unit}` : price;
}

/** A table from the `sm` breakpoint (and in print); a stacked list on phones. */
export function DocumentItems({ items, currency }: DocumentItemsProps) {
  return (
    <section aria-label="Items">
      <table className="hidden w-full text-sm sm:table">
        <thead>
          <tr className="border-b border-zinc-200">
            <th scope="col" className={`${HEADER_CELL} pr-4 text-left`}>
              Item
            </th>
            <th scope="col" className={`${HEADER_CELL} px-4 text-right`}>
              Qty
            </th>
            <th scope="col" className={`${HEADER_CELL} px-4 text-right`}>
              Unit price
            </th>
            <th scope="col" className={`${HEADER_CELL} pl-4 text-right`}>
              Amount
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {items.map((item, index) => (
            <tr key={index} className="break-inside-avoid align-top">
              <td className="py-4 pr-4">
                <p className="font-medium wrap-break-word text-zinc-950">{item.name}</p>
                {item.description && (
                  <p className="mt-1 wrap-break-word whitespace-pre-line text-zinc-500">
                    {item.description}
                  </p>
                )}
              </td>
              <td className="px-4 py-4 text-right whitespace-nowrap text-zinc-700 tabular-nums">
                {formatQuantity(item.quantity)}
              </td>
              <td className="px-4 py-4 text-right whitespace-nowrap text-zinc-700 tabular-nums">
                {formatMoney(item.unitPrice, currency)}
                {item.unit && <span className="block text-xs text-zinc-500">per {item.unit}</span>}
              </td>
              <td className="py-4 pl-4 text-right font-medium whitespace-nowrap text-zinc-950 tabular-nums">
                {formatMoney(item.amount, currency)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="sm:hidden">
        <div className="flex justify-between border-b border-zinc-200 pb-3">
          <span className={HEADER_TEXT}>Item</span>
          <span className={HEADER_TEXT}>Amount</span>
        </div>
        <ul className="divide-y divide-zinc-100">
          {items.map((item, index) => (
            <li key={index} className="flex justify-between gap-4 py-4">
              <div className="min-w-0">
                <p className="font-medium wrap-break-word text-zinc-950">{item.name}</p>
                {item.description && (
                  <p className="mt-1 text-sm wrap-break-word whitespace-pre-line text-zinc-500">
                    {item.description}
                  </p>
                )}
                <p className="mt-1.5 text-sm text-zinc-600 tabular-nums">
                  {formatQuantity(item.quantity)} × {unitPriceLabel(item, currency)}
                </p>
              </div>
              <p className="shrink-0 font-medium text-zinc-950 tabular-nums">
                {formatMoney(item.amount, currency)}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
