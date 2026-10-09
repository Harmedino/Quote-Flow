import type { BusinessDto, QuoteDto } from '@quoteflow/shared';
import { useEffect, useId, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { paths } from '@/app/paths';
import { Alert } from '@/components/ui/Alert';
import { Card } from '@/components/ui/Card';
import { DocumentTotalsSummary } from '@/features/documents/DocumentTotalsSummary';
import { LineItemsEditor } from '@/features/documents/LineItemsEditor';
import { type LineItemDraft, withoutBlankLineItems } from '@/features/documents/line-items';
import { useServicesQuery } from '@/features/services/use-services';
import { focusFirstInvalidField, getSubmitErrors } from '@/lib/forms';
import {
  type QuoteFormValues,
  placeFieldErrors,
  previewDiscount,
  previewTaxRate,
  quoteFormFieldPaths,
  quoteFormSnapshot,
  validateQuoteForm,
} from '../quote-form';
import type { QuoteFlash } from '../quote-flash';
import { useCreateQuote, useSendQuote, useUpdateQuote } from '../use-quotes';
import { CustomerPicker } from './CustomerPicker';
import { editorActions, type SaveIntent } from './editor-actions';
import { EditorSection } from './EditorSection';
import { MobileActionBar } from './MobileActionBar';
import { PricingFields } from './PricingFields';
import { QuoteSummaryPanel } from './QuoteSummaryPanel';
import { QuoteDatesFields, QuoteNotesFields } from './QuoteTermsFields';
import type { SelectedCustomer } from './selected-customer';
import { UnsavedChangesGuard } from './UnsavedChangesGuard';

export interface QuoteEditorProps {
  business: BusinessDto;
  initialValues: QuoteFormValues;
  initialCustomer: SelectedCustomer | null;
  /** The quote being edited; omit to create a new draft. */
  quote?: QuoteDto;
}

const SERVICES_QUERY = { active: true, pageSize: 100 };

/** Once sent, a quote keeps its customer (its link already went to them), as the API enforces. */
const SENT_CUSTOMER_HINT =
  'This quote has been sent, so its customer can’t change. Duplicate it to quote someone else.';

/** Which errors an edit makes stale, by form field. */
const ERROR_KEYS: Partial<Record<keyof QuoteFormValues, readonly string[]>> = {
  customerId: ['customerId'],
  discountMode: ['discount', 'discount.value'],
  discountPercent: ['discount', 'discount.value'],
  discountAmount: ['discount', 'discount.value'],
  taxRate: ['taxRate'],
  notes: ['notes'],
  terms: ['terms'],
  issueDate: ['issueDate', 'expiryDate'],
  expiryDate: ['expiryDate'],
};

function staleItemErrors(
  errors: Record<string, string>,
  previous: readonly LineItemDraft[],
  next: readonly LineItemDraft[],
): string[] {
  const itemKeys = Object.keys(errors).filter((key) => key.startsWith('items'));
  if (previous.length !== next.length) return itemKeys;
  return itemKeys.filter((key) => {
    const index = Number(/^items\.(\d+)\./.exec(key)?.[1]);
    return key === 'items' || previous[index] !== next[index];
  });
}

/** The quote builder shared by the new and edit pages. */
export function QuoteEditor({ business, initialValues, initialCustomer, quote }: QuoteEditorProps) {
  const formId = useId();
  const navigate = useNavigate();
  const [values, setValues] = useState(initialValues);
  const [customer, setCustomer] = useState(initialCustomer);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [pendingIntent, setPendingIntent] = useState<SaveIntent | null>(null);
  const [savedSnapshot] = useState(() => quoteFormSnapshot(initialValues));
  const leaving = useRef(false);

  const services = useServicesQuery(SERVICES_QUERY);
  const createQuote = useCreateQuote();
  const updateQuote = useUpdateQuote();
  const sendQuote = useSendQuote();

  const dirty = quoteFormSnapshot(values) !== savedSnapshot;
  const currency = quote?.currency ?? business.currency;
  const isDraft = !quote || quote.status === 'draft';
  const actions = editorActions(isDraft);
  const discount = previewDiscount(values);
  const taxRate = previewTaxRate(values);

  useEffect(() => {
    if (attempt > 0) focusFirstInvalidField(document.getElementById(formId));
  }, [attempt, formId]);

  function change(changes: Partial<QuoteFormValues>) {
    const stale = Object.keys(changes).flatMap(
      (field) => ERROR_KEYS[field as keyof QuoteFormValues] ?? [],
    );
    if (changes.items) stale.push(...staleItemErrors(errors, values.items, changes.items));
    if (stale.some((key) => key in errors)) {
      setErrors((current) => {
        const next = { ...current };
        for (const key of stale) delete next[key];
        return next;
      });
    }
    setValues((current) => ({ ...current, ...changes }));
  }

  function showErrors(fieldErrors: Record<string, string>, message: string | null) {
    setErrors(fieldErrors);
    setFormError(message);
    setAttempt((current) => current + 1);
  }

  function leaveTo(quoteId: string, flash: QuoteFlash) {
    leaving.current = true;
    void navigate(paths.quote(quoteId), { state: { flash } });
  }

  async function save(intent: SaveIntent) {
    if (pendingIntent) return;
    const submitted = { ...values, items: withoutBlankLineItems(values.items) };
    if (submitted.items.length !== values.items.length) setValues(submitted);

    const result = validateQuoteForm(submitted);
    if (!result.success) {
      showErrors(placeFieldErrors(result.fieldErrors), null);
      return;
    }

    setPendingIntent(intent);
    setFormError(null);
    let saved: QuoteDto;
    try {
      saved = quote
        ? await updateQuote.mutateAsync({ id: quote.id, input: result.data })
        : await createQuote.mutateAsync(result.data);
    } catch (error) {
      setPendingIntent(null);
      const submitErrors = getSubmitErrors(error, quoteFormFieldPaths(submitted));
      showErrors(placeFieldErrors(submitErrors.fieldErrors), submitErrors.formError);
      return;
    }

    if (intent !== 'send') {
      leaveTo(saved.id, quote ? 'updated' : 'created');
      return;
    }
    try {
      await sendQuote.mutateAsync(saved.id);
      leaveTo(saved.id, 'sent');
    } catch {
      // The quote is saved; the detail page offers sending again.
      leaveTo(saved.id, 'send-failed');
    }
  }

  const summaryProps = {
    items: values.items,
    discount,
    taxRate,
    currency,
    actions,
    pendingIntent,
    onAction: (intent: SaveIntent) => void save(intent),
  };

  return (
    <form
      id={formId}
      noValidate
      onSubmit={(event) => event.preventDefault()}
      className="pb-36 sm:pb-28 xl:pb-0"
    >
      <UnsavedChangesGuard dirty={dirty} shouldBlock={() => dirty && !leaving.current} />
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
              lockedHint={isDraft ? undefined : SENT_CUSTOMER_HINT}
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
            <PricingFields values={values} currency={currency} errors={errors} onChange={change} />
          </EditorSection>

          <Card className="p-5 sm:p-6 xl:hidden">
            <h2 className="mb-4 text-base font-semibold text-zinc-950">Summary</h2>
            <DocumentTotalsSummary
              items={values.items}
              discount={discount}
              taxRate={taxRate}
              currency={currency}
            />
          </Card>

          <EditorSection title="Dates and terms" headingId={`${formId}-details`}>
            <div className="space-y-5">
              <QuoteDatesFields values={values} errors={errors} onChange={change} />
              <QuoteNotesFields values={values} errors={errors} onChange={change} />
            </div>
          </EditorSection>
        </div>

        <QuoteSummaryPanel
          {...summaryProps}
          title={quote ? `Quote ${quote.quoteNumber}` : 'New quote'}
          customer={customer}
          className="sticky top-8 hidden xl:block"
        />
      </div>
      <MobileActionBar {...summaryProps} className="xl:hidden" />
    </form>
  );
}
