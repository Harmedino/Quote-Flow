import type { CurrencyCode, LineItemDto } from '@quoteflow/shared';
import { formatMoney } from '@/lib/format';
import { formatQuantity } from './document-format';

interface DocumentItemsProps {
  items: LineItemDto[];
  currency: CurrencyCode;
}

const HEADER_CELL = 'pb-2.5 font-normal whitespace-nowrap label-mono text-muted';
/** Items are divided by dashed receipt rules. */
const ITEM_RULE = 'border-b border-dashed border-line-strong';

function unitPriceLabel(item: LineItemDto, currency: CurrencyCode): string {
  const price = formatMoney(item.unitPrice, currency);
  return item.unit ? `${price} / ${item.unit}` : price;
}

function ItemName({ item }: { item: LineItemDto }) {
  return (
    <>
      <p className="text-[15px] font-bold wrap-break-word">{item.name}</p>
      {item.description && (
        <p className="mt-0.5 text-[13.5px] leading-snug wrap-break-word whitespace-pre-line text-muted">
          {item.description}
        </p>
      )}
    </>
  );
}

/** A table from the `sm` breakpoint (and in print); a stacked list on phones. */
export function DocumentItems({ items, currency }: DocumentItemsProps) {
  return (
    <div>
      <table className="hidden w-full sm:table">
        <thead>
          <tr className="border-b border-line">
            <th scope="col" className={`${HEADER_CELL} pr-4 text-left`}>
              The job
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
        <tbody>
          {items.map((item, index) => (
            <tr key={index} className={`${ITEM_RULE} break-inside-avoid align-top`}>
              <td className="py-3.5 pr-4">
                <ItemName item={item} />
              </td>
              <td className="px-4 py-3.5 text-right font-mono text-[13px] whitespace-nowrap text-ink-2 tabular-nums">
                {formatQuantity(item.quantity)}
              </td>
              <td className="px-4 py-3.5 text-right font-mono text-[13px] whitespace-nowrap text-ink-2 tabular-nums">
                {formatMoney(item.unitPrice, currency)}
                {item.unit && <span className="block text-xs text-muted">per {item.unit}</span>}
              </td>
              <td className="py-3.5 pl-4 text-right money text-[14.5px]">
                {formatMoney(item.amount, currency)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="sm:hidden">
        <div aria-hidden="true" className="flex justify-between">
          <span className="label-mono text-muted">The job</span>
          <span className="label-mono text-muted">Amount</span>
        </div>
        <ul aria-label="Items">
          {items.map((item, index) => (
            <li key={index} className={`${ITEM_RULE} py-3.5 first:pt-3`}>
              <div className="flex items-baseline justify-between gap-4">
                <div className="min-w-0">
                  <ItemName item={item} />
                </div>
                <p className="shrink-0 money text-[14.5px]">{formatMoney(item.amount, currency)}</p>
              </div>
              <p className="mt-1.5 font-mono text-[12.5px] text-ink-2 tabular-nums">
                {formatQuantity(item.quantity)} × {unitPriceLabel(item, currency)}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
