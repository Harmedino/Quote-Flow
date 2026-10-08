import { describe, expect, it } from 'vitest';
import { buildPaymentInput, initialPaymentValues } from './payment-form';

const context = { balanceDue: 50_000, currency: 'USD' as const, today: '2026-10-08' };

describe('payment form', () => {
  it('defaults to the full balance, today and a bank transfer', () => {
    expect(initialPaymentValues(50_000, '2026-10-08')).toEqual({
      amount: 50_000,
      method: 'bank_transfer',
      paidAt: '2026-10-08',
      reference: '',
      note: '',
    });
  });

  it('builds the API input, leaving out blank optional text', () => {
    const result = buildPaymentInput(
      { ...initialPaymentValues(50_000, '2026-10-08'), amount: 20_000, reference: ' TX-1 ' },
      context,
    );
    expect(result).toEqual({
      success: true,
      data: { amount: 20_000, method: 'bank_transfer', paidAt: '2026-10-08', reference: 'TX-1' },
    });
  });

  it('rejects an empty, zero or excessive amount', () => {
    const values = initialPaymentValues(50_000, '2026-10-08');
    expect(buildPaymentInput({ ...values, amount: null }, context)).toMatchObject({
      success: false,
      fieldErrors: { amount: 'Enter the amount received' },
    });
    expect(buildPaymentInput({ ...values, amount: 0 }, context)).toMatchObject({
      success: false,
      fieldErrors: { amount: 'Enter an amount greater than zero' },
    });
    expect(buildPaymentInput({ ...values, amount: 50_001 }, context)).toMatchObject({
      success: false,
      fieldErrors: { amount: 'The balance due is $500.00' },
    });
  });

  it('rejects a missing or future payment date', () => {
    const values = initialPaymentValues(50_000, '2026-10-08');
    expect(buildPaymentInput({ ...values, paidAt: '2026-10-09' }, context)).toMatchObject({
      success: false,
      fieldErrors: { paidAt: 'The payment date cannot be in the future' },
    });
    expect(buildPaymentInput({ ...values, paidAt: '' }, context)).toMatchObject({
      success: false,
      fieldErrors: { paidAt: 'Enter the payment date' },
    });
  });
});
