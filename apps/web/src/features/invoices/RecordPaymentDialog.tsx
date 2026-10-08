import {
  type InvoiceDto,
  PAYMENT_METHOD_LABELS,
  PAYMENT_METHODS,
  type PaymentMethod,
  type RecordPaymentInput,
  formatMoney,
} from '@quoteflow/shared';
import { type FormEvent, useEffect, useId, useState } from 'react';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import {
  FORM_DIALOG_FORM_CLASSES,
  FormDialog,
  FormDialogBody,
  FormDialogFooter,
} from '@/components/ui/FormDialog';
import { Input } from '@/components/ui/Input';
import { MoneyInput } from '@/components/ui/MoneyInput';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { type FieldErrors, focusFirstInvalidField, getSubmitErrors } from '@/lib/forms';
import { buildPaymentInput, initialPaymentValues, type PaymentFormValues } from './payment-form';
import { useRecordPayment } from './use-invoices';

export interface RecordPaymentDialogProps {
  open: boolean;
  invoice: InvoiceDto;
  /** Today in the business time zone, 'YYYY-MM-DD'. */
  today: string;
  onClose: () => void;
  onRecorded: (invoice: InvoiceDto) => void;
}

export function RecordPaymentDialog({
  open,
  invoice,
  today,
  onClose,
  onRecorded,
}: RecordPaymentDialogProps) {
  const mutation = useRecordPayment(invoice.id);
  return (
    <FormDialog
      open={open}
      title="Record a payment"
      description={`${invoice.invoiceNumber} · ${formatMoney(invoice.balanceDue, invoice.currency)} due`}
      pending={mutation.isPending}
      onClose={onClose}
    >
      <PaymentForm
        invoice={invoice}
        today={today}
        pending={mutation.isPending}
        onCancel={onClose}
        onSubmit={(input) => mutation.mutateAsync(input)}
        onRecorded={onRecorded}
      />
    </FormDialog>
  );
}

const FORM_FIELDS = ['amount', 'method', 'paidAt', 'reference', 'note'];

interface PaymentFormProps {
  invoice: InvoiceDto;
  today: string;
  pending: boolean;
  onCancel: () => void;
  onSubmit: (input: RecordPaymentInput) => Promise<InvoiceDto>;
  onRecorded: (invoice: InvoiceDto) => void;
}

function PaymentForm({
  invoice,
  today,
  pending,
  onCancel,
  onSubmit,
  onRecorded,
}: PaymentFormProps) {
  const formId = useId();
  const [values, setValues] = useState<PaymentFormValues>(() =>
    initialPaymentValues(invoice.balanceDue, today),
  );
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (attempt > 0) focusFirstInvalidField(document.getElementById(formId));
  }, [attempt, formId]);

  function change<K extends keyof PaymentFormValues>(name: K, value: PaymentFormValues[K]) {
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  }

  function fail(fieldErrors: FieldErrors, message: string | null = null) {
    setErrors(fieldErrors);
    setFormError(message);
    setAttempt((current) => current + 1);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const result = buildPaymentInput(values, {
      balanceDue: invoice.balanceDue,
      currency: invoice.currency,
      today,
    });
    if (!result.success) {
      fail(result.fieldErrors);
      return;
    }
    setErrors({});
    setFormError(null);
    try {
      onRecorded(await onSubmit(result.data));
    } catch (error) {
      const submitErrors = getSubmitErrors(error, FORM_FIELDS);
      fail(submitErrors.fieldErrors, submitErrors.formError);
    }
  }

  return (
    <form id={formId} noValidate onSubmit={handleSubmit} className={FORM_DIALOG_FORM_CLASSES}>
      <FormDialogBody>
        {formError && (
          <Alert tone="danger" className="mb-5">
            {formError}
          </Alert>
        )}
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Amount received"
            error={errors.amount}
            required
            hint={`Balance due: ${formatMoney(invoice.balanceDue, invoice.currency)}`}
            className="sm:col-span-2"
          >
            <MoneyInput
              name="amount"
              currency={invoice.currency}
              value={values.amount}
              onChange={(amount) => change('amount', amount)}
            />
          </Field>
          <Field label="Method" error={errors.method} required>
            <Select
              name="method"
              value={values.method}
              onChange={(event) => change('method', event.target.value as PaymentMethod)}
            >
              {PAYMENT_METHODS.map((method) => (
                <option key={method} value={method}>
                  {PAYMENT_METHOD_LABELS[method]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Date received" error={errors.paidAt} required>
            <Input
              type="date"
              name="paidAt"
              max={today}
              value={values.paidAt}
              onChange={(event) => change('paidAt', event.target.value)}
            />
          </Field>
          <Field
            label="Reference"
            error={errors.reference}
            hint="Optional, e.g. a transfer or receipt number."
            className="sm:col-span-2"
          >
            <Input
              name="reference"
              autoComplete="off"
              value={values.reference}
              onChange={(event) => change('reference', event.target.value)}
            />
          </Field>
          <Field label="Note" error={errors.note} className="sm:col-span-2">
            <Textarea
              name="note"
              rows={2}
              value={values.note}
              onChange={(event) => change('note', event.target.value)}
            />
          </Field>
        </div>
      </FormDialogBody>
      <FormDialogFooter>
        <Button variant="secondary" onClick={onCancel} disabled={pending}>
          Cancel
        </Button>
        <Button type="submit" loading={pending}>
          Record payment
        </Button>
      </FormDialogFooter>
    </form>
  );
}
