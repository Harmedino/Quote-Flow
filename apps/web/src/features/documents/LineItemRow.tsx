import type { CurrencyCode, ServiceDto } from '@quoteflow/shared';
import { Copy, Trash2 } from 'lucide-react';
import type { ReactNode, Ref } from 'react';
import { CONTROL_CLASSES } from '@/components/ui/control-styles';
import { MoneyInput } from '@/components/ui/MoneyInput';
import { cn } from '@/lib/cn';
import { formatMoney } from '@/lib/format';
import { ItemNameInput } from './ItemNameInput';
import { LINE_ITEM_COLUMNS } from './line-item-columns';
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
const CELL_LABEL = 'mb-1 block text-[13px] font-semibold text-ink-2 @3xl:sr-only';
const ERROR = 'mt-1 text-[12.5px] font-medium text-danger';

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
        <p id={errorId} className={ERROR}>
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
    'flex size-9 items-center justify-center rounded-lg text-muted transition-colors @3xl:size-8';

  return (
    <li className="animate-fade-in-up rounded-xl bg-surface-muted p-4 shadow-[inset_0_0_0_1px_var(--color-line)] @3xl:rounded-none @3xl:border-b @3xl:border-dashed @3xl:border-line-strong @3xl:bg-transparent @3xl:px-0 @3xl:py-3 @3xl:shadow-none">
      <div
        className={cn('grid grid-cols-4 gap-3 @3xl:items-start @3xl:gap-y-2', LINE_ITEM_COLUMNS)}
      >
        <Cell
          label={`Item ${position}`}
          htmlFor={id('name')}
          error={errors.name}
          errorId={errorId('name')}
          className="col-span-4 @3xl:col-span-1"
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
        <div className="col-span-4 @3xl:order-last">
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
            <p id={errorId('description')} className={ERROR}>
              {errors.description}
            </p>
          )}
        </div>

        <Cell
          label="Qty"
          htmlFor={id('quantity')}
          error={errors.quantity}
          errorId={errorId('quantity')}
          className="col-span-2 @3xl:col-span-1"
        >
          <QuantityInput
            id={id('quantity')}
            value={item.quantity}
            invalid={Boolean(errors.quantity)}
            describedBy={describedBy('quantity')}
            onChange={(quantity) => onChange({ ...item, quantity })}
          />
        </Cell>

        <Cell
          label="Unit"
          htmlFor={id('unit')}
          error={errors.unit}
          errorId={errorId('unit')}
          className="col-span-2 @3xl:col-span-1"
        >
          <input
            id={id('unit')}
            type="text"
            placeholder="hour"
            autoComplete="off"
            aria-invalid={Boolean(errors.unit) || undefined}
            aria-describedby={describedBy('unit')}
            className={cn(CONTROL_CLASSES, 'h-10.5')}
            value={item.unit}
            onChange={(event) => onChange({ ...item, unit: event.target.value })}
          />
        </Cell>

        <Cell
          label="Unit price"
          htmlFor={id('unitPrice')}
          error={errors.unitPrice}
          errorId={errorId('unitPrice')}
          // A row of its own on narrow rows: 8-digit naira prices need the width.
          className="col-span-4 @3xl:col-span-1"
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

        <div className="col-span-4 flex items-center justify-between gap-3 border-t-[1.5px] border-dashed border-line-strong pt-3 @3xl:contents">
          <p className="text-sm text-ink-2 @3xl:flex @3xl:h-10.5 @3xl:items-center @3xl:justify-end">
            <span className="@3xl:sr-only">Amount </span>
            {amount === null ? (
              <span className="text-muted">—</span>
            ) : (
              <span className="money text-[14px] text-ink">{formatMoney(amount, currency)}</span>
            )}
          </p>
          <div className="flex items-center justify-end gap-0.5 @3xl:h-10.5">
            <button
              type="button"
              onClick={onDuplicate}
              aria-label={`Duplicate item ${position}`}
              title="Duplicate"
              className={cn(iconButton, 'hover:bg-canvas-deep hover:text-ink')}
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
                'hover:bg-danger-tint hover:text-danger disabled:pointer-events-none disabled:opacity-40',
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
