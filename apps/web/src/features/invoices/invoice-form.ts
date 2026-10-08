import {
  type BusinessDto,
  type InvoiceDto,
  type InvoiceInput,
  addDaysToIsoDate,
  invoiceInputSchema,
} from '@quoteflow/shared';
import {
  type LineItemDraft,
  lineItemDraftErrors,
  lineItemDraftFromDto,
  newLineItemDraft,
  toLineItemInputs,
} from '@/features/documents/line-items';
import {
  type DiscountMode,
  type QuoteFormValues,
  formDiscount,
  parsePercent,
  placeFieldErrors,
  previewDiscount,
  previewTaxRate,
} from '@/features/quotes/quote-form';
import { type FormValidation, validateForm } from '@/lib/forms';

/** Everything the invoice editor holds; mapped to an InvoiceInput only when saving. */
export interface InvoiceFormValues {
  customerId: string;
  items: LineItemDraft[];
  discountMode: DiscountMode;
  discountPercent: string;
  /** Minor units. */
  discountAmount: number | null;
  taxRate: string;
  notes: string;
  terms: string;
  issueDate: string;
  dueDate: string;
}

export type InvoiceFormOutput = (typeof invoiceInputSchema)['_zod']['output'];

/**
 * The quote editor's discount and tax helpers (and its PricingFields) read only
 * the pricing fields, which invoices share; this view lets invoices reuse them.
 */
export function asPricingValues(values: InvoiceFormValues): QuoteFormValues {
  return { ...values, expiryDate: values.dueDate };
}

/** A blank invoice prefilled with the business defaults. */
export function newInvoiceFormValues(business: BusinessDto, today: string): InvoiceFormValues {
  return {
    customerId: '',
    items: [newLineItemDraft()],
    discountMode: 'none',
    discountPercent: '',
    discountAmount: null,
    taxRate: String(business.defaultTaxRate),
    notes: business.defaultInvoiceNotes ?? '',
    terms: business.defaultInvoiceTerms ?? '',
    issueDate: today,
    dueDate: addDaysToIsoDate(today, business.invoiceDueDays),
  };
}

export function invoiceFormValuesFromInvoice(invoice: InvoiceDto): InvoiceFormValues {
  const { discount } = invoice;
  return {
    customerId: invoice.customerId,
    items: invoice.items.map(lineItemDraftFromDto),
    discountMode: discount ? discount.type : 'none',
    discountPercent: discount?.type === 'percentage' ? String(discount.value) : '',
    discountAmount: discount?.type === 'fixed' ? discount.value : null,
    taxRate: String(invoice.taxRate),
    notes: invoice.notes ?? '',
    terms: invoice.terms ?? '',
    issueDate: invoice.issueDate,
    dueDate: invoice.dueDate,
  };
}

export function invoicePreviewPricing(values: InvoiceFormValues) {
  const pricing = asPricingValues(values);
  return { discount: previewDiscount(pricing), taxRate: previewTaxRate(pricing) };
}

export function toInvoiceInput(values: InvoiceFormValues): InvoiceInput {
  return {
    customerId: values.customerId,
    items: toLineItemInputs(values.items),
    discount: formDiscount(asPricingValues(values)),
    taxRate: parsePercent(values.taxRate),
    notes: values.notes,
    terms: values.terms,
    issueDate: values.issueDate,
    dueDate: values.dueDate,
  };
}

const NUMBER_HINT = 'Enter a percentage such as 7.5';

/** Validates with the API's schema; errors use the API paths, so server errors land in the same places. */
export function validateInvoiceForm(values: InvoiceFormValues): FormValidation<InvoiceFormOutput> {
  const result = validateForm(invoiceInputSchema, toInvoiceInput(values));
  if (result.success) return result;

  const fieldErrors = placeFieldErrors(result.fieldErrors);
  if (fieldErrors.customerId) fieldErrors.customerId = 'Choose a customer';
  if (!values.issueDate) fieldErrors.issueDate = 'Enter the issue date';
  if (!values.dueDate) fieldErrors.dueDate = 'Enter the due date';
  // The schema's date-order check only runs once every other field is valid.
  else if (values.issueDate && values.dueDate < values.issueDate) {
    fieldErrors.dueDate = 'The due date cannot be before the issue date';
  }
  if (Number.isNaN(parsePercent(values.taxRate))) fieldErrors.taxRate = NUMBER_HINT;
  if (values.discountMode === 'percentage' && Number.isNaN(parsePercent(values.discountPercent))) {
    fieldErrors['discount.value'] = NUMBER_HINT;
  }
  for (const [path, message] of Object.entries(lineItemDraftErrors(values.items))) {
    if (fieldErrors[path]) fieldErrors[path] = message;
  }
  return { success: false, fieldErrors };
}

/** Every path the editor can show an error next to, for mapping server errors. */
export function invoiceFormFieldPaths(values: InvoiceFormValues): string[] {
  const itemFields = ['serviceId', 'name', 'description', 'quantity', 'unit', 'unitPrice'];
  return [
    'customerId',
    'items',
    'discount',
    'discount.value',
    'taxRate',
    'notes',
    'terms',
    'issueDate',
    'dueDate',
    ...values.items.flatMap((_, index) => itemFields.map((field) => `items.${index}.${field}`)),
  ];
}

/** Comparable form content, ignoring React keys. */
export function invoiceFormSnapshot(values: InvoiceFormValues): string {
  return JSON.stringify({ ...values, items: values.items.map(({ key: _key, ...item }) => item) });
}
