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
        <legend className="mb-1.5 text-sm font-semibold text-ink">Discount</legend>
        <div className="grid grid-cols-3 gap-0.5 rounded-[9px] bg-surface-muted p-[3px] shadow-[inset_0_0_0_1px_var(--color-line)] sm:inline-grid">
          {DISCOUNT_MODES.map((mode) => (
            <label
              key={mode.value}
              className={cn(
                'cursor-pointer rounded-[7px] px-3.5 py-1.5 text-center text-[13.5px] font-semibold transition-colors has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-focus',
                values.discountMode === mode.value
                  ? 'bg-surface text-ink shadow-[0_0_0_1px_var(--color-line-strong)]'
                  : 'text-muted hover:text-ink',
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
