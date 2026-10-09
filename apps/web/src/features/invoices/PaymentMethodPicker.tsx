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
      <legend className="text-sm font-medium text-stone-800">
        Method
        <span aria-hidden="true" className="ml-0.5 text-red-600">
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
                'flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-brand-500',
                selected
                  ? 'border-brand-600 bg-brand-50 text-stone-900 ring-1 ring-brand-600'
                  : 'border-stone-200 text-stone-700 hover:border-stone-300 hover:bg-stone-50',
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
                className={cn('size-4 shrink-0', selected ? 'text-brand-700' : 'text-stone-500')}
              />
              <span className="truncate">{PAYMENT_METHOD_LABELS[method]}</span>
            </label>
          );
        })}
      </div>
      {error && (
        <p id={errorId} className="mt-1.5 text-sm text-red-700">
          {error}
        </p>
      )}
    </fieldset>
  );
}
