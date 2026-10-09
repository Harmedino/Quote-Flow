import type { CurrencyCode } from '@quoteflow/shared';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { MoneyInput } from '@/components/ui/MoneyInput';
import { cn } from '@/lib/cn';
import type { DiscountMode, QuoteFormValues } from '../quote-form';

const DISCOUNT_MODES: readonly { value: DiscountMode; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'percentage', label: 'Percent' },
  { value: 'fixed', label: 'Amount' },
];

export interface PricingFieldsProps {
  values: QuoteFormValues;
  currency: CurrencyCode;
  errors: Record<string, string>;
  onChange: (changes: Partial<QuoteFormValues>) => void;
}

/** Discount (none, percentage or fixed amount) and tax rate. */
export function PricingFields({ values, currency, errors, onChange }: PricingFieldsProps) {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <fieldset className="min-w-0 space-y-3">
        <legend className="mb-1.5 text-sm font-medium text-zinc-900">Discount</legend>
        <div className="inline-flex rounded-lg bg-zinc-100 p-1">
          {DISCOUNT_MODES.map((mode) => (
            <label
              key={mode.value}
              className={cn(
                'cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium transition-colors has-focus-visible:outline-2 has-focus-visible:outline-brand-600',
                values.discountMode === mode.value
                  ? 'bg-white text-zinc-950 shadow-xs ring-1 ring-zinc-950/5'
                  : 'text-zinc-600 hover:text-zinc-900',
              )}
            >
              <input
                type="radio"
                name="discountMode"
                value={mode.value}
                checked={values.discountMode === mode.value}
                onChange={() => onChange({ discountMode: mode.value })}
                className="sr-only"
              />
              {mode.label}
            </label>
          ))}
        </div>
        {values.discountMode === 'percentage' && (
          <Field label="Discount percentage" error={errors['discount.value']}>
            <Input
              name="discount.value"
              inputMode="decimal"
              autoComplete="off"
              suffix="%"
              placeholder="10"
              value={values.discountPercent}
              onChange={(event) => onChange({ discountPercent: event.target.value })}
            />
          </Field>
        )}
        {values.discountMode === 'fixed' && (
          <Field label="Discount amount" error={errors['discount.value']}>
            <MoneyInput
              name="discount.value"
              currency={currency}
              placeholder="0.00"
              value={values.discountAmount}
              onChange={(discountAmount) => onChange({ discountAmount })}
            />
          </Field>
        )}
      </fieldset>
      <Field label="Tax rate" hint="Applied after the discount." error={errors.taxRate}>
        <Input
          name="taxRate"
          inputMode="decimal"
          autoComplete="off"
          suffix="%"
          placeholder="0"
          value={values.taxRate}
          onChange={(event) => onChange({ taxRate: event.target.value })}
        />
      </Field>
    </div>
  );
}
