import type { BusinessDto, InvoiceDto } from '@quoteflow/shared';
import { useEffect, useId, useState } from 'react';
import { useNavigate } from 'react-router';
import { paths } from '@/app/paths';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { ButtonLink } from '@/components/ui/ButtonLink';
import { Card } from '@/components/ui/Card';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { DocumentTotalsSummary } from '@/features/documents/DocumentTotalsSummary';
import { LineItemsEditor } from '@/features/documents/LineItemsEditor';
import { withoutBlankLineItems } from '@/features/documents/line-items';
import { CustomerPicker } from '@/features/quotes/editor/CustomerPicker';
import { EditorSection } from '@/features/quotes/editor/EditorSection';
import { PricingFields } from '@/features/quotes/editor/PricingFields';
import type { SelectedCustomer } from '@/features/quotes/editor/selected-customer';
import { placeFieldErrors } from '@/features/quotes/quote-form';
import { useServicesQuery } from '@/features/services/use-services';
import { focusFirstInvalidField, getSubmitErrors } from '@/lib/forms';
import {
  type InvoiceFormValues,
  asPricingValues,
  invoiceFormFieldPaths,
  invoicePreviewPricing,
  validateInvoiceForm,
} from './invoice-form';
import { useCreateInvoice, useUpdateInvoice } from './use-invoices';

export interface InvoiceEditorProps {
  business: BusinessDto;
  initialValues: InvoiceFormValues;
  initialCustomer: SelectedCustomer | null;
  /** The draft being edited; omit to create a new one. */
  invoice?: InvoiceDto;
}

const SERVICES_QUERY = { active: true, pageSize: 100 } as const;

/** Clears the errors an edit makes stale: the changed fields', and every item error on item edits. */
function withoutStaleErrors(
  errors: Record<string, string>,
  changes: Partial<InvoiceFormValues>,
): Record<string, string> {
  const fields = Object.keys(changes);
  const stale = (path: string) =>
    fields.some((field) => {
      if (field === 'items') return path.startsWith('items');
      if (field.startsWith('discount')) return path.startsWith('discount');
      if (field === 'issueDate') return path === 'issueDate' || path === 'dueDate';
      return path === field;
    });
  const next = Object.fromEntries(Object.entries(errors).filter(([path]) => !stale(path)));
  return Object.keys(next).length === Object.keys(errors).length ? errors : next;
}

