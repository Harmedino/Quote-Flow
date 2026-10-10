import type { CurrencyCode, ServiceDto } from '@quoteflow/shared';
import { Plus } from 'lucide-react';
import { formatMoney } from '@/lib/format';
import { matchServices } from './line-item-inputs';

export interface ServiceQuickAddProps {
  services: readonly ServiceDto[];
  currency: CurrencyCode;
  onAdd: (service: ServiceDto) => void;
}

/** Saved services as one-tap chips; the item name box finds the rest. */
export function ServiceQuickAdd({ services, currency, onAdd }: ServiceQuickAddProps) {
  const suggestions = matchServices(services, '');
  if (suggestions.length === 0) return null;
  return (
    <div className="mt-5 border-t border-stone-100 pt-4">
      <p className="section-label">Add from your services</p>
      {/* One swipeable row on phones; wrapped from sm up. */}
      <ul className="no-scrollbar -mx-5 mt-1.5 flex gap-2 overflow-x-auto px-5 py-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
        {suggestions.map((service) => {
          const price = `${formatMoney(service.price, currency)}${service.unit ? ` / ${service.unit}` : ''}`;
          return (
            <li key={service.id} className="shrink-0 sm:min-w-0 sm:shrink">
              <button
                type="button"
                onClick={() => onAdd(service)}
                className="group relative inline-flex max-w-full items-center gap-1.5 rounded-full border border-stone-200 bg-surface py-1.5 pr-3 pl-2 text-sm whitespace-nowrap text-stone-700 transition-colors hover:border-brand-400 hover:bg-brand-50 hover:text-stone-900"
              >
                <Plus
                  aria-hidden="true"
                  className="size-3.5 shrink-0 text-stone-500 group-hover:text-brand-700"
                />
                <span className="truncate font-medium">{service.name}</span>
                <span className="shrink-0 text-stone-500 tabular-nums">{price}</span>
                <span className="sr-only"> (add as an item)</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
