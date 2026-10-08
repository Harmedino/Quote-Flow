import {
  type CurrencyCode,
  type PaymentMethod,
  type RecordPaymentInput,
  formatMoney,
  recordPaymentInputSchema,
} from '@quoteflow/shared';
import { type FieldErrors, validateForm } from '@/lib/forms';

export interface PaymentFormValues {
  /** Minor units; null while the field is empty. */
  amount: number | null;
  method: PaymentMethod;
  /** 'YYYY-MM-DD'. */
  paidAt: string;
  reference: string;
  note: string;
}

export function initialPaymentValues(balanceDue: number, today: string): PaymentFormValues {
  return { amount: balanceDue, method: 'bank_transfer', paidAt: today, reference: '', note: '' };
}

/**
 * Validates with the API's schema plus the checks that need the invoice: the
 * balance due and today's date in the business time zone.
 */
export function buildPaymentInput(
  values: PaymentFormValues,
  { balanceDue, currency, today }: { balanceDue: number; currency: CurrencyCode; today: string },
): { success: true; data: RecordPaymentInput } | { success: false; fieldErrors: FieldErrors } {
  const result = validateForm(recordPaymentInputSchema, {
    amount: values.amount ?? Number.NaN,
    method: values.method,
    paidAt: values.paidAt,
    ...(values.reference.trim() && { reference: values.reference }),
    ...(values.note.trim() && { note: values.note }),
  });
  const fieldErrors: Record<string, string | undefined> = result.success
    ? {}
    : { ...result.fieldErrors };

  if (values.amount === null) fieldErrors.amount = 'Enter the amount received';
  else if (values.amount > balanceDue) {
    fieldErrors.amount = `The balance due is ${formatMoney(balanceDue, currency)}`;
  }
  if (!values.paidAt) fieldErrors.paidAt = 'Enter the payment date';
  else if (values.paidAt > today) fieldErrors.paidAt = 'The payment date cannot be in the future';

  if (!result.success || Object.values(fieldErrors).some(Boolean)) {
    return { success: false, fieldErrors };
  }
  return { success: true, data: result.data };
}
