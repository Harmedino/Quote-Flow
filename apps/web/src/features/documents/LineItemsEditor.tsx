import type { CurrencyCode, ServiceDto } from '@quoteflow/shared';
import { CircleAlert, Plus } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { LineItemRow } from './LineItemRow';
import { duplicateLineItemDraft, type LineItemDraft, newLineItemDraft } from './line-items';

export interface LineItemsEditorProps {
  items: LineItemDraft[];
  onChange: (items: LineItemDraft[]) => void;
  currency: CurrencyCode;
  /** Catalogue services offered as suggestions; inactive ones are ignored. */
  services: ServiceDto[];
  /** Keyed by API path: `items` for the list, `items.0.quantity` for a field. */
  errors?: Record<string, string>;
}

const HEADER_CELL = 'text-xs font-medium tracking-wide text-zinc-500 uppercase';

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
        className="hidden border-b border-zinc-200 pb-2 @2xl:grid @2xl:grid-cols-[minmax(0,1fr)_4.5rem_5rem_8rem_6.5rem_4rem] @2xl:gap-x-2"
      >
        <span className={HEADER_CELL}>Item</span>
        <span className={`${HEADER_CELL} text-right`}>Qty</span>
        <span className={HEADER_CELL}>Unit</span>
        <span className={`${HEADER_CELL} text-right`}>Unit price</span>
        <span className={`${HEADER_CELL} text-right`}>Amount</span>
        <span />
      </div>
      <ul className="space-y-3 @2xl:space-y-0" aria-label="Line items">
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
        <p role="alert" className="mt-3 flex items-center gap-1.5 text-sm text-red-700">
          <CircleAlert aria-hidden="true" className="size-4 shrink-0" />
          {errors.items}
        </p>
      )}
      <Button ref={addButton} variant="secondary" className="mt-4" onClick={add}>
        <Plus aria-hidden="true" />
        Add item
      </Button>
    </div>
  );
}
