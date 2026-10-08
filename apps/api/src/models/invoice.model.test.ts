import { describe, expect, it } from 'vitest';
import { invoiceInput, paymentInput, validationErrorsOf } from '../test/model-fixtures';
import { InvoiceModel } from './invoice.model';

/** 2.5 h × $55.00 = $137.50, no discount or tax. */
const TOTAL = 13_750;

describe('InvoiceModel', () => {
  it('accepts a complete invoice and applies defaults', async () => {
    const invoice = new InvoiceModel(invoiceInput());
    expect(await validationErrorsOf(invoice)).toEqual({});
    expect(invoice).toMatchObject({
      status: 'draft',
      quoteId: null,
      amountPaid: 0,
      balanceDue: TOTAL,
    });
    expect(invoice.payments).toHaveLength(0);
  });

  it('derives amountPaid and balanceDue from payments, ignoring supplied values', async () => {
    const invoice = new InvoiceModel(
      invoiceInput({
        payments: [paymentInput({ amount: 3_000 }), paymentInput({ amount: 2_000 })],
        amountPaid: 1,
        balanceDue: 99_999,
      }),
    );
    expect(await validationErrorsOf(invoice)).toEqual({});
    expect(invoice).toMatchObject({ amountPaid: 5_000, balanceDue: TOTAL - 5_000 });
  });

  it('recalculates the balance when a payment is added', async () => {
    const invoice = new InvoiceModel(invoiceInput());
    await invoice.validate();

    invoice.payments.push(paymentInput({ amount: TOTAL }));
    invoice.status = 'paid';
    expect(await validationErrorsOf(invoice)).toEqual({});
    expect(invoice).toMatchObject({ amountPaid: TOTAL, balanceDue: 0 });
  });

  it('rejects payments that exceed the total', async () => {
    const invoice = new InvoiceModel(
      invoiceInput({ payments: [paymentInput({ amount: TOTAL + 1 })] }),
    );
    expect(await validationErrorsOf(invoice)).toMatchObject({
      payments: 'Payments cannot exceed the invoice total',
    });
  });

  it.each([
    ['a zero amount', { amount: 0 }, 'payments.0.amount'],
    ['a fractional amount', { amount: 10.5 }, 'payments.0.amount'],
    ['an unknown method', { method: 'bitcoin' }, 'payments.0.method'],
    ['no payment date', { paidAt: undefined }, 'payments.0.paidAt'],
    ['no recorder', { recordedBy: undefined }, 'payments.0.recordedBy'],
  ])('rejects a payment with %s', async (_label, overrides, path) => {
    const invoice = new InvoiceModel(invoiceInput({ payments: [paymentInput(overrides)] }));
    expect(await validationErrorsOf(invoice)).toHaveProperty([path]);
  });

  it('only allows the paid status when nothing is due', async () => {
    const unpaid = new InvoiceModel(invoiceInput({ status: 'paid' }));
    expect(await validationErrorsOf(unpaid)).toHaveProperty('status');

    const settled = new InvoiceModel(
      invoiceInput({ status: 'paid', payments: [paymentInput({ amount: TOTAL })] }),
    );
    expect(await validationErrorsOf(settled)).toEqual({});
  });

  it('only allows partially_paid with a payment and a remaining balance', async () => {
    const withoutPayment = new InvoiceModel(invoiceInput({ status: 'partially_paid' }));
    expect(await validationErrorsOf(withoutPayment)).toHaveProperty('status');

    const settled = new InvoiceModel(
      invoiceInput({ status: 'partially_paid', payments: [paymentInput({ amount: TOTAL })] }),
    );
    expect(await validationErrorsOf(settled)).toHaveProperty('status');

    const partial = new InvoiceModel(
      invoiceInput({ status: 'partially_paid', payments: [paymentInput({ amount: 100 })] }),
    );
    expect(await validationErrorsOf(partial)).toEqual({});
  });

  it('rejects a due date before the issue date', async () => {
    const invoice = new InvoiceModel(
      invoiceInput({
        issueDate: new Date('2026-03-02T09:00:00Z'),
        dueDate: new Date('2026-03-01T09:00:00Z'),
      }),
    );
    expect(await validationErrorsOf(invoice)).toMatchObject({
      dueDate: 'The due date cannot be before the issue date',
    });
  });

  it('rejects an unknown status', async () => {
    const invoice = new InvoiceModel(invoiceInput({ status: 'void' }));
    expect(await validationErrorsOf(invoice)).toHaveProperty('status');
  });

  it('declares a partial unique index so a quote converts at most once', () => {
    expect(InvoiceModel.schema.indexes()).toEqual(
      expect.arrayContaining([
        [
          { quoteId: 1 },
          expect.objectContaining({
            unique: true,
            partialFilterExpression: { quoteId: { $type: 'objectId' } },
          }),
        ],
        [{ businessId: 1, invoiceNumber: 1 }, expect.objectContaining({ unique: true })],
        [{ publicToken: 1 }, expect.objectContaining({ unique: true })],
        [{ businessId: 1, status: 1, dueDate: 1 }, expect.anything()],
        [{ businessId: 1, customerId: 1, createdAt: -1 }, expect.anything()],
        [{ businessId: 1, createdAt: -1 }, expect.anything()],
      ]),
    );
  });
});
