import type { BusinessDto, InvoiceDto } from '@quoteflow/shared';
import { describe, expect, it } from 'vitest';
import { newLineItemDraft } from '@/features/documents/line-items';
import {
  invoiceFormSnapshot,
  invoiceFormValuesFromInvoice,
  newInvoiceFormValues,
  toInvoiceInput,
  validateInvoiceForm,
} from './invoice-form';

const business = {
  defaultTaxRate: 7.5,
  defaultInvoiceNotes: 'Pay by transfer.',
  defaultInvoiceTerms: null,
  invoiceDueDays: 14,
} as BusinessDto;

const CUSTOMER_ID = '665f1c2b9a1e4b0012345678';

describe('invoice form', () => {
  it('starts from the business defaults', () => {
    const values = newInvoiceFormValues(business, '2026-10-08');
    expect(values).toMatchObject({
      customerId: '',
      taxRate: '7.5',
      notes: 'Pay by transfer.',
      terms: '',
      issueDate: '2026-10-08',
      dueDate: '2026-10-22',
      discountMode: 'none',
    });
    expect(values.items).toHaveLength(1);
  });

  it('builds the API input with the discount and tax rate', () => {
    const values = {
      ...newInvoiceFormValues(business, '2026-10-08'),
      customerId: CUSTOMER_ID,
      items: [newLineItemDraft({ name: 'Deep clean', quantity: 2, unitPrice: 5_000 })],
      discountMode: 'percentage' as const,
      discountPercent: '10',
    };
    expect(toInvoiceInput(values)).toEqual({
      customerId: CUSTOMER_ID,
      items: [{ name: 'Deep clean', quantity: 2, unitPrice: 5_000 }],
      discount: { type: 'percentage', value: 10 },
      taxRate: 7.5,
      notes: 'Pay by transfer.',
      terms: '',
      issueDate: '2026-10-08',
      dueDate: '2026-10-22',
    });
    expect(validateInvoiceForm(values).success).toBe(true);
  });

  it('reports friendly errors at the API paths', () => {
    const values = {
      ...newInvoiceFormValues(business, '2026-10-08'),
      items: [newLineItemDraft({ name: 'Deep clean', unitPrice: null })],
      taxRate: 'abc',
      dueDate: '2026-10-01',
    };
    const result = validateInvoiceForm(values);
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.fieldErrors).toMatchObject({
      customerId: 'Choose a customer',
      'items.0.unitPrice': 'Enter a price',
      taxRate: 'Enter a percentage such as 7.5',
      dueDate: 'The due date cannot be before the issue date',
    });
  });

  it('loads an existing draft and round-trips it unchanged', () => {
    const invoice = {
      customerId: CUSTOMER_ID,
      items: [
        {
          serviceId: null,
          name: 'Window cleaning',
          description: null,
          quantity: 3,
          unit: 'window',
          unitPrice: 2_000,
          amount: 6_000,
        },
      ],
      discount: { type: 'fixed', value: 500 },
      taxRate: 0,
      notes: null,
      terms: 'Due in 7 days',
      issueDate: '2026-10-01',
      dueDate: '2026-10-08',
    } as InvoiceDto;
    const values = invoiceFormValuesFromInvoice(invoice);
    expect(toInvoiceInput(values)).toEqual({
      customerId: CUSTOMER_ID,
      items: [{ name: 'Window cleaning', quantity: 3, unit: 'window', unitPrice: 2_000 }],
      discount: { type: 'fixed', value: 500 },
      taxRate: 0,
      notes: '',
      terms: 'Due in 7 days',
      issueDate: '2026-10-01',
      dueDate: '2026-10-08',
    });
    expect(invoiceFormSnapshot(values)).toBe(
      invoiceFormSnapshot(invoiceFormValuesFromInvoice(invoice)),
    );
  });
});
