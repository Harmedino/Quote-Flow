import type { CurrencyCode, ServiceDto } from '@quoteflow/shared';
import { Copy, Trash2 } from 'lucide-react';
import type { ReactNode, Ref } from 'react';
import { CONTROL_CLASSES } from '@/components/ui/control-styles';
import { MoneyInput } from '@/components/ui/MoneyInput';
import { cn } from '@/lib/cn';
import { formatMoney } from '@/lib/format';
import { ItemNameInput } from './ItemNameInput';
import { applyServiceToDraft, draftLineAmount, type LineItemDraft } from './line-items';
import { QuantityInput } from './QuantityInput';

export interface LineItemRowProps {
  index: number;
  item: LineItemDraft;
  currency: CurrencyCode;
  services: readonly ServiceDto[];
  /** Errors for this row, keyed by field name (name, quantity, …). */
  errors: Partial<Record<string, string>>;
  canRemove: boolean;
  onChange: (item: LineItemDraft) => void;
  onRemove: () => void;
  onDuplicate: () => void;
  nameInputRef: Ref<HTMLInputElement>;
}

/** Column labels are visible on narrow (stacked) rows and read by screen readers on wide ones. */
const CELL_LABEL = 'mb-1 block text-xs font-medium text-zinc-600 @2xl:sr-only';

function Cell({
  label,
  htmlFor,
  error,
  errorId,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  errorId: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn('min-w-0', className)}>
      <label htmlFor={htmlFor} className={CELL_LABEL}>
        {label}
      </label>
      {children}
      {error && (
        <p id={errorId} className="mt-1 text-xs text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

export function LineItemRow({
  index,
  item,
  currency,
  services,
  errors,
  canRemove,
  onChange,
  onRemove,
  onDuplicate,
  nameInputRef,
}: LineItemRowProps) {
  const id = (field: string) => `line-${item.key}-${field}`;
  const errorId = (field: string) => `${id(field)}-error`;
  const describedBy = (field: string) => (errors[field] ? errorId(field) : undefined);
  const amount = draftLineAmount(item);
  const position = index + 1;

  const iconButton =
    'flex size-9 items-center justify-center rounded-lg text-zinc-500 transition-colors @2xl:size-8';

  return (
    <li className="rounded-xl border border-zinc-200 bg-white p-4 @2xl:rounded-none @2xl:border-0 @2xl:border-b @2xl:bg-transparent @2xl:px-0 @2xl:py-3">
      <div className="grid grid-cols-4 gap-3 @2xl:grid-cols-[minmax(0,1fr)_4.5rem_5rem_8rem_6.5rem_4rem] @2xl:items-start @2xl:gap-x-2 @2xl:gap-y-2">
        <Cell
          label={`Item ${position}`}
          htmlFor={id('name')}
          error={errors.name}
          errorId={errorId('name')}
          className="col-span-4 @2xl:col-span-1"
        >
          <ItemNameInput
            id={id('name')}
            inputRef={nameInputRef}
            value={item.name}
            services={services}
            currency={currency}
            invalid={Boolean(errors.name)}
            describedBy={describedBy('name')}
            onChange={(name) =>
              onChange({ ...item, name, serviceId: name.trim() ? item.serviceId : undefined })
            }
            onSelectService={(service) => onChange(applyServiceToDraft(item, service))}
          />
        </Cell>

        {/* Under the name on narrow rows; a full-width second line on wide ones. */}
        <div className="col-span-4 @2xl:order-last">
          <label htmlFor={id('description')} className="sr-only">
            Item {position} description (optional)
          </label>
          <textarea
            id={id('description')}
            rows={1}
            placeholder="Description (optional)"
            aria-invalid={Boolean(errors.description) || undefined}
            aria-describedby={describedBy('description')}
            className={cn(
              CONTROL_CLASSES,
              'field-sizing-content min-h-9 resize-none py-1.5 text-sm sm:text-sm',
            )}
            value={item.description}
            onChange={(event) => onChange({ ...item, description: event.target.value })}
          />
          {errors.description && (
            <p id={errorId('description')} className="mt-1 text-xs text-red-700">
              {errors.description}
            </p>
          )}
        </div>

        <Cell
          label="Qty"
          htmlFor={id('quantity')}
          error={errors.quantity}
          errorId={errorId('quantity')}
        >
          <QuantityInput
            id={id('quantity')}
            value={item.quantity}
            invalid={Boolean(errors.quantity)}
            describedBy={describedBy('quantity')}
            onChange={(quantity) => onChange({ ...item, quantity })}
          />
        </Cell>

        <Cell label="Unit" htmlFor={id('unit')} error={errors.unit} errorId={errorId('unit')}>
          <input
            id={id('unit')}
            type="text"
            placeholder="hour"
            autoComplete="off"
            aria-invalid={Boolean(errors.unit) || undefined}
            aria-describedby={describedBy('unit')}
            className={cn(CONTROL_CLASSES, 'h-10')}
            value={item.unit}
            onChange={(event) => onChange({ ...item, unit: event.target.value })}
          />
        </Cell>

        <Cell
          label="Unit price"
          htmlFor={id('unitPrice')}
          error={errors.unitPrice}
          errorId={errorId('unitPrice')}
          className="col-span-2 @2xl:col-span-1"
        >
          <MoneyInput
            id={id('unitPrice')}
            currency={currency}
            value={item.unitPrice}
            placeholder="0.00"
            className="text-right tabular-nums"
            aria-invalid={Boolean(errors.unitPrice) || undefined}
            aria-describedby={describedBy('unitPrice')}
            onChange={(unitPrice) => onChange({ ...item, unitPrice })}
          />
        </Cell>

        <div className="col-span-4 flex items-center justify-between gap-3 border-t border-zinc-100 pt-3 @2xl:contents">
          <p className="text-sm text-zinc-600 @2xl:flex @2xl:h-10 @2xl:items-center @2xl:justify-end">
            <span className="@2xl:sr-only">Amount </span>
            {amount === null ? (
              <span className="text-zinc-400">—</span>
            ) : (
              <span className="font-semibold text-zinc-950 tabular-nums">
                {formatMoney(amount, currency)}
              </span>
            )}
          </p>
          <div className="flex items-center justify-end gap-0.5 @2xl:h-10">
            <button
              type="button"
              onClick={onDuplicate}
              aria-label={`Duplicate item ${position}`}
              title="Duplicate"
              className={cn(iconButton, 'hover:bg-zinc-100 hover:text-zinc-900')}
            >
              <Copy aria-hidden="true" className="size-4" />
            </button>
            <button
              type="button"
              onClick={onRemove}
              disabled={!canRemove}
              aria-label={`Remove item ${position}`}
              title="Remove"
              className={cn(
                iconButton,
                'hover:bg-red-50 hover:text-red-700 disabled:pointer-events-none disabled:opacity-40',
              )}
            >
              <Trash2 aria-hidden="true" className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </li>
  );
}
