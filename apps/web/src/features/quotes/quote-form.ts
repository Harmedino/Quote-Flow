import {
  type BusinessDto,
  type DiscountInput,
  type QuoteDto,
  type QuoteInput,
  addDaysToIsoDate,
  quoteInputSchema,
} from '@quoteflow/shared';
import {
  type LineItemDraft,
  lineItemDraftErrors,
  lineItemDraftFromDto,
  newLineItemDraft,
  toLineItemInputs,
} from '@/features/documents/line-items';
import { type FieldErrors, type FormValidation, validateForm } from '@/lib/forms';

export type DiscountMode = 'none' | 'percentage' | 'fixed';

/** Everything the quote editor holds; mapped to a QuoteInput only when saving. */
export interface QuoteFormValues {
  customerId: string;
  items: LineItemDraft[];
  discountMode: DiscountMode;
  /** Text of the percentage field, e.g. "10". */
  discountPercent: string;
  /** Minor units. */
  discountAmount: number | null;
  /** Text of the tax rate field, e.g. "7.5". */
  taxRate: string;
  notes: string;
  terms: string;
  issueDate: string;
  expiryDate: string;
}

export type QuoteFormOutput = (typeof quoteInputSchema)['_zod']['output'];

/** A blank quote prefilled with the business defaults. */
export function newQuoteFormValues(
  business: BusinessDto,
  today: string,
  customerId = '',
): QuoteFormValues {
  return {
    customerId,
    items: [newLineItemDraft()],
    discountMode: 'none',
    discountPercent: '',
    discountAmount: null,
    taxRate: String(business.defaultTaxRate),
    notes: business.defaultQuoteNotes ?? '',
    terms: business.defaultQuoteTerms ?? '',
    issueDate: today,
    expiryDate: addDaysToIsoDate(today, business.quoteValidityDays),
  };
}

export function quoteFormValuesFromQuote(quote: QuoteDto): QuoteFormValues {
  const { discount } = quote;
  return {
    customerId: quote.customerId,
    items: quote.items.map(lineItemDraftFromDto),
    discountMode: discount ? discount.type : 'none',
    discountPercent: discount?.type === 'percentage' ? String(discount.value) : '',
    discountAmount: discount?.type === 'fixed' ? discount.value : null,
    taxRate: String(quote.taxRate),
    notes: quote.notes ?? '',
    terms: quote.terms ?? '',
    issueDate: quote.issueDate,
    expiryDate: quote.expiryDate,
  };
}

/** A typed percentage: '' is 0, anything that is not a number is NaN (reported by validation). */
export function parsePercent(text: string): number {
  const cleaned = text.trim().replace(/%$/, '').trim();
  if (cleaned === '') return 0;
  return /^\d*\.?\d+$|^\d+\.$/.test(cleaned) ? Number(cleaned) : Number.NaN;
}

export function formDiscount(values: QuoteFormValues): DiscountInput | null {
  if (values.discountMode === 'percentage') {
    return { type: 'percentage', value: parsePercent(values.discountPercent) };
  }
  if (values.discountMode === 'fixed') {
    return { type: 'fixed', value: values.discountAmount ?? 0 };
  }
  return null;
}

/** For live totals: an unusable discount counts as none until it is fixed. */
export function previewDiscount(values: QuoteFormValues): DiscountInput | null {
  const discount = formDiscount(values);
  if (!discount) return null;
  const valid = Number.isFinite(discount.value) && discount.value >= 0;
  return valid && (discount.type === 'fixed' || discount.value <= 100) ? discount : null;
}

export function previewTaxRate(values: QuoteFormValues): number {
  const rate = parsePercent(values.taxRate);
  return Number.isFinite(rate) && rate >= 0 && rate <= 100 ? rate : 0;
}

export function toQuoteInput(values: QuoteFormValues): QuoteInput {
  return {
    customerId: values.customerId,
    items: toLineItemInputs(values.items),
    discount: formDiscount(values),
    taxRate: parsePercent(values.taxRate),
    notes: values.notes,
    terms: values.terms,
    issueDate: values.issueDate,
    expiryDate: values.expiryDate,
  };
}

const NUMBER_HINT = 'Enter a percentage such as 7.5';

/**
 * Validates with the API's own schema; field errors use the API paths
 * (`items.0.quantity`, `discount.value`), so server errors land in the same places.
 */
export function validateQuoteForm(values: QuoteFormValues): FormValidation<QuoteFormOutput> {
  const result = validateForm(quoteInputSchema, toQuoteInput(values));
  if (result.success) return result;

  const fieldErrors = placeFieldErrors(result.fieldErrors);
  if (fieldErrors.customerId) fieldErrors.customerId = 'Choose a customer';
  if (Number.isNaN(parsePercent(values.taxRate))) fieldErrors.taxRate = NUMBER_HINT;
  if (values.discountMode === 'percentage' && Number.isNaN(parsePercent(values.discountPercent))) {
    fieldErrors['discount.value'] = NUMBER_HINT;
  }
  // The schema checks the date order only once every other field is valid; report it with the rest.
  if (values.issueDate && values.expiryDate && values.expiryDate < values.issueDate) {
    fieldErrors.expiryDate ??= 'The expiry date cannot be before the issue date';
  }
  for (const [path, message] of Object.entries(lineItemDraftErrors(values.items))) {
    if (fieldErrors[path]) fieldErrors[path] = message;
  }
  return { success: false, fieldErrors };
}

/** Every path the editor can show an error next to, for mapping server errors. */
export function quoteFormFieldPaths(values: QuoteFormValues): string[] {
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
    'expiryDate',
    ...values.items.flatMap((_, index) => itemFields.map((field) => `items.${index}.${field}`)),
  ];
}

/** Server errors on a row's service go next to its name, where the service was picked. */
export function placeFieldErrors(fieldErrors: FieldErrors): Record<string, string> {
  const placed: Record<string, string> = {};
  for (const [path, message] of Object.entries(fieldErrors)) {
    if (message === undefined) continue;
    const key = path
      .replace(/^(items\.\d+)\.serviceId$/, '$1.name')
      .replace(/^discount$/, 'discount.value');
    placed[key] ??= message;
  }
  return placed;
}

/** Comparable form content, ignoring React keys. */
export function quoteFormSnapshot(values: QuoteFormValues): string {
  return JSON.stringify({ ...values, items: values.items.map(({ key: _key, ...item }) => item) });
}