/** The standalone invoice builder shared by the new and edit pages. Saves drafts only. */
export function InvoiceEditor({
  business,
  initialValues,
  initialCustomer,
  invoice,
}: InvoiceEditorProps) {
  const formId = useId();
  const navigate = useNavigate();
  const [values, setValues] = useState(initialValues);
  const [customer, setCustomer] = useState(initialCustomer);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const services = useServicesQuery(SERVICES_QUERY);
  const createInvoice = useCreateInvoice();
  const updateInvoice = useUpdateInvoice(invoice?.id ?? '');
  const saving = createInvoice.isPending || updateInvoice.isPending;

  const currency = invoice?.currency ?? business.currency;
  const { discount, taxRate } = invoicePreviewPricing(values);

  useEffect(() => {
    if (attempt > 0) focusFirstInvalidField(document.getElementById(formId));
  }, [attempt, formId]);

  function change(changes: Partial<InvoiceFormValues>) {
    setErrors((current) => withoutStaleErrors(current, changes));
    setValues((current) => ({ ...current, ...changes }));
  }

  function showErrors(fieldErrors: Record<string, string>, message: string | null) {
    setErrors(fieldErrors);
    setFormError(message);
    setAttempt((current) => current + 1);
  }

  async function save() {
    if (saving) return;
    const submitted = { ...values, items: withoutBlankLineItems(values.items) };
    if (submitted.items.length !== values.items.length) setValues(submitted);

    const result = validateInvoiceForm(submitted);
    if (!result.success) {
      showErrors(placeFieldErrors(result.fieldErrors), null);
      return;
    }
    setFormError(null);
    try {
      const saved = invoice
        ? await updateInvoice.mutateAsync(result.data)
        : await createInvoice.mutateAsync(result.data);
      void navigate(paths.invoice(saved.id));
    } catch (error) {
      const submitErrors = getSubmitErrors(error, invoiceFormFieldPaths(submitted));
      showErrors(placeFieldErrors(submitErrors.fieldErrors), submitErrors.formError);
    }
  }

  const cancelTo = invoice ? paths.invoice(invoice.id) : paths.invoices;
  const actions = (
    <>
      <Button type="submit" size="lg" className="w-full" loading={saving}>
        {invoice ? 'Save changes' : 'Save draft'}
      </Button>
      <ButtonLink to={cancelTo} variant="secondary" size="lg" className="w-full">
        Cancel
      </ButtonLink>
    </>
  );

  return (
    <form
      id={formId}
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        void save();
      }}
    >
      {formError && (
        <Alert tone="danger" className="mb-6">
          {formError}
        </Alert>
      )}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem] xl:items-start">
        <div className="min-w-0 space-y-6">
          <EditorSection title="Customer" headingId={`${formId}-customer`}>
            <CustomerPicker
              inputId={`${formId}-customer-search`}
              customer={customer}
              error={errors.customerId}
              onChange={(next) => {
                setCustomer(next);
                change({ customerId: next.id });
              }}
            />
          </EditorSection>

          <EditorSection
            title="Items"
            description="Pick from your services or type any item. Prices are per unit."
            headingId={`${formId}-items`}
          >
            <LineItemsEditor
              items={values.items}
              onChange={(items) => change({ items })}
              currency={currency}
              services={services.data?.data ?? []}
              errors={errors}
            />
          </EditorSection>

          <EditorSection title="Discount and tax" headingId={`${formId}-pricing`}>
            <PricingFields
              values={asPricingValues(values)}
              currency={currency}
              errors={errors}
              onChange={({ discountMode, discountPercent, discountAmount, taxRate: rate }) =>
                change({
                  ...(discountMode !== undefined && { discountMode }),
                  ...(discountPercent !== undefined && { discountPercent }),
                  ...(discountAmount !== undefined && { discountAmount }),
                  ...(rate !== undefined && { taxRate: rate }),
                })
              }
            />
          </EditorSection>

          <EditorSection title="Dates and notes" headingId={`${formId}-details`}>
            <div className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Issue date" error={errors.issueDate} required>
                  <Input
                    type="date"
                    name="issueDate"
                    value={values.issueDate}
                    onChange={(event) => change({ issueDate: event.target.value })}
                  />
                </Field>
                <Field
                  label="Due date"
                  error={errors.dueDate}
                  required
                  hint={`Your default is ${business.invoiceDueDays} days after issue.`}
                >
                  <Input
                    type="date"
                    name="dueDate"
                    min={values.issueDate || undefined}
                    value={values.dueDate}
                    onChange={(event) => change({ dueDate: event.target.value })}
                  />
                </Field>
              </div>
              <Field
                label="Notes"
                error={errors.notes}
                hint="Shown on the invoice, e.g. how to pay."
              >
                <Textarea
                  name="notes"
                  rows={3}
                  value={values.notes}
                  onChange={(event) => change({ notes: event.target.value })}
                />
              </Field>
              <Field label="Terms" error={errors.terms}>
                <Textarea
                  name="terms"
                  rows={3}
                  value={values.terms}
                  onChange={(event) => change({ terms: event.target.value })}
                />
              </Field>
            </div>
          </EditorSection>

          <Card className="space-y-5 p-5 sm:p-6 xl:hidden">
            <h2 className="text-base font-semibold text-zinc-950">Summary</h2>
            <DocumentTotalsSummary
              items={values.items}
              discount={discount}
              taxRate={taxRate}
              currency={currency}
            />
            <div className="flex flex-col gap-3 sm:flex-row-reverse [&>*]:sm:w-auto">{actions}</div>
          </Card>
        </div>

        <Card className="sticky top-8 hidden space-y-4 p-5 xl:block">
          <div>
            <h2 className="text-sm font-semibold text-zinc-950">
              {invoice ? `Invoice ${invoice.invoiceNumber}` : 'New invoice'}
            </h2>
            <p className="mt-1 text-sm text-zinc-600">
              {customer ? `For ${customer.name}` : 'Choose a customer to bill.'}
            </p>
          </div>
          <DocumentTotalsSummary
            items={values.items}
            discount={discount}
            taxRate={taxRate}
            currency={currency}
          />
          <div className="grid gap-2.5 pt-2">{actions}</div>
          <p className="text-xs text-pretty text-zinc-500">
            Saved as a draft. You can review it, then mark it as sent or share it with your
            customer.
          </p>
        </Card>
      </div>
    </form>
  );
}
