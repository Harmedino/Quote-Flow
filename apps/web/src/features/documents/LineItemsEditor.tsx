import type { CurrencyCode, ServiceDto } from '@quoteflow/shared';
import { CircleAlert, Plus } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { cn } from '@/lib/cn';
import { LINE_ITEM_COLUMNS } from './line-item-columns';
import { LineItemRow } from './LineItemRow';
import {
  addServiceLineItem,
  duplicateLineItemDraft,
  type LineItemDraft,
  newLineItemDraft,
} from './line-items';
import { ServiceQuickAdd } from './ServiceQuickAdd';

export interface LineItemsEditorProps {
  items: LineItemDraft[];
  onChange: (items: LineItemDraft[]) => void;
  currency: CurrencyCode;
  /** Catalogue services offered as suggestions; inactive ones are ignored. */
  services: ServiceDto[];
  /** Keyed by API path: `items` for the list, `items.0.quantity` for a field. */
  errors?: Record<string, string>;
}

const HEADER_CELL = 'label-mono text-muted';

/** Editable line items for quotes and invoices, as a table on wide containers and cards on narrow ones. */
export function LineItemsEditor({
  items,
  onChange,
  currency,
  services,
  errors = {},
}: LineItemsEditorProps) {
  const nameInputs = useRef(new Map<string, HTMLInputElement>());
  const addButton = useRef<HTMLButtonElement>(null);
  const pendingFocus = useRef<string | null>(null);

  useEffect(() => {
    const key = pendingFocus.current;
    if (key === null) return;
    pendingFocus.current = null;
    (nameInputs.current.get(key) ?? addButton.current)?.focus();
  }, [items]);

  function rowErrors(index: number): Partial<Record<string, string>> {
    const prefix = `items.${index}.`;
    const result: Record<string, string> = {};
    for (const [path, message] of Object.entries(errors)) {
      if (path.startsWith(prefix)) result[path.slice(prefix.length)] = message;
    }
    return result;
  }

  function update(index: number, item: LineItemDraft) {
    onChange(items.map((current, i) => (i === index ? item : current)));
  }

  function remove(index: number) {
    const next = items.filter((_, i) => i !== index);
    pendingFocus.current = (next[index] ?? next[index - 1])?.key ?? '';
    onChange(next);
  }

  function duplicate(index: number) {
    const source = items[index];
    if (!source) return;
    const copy = duplicateLineItemDraft(source);
    pendingFocus.current = copy.key;
    onChange([...items.slice(0, index + 1), copy, ...items.slice(index + 1)]);
  }

  function add() {
    const draft = newLineItemDraft();
    pendingFocus.current = draft.key;
    onChange([...items, draft]);
  }

  return (
    <div className="@container">
      <div
        aria-hidden="true"
        className={cn('hidden border-b border-line pb-2.5 @3xl:grid', LINE_ITEM_COLUMNS)}
      >
        <span className={HEADER_CELL}>Item</span>
        <span className={`${HEADER_CELL} text-right`}>Qty</span>
        <span className={HEADER_CELL}>Unit</span>
        <span className={`${HEADER_CELL} text-right`}>Unit price</span>
        <span className={`${HEADER_CELL} text-right`}>Amount</span>
        <span />
      </div>
      <ul className="space-y-3 @3xl:space-y-0" aria-label="Line items">
        {items.map((item, index) => (
          <LineItemRow
            key={item.key}
            index={index}
            item={item}
            currency={currency}
            services={services}
            errors={rowErrors(index)}
            canRemove={items.length > 1}
            onChange={(next) => update(index, next)}
            onRemove={() => remove(index)}
            onDuplicate={() => duplicate(index)}
            nameInputRef={(element) => {
              if (element) nameInputs.current.set(item.key, element);
              else nameInputs.current.delete(item.key);
            }}
          />
        ))}
      </ul>
      {errors.items && (
        <p
          role="alert"
          className="mt-3 flex items-center gap-1.5 text-[13px] font-medium text-danger"
        >
          <CircleAlert aria-hidden="true" className="size-4 shrink-0" />
          {errors.items}
        </p>
      )}
      <button
        ref={addButton}
        type="button"
        onClick={add}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border-[1.5px] border-dashed border-line-strong py-3 text-sm font-semibold text-ink-2 transition-colors hover:border-primary-ink hover:bg-primary-tint hover:text-ink"
      >
        <Plus aria-hidden="true" className="size-4 text-primary-ink" strokeWidth={2.5} />
        Add item
      </button>
      <ServiceQuickAdd
        services={services}
        currency={currency}
        onAdd={(service) => onChange(addServiceLineItem(items, service))}
      />
    </div>
  );
}
