import { TEXT_LIMITS } from '@quoteflow/shared';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import type { QuoteFormValues } from '../quote-form';

export interface QuoteFieldsProps {
  values: QuoteFormValues;
  errors: Record<string, string>;
  onChange: (changes: Partial<QuoteFormValues>) => void;
}

function daysBetween(from: string, to: string): number | null {
  const ms = Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`);
  return Number.isFinite(ms) ? Math.round(ms / 86_400_000) : null;
}

export function QuoteDatesFields({ values, errors, onChange }: QuoteFieldsProps) {
  const validity = daysBetween(values.issueDate, values.expiryDate);
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <Field label="Issue date" error={errors.issueDate} required>
        <Input
          type="date"
          name="issueDate"
          value={values.issueDate}
          onChange={(event) => onChange({ issueDate: event.target.value })}
        />
      </Field>
      <Field
        label="Valid until"
        error={errors.expiryDate}
        hint={
          validity !== null && validity >= 0
            ? `Valid for ${validity} ${validity === 1 ? 'day' : 'days'}`
            : undefined
        }
        required
      >
        <Input
          type="date"
          name="expiryDate"
          min={values.issueDate || undefined}
          value={values.expiryDate}
          onChange={(event) => onChange({ expiryDate: event.target.value })}
        />
      </Field>
    </div>
  );
}

export function QuoteNotesFields({ values, errors, onChange }: QuoteFieldsProps) {
  return (
    <div className="grid gap-5">
      <Field label="Notes" hint="Shown to the customer on the quote." error={errors.notes}>
        <Textarea
          name="notes"
          rows={3}
          maxLength={TEXT_LIMITS.notes}
          placeholder="E.g. Thanks for the opportunity to quote."
          value={values.notes}
          onChange={(event) => onChange({ notes: event.target.value })}
        />
      </Field>
      <Field label="Terms" error={errors.terms}>
        <Textarea
          name="terms"
          rows={3}
          maxLength={TEXT_LIMITS.terms}
          placeholder="E.g. 50% deposit to confirm the booking."
          value={values.terms}
          onChange={(event) => onChange({ terms: event.target.value })}
        />
      </Field>
    </div>
  );
}
