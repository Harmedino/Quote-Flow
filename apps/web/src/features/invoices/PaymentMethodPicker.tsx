import { PAYMENT_METHOD_LABELS, PAYMENT_METHODS, type PaymentMethod } from '@quoteflow/shared';
import { useId } from 'react';
import { cn } from '@/lib/cn';
import { PAYMENT_METHOD_ICONS } from './payment-methods';

export interface PaymentMethodPickerProps {
  value: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
  error?: string;
  className?: string;
}

/** How the customer paid, as a group of radio tiles (arrow keys move between them). */
export function PaymentMethodPicker({
  value,
  onChange,
  error,
  className,
}: PaymentMethodPickerProps) {
  const errorId = useId();
  return (
    <fieldset className={cn('min-w-0', className)}>
      <legend className="text-sm font-semibold text-ink">
        Method
        <span aria-hidden="true" className="ml-0.5 text-danger">
          *
        </span>
      </legend>
      <div className="mt-1.5 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {PAYMENT_METHODS.map((method) => {
          const Icon = PAYMENT_METHOD_ICONS[method];
          const selected = value === method;
          return (
            <label
              key={method}
              className={cn(
                'flex cursor-pointer items-center gap-2 rounded-[9px] px-3 py-2.5 text-sm font-semibold transition-colors has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-focus',
                selected
                  ? 'bg-primary-tint text-ink shadow-[inset_0_0_0_1.5px_var(--color-ink)]'
                  : 'bg-surface text-ink-2 shadow-[inset_0_0_0_1px_var(--color-line-strong)] hover:bg-surface-muted hover:text-ink',
              )}
            >
              <input
                type="radio"
                name="method"
                value={method}
                checked={selected}
                onChange={() => onChange(method)}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? errorId : undefined}
                className="sr-only"
              />
              <Icon
                aria-hidden="true"
                className={cn('size-4 shrink-0', selected ? 'text-primary-ink' : 'text-muted')}
              />
              <span className="truncate">{PAYMENT_METHOD_LABELS[method]}</span>
            </label>
          );
        })}
      </div>
      {error && (
        <p id={errorId} className="mt-1.5 text-[13px] font-medium text-danger">
          {error}
        </p>
      )}
    </fieldset>
  );
}
