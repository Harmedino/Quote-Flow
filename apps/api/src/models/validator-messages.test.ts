import mongoose, { Types } from 'mongoose';
import { describe, expect, it } from 'vitest';
import { toClientError } from '../middleware/error-handler';
import { invoiceInput, paymentInput, quoteInput } from '../test/model-fixtures';
import { BusinessModel, CounterModel, CustomerModel, InvoiceModel, QuoteModel, UserModel } from '.';

const SECRET = 'olivia-secret-4512';

async function validationErrorOf(document: {
  validate(): Promise<void>;
}): Promise<mongoose.Error.ValidationError> {
  const error: unknown = await document.validate().then(
    () => undefined,
    (rejection: unknown) => rejection,
  );
  if (!(error instanceof mongoose.Error.ValidationError)) throw new Error('Expected a failure');
  return error;
}

describe('validator messages', () => {
  it.each([
    ['String enum', new QuoteModel(quoteInput({ status: SECRET })), 'status'],
    [
      'String maxlength',
      new QuoteModel(quoteInput({ quoteNumber: SECRET.repeat(5) })),
      'quoteNumber',
    ],
    ['String match', new InvoiceModel(invoiceInput({ publicToken: SECRET })), 'publicToken'],
    [
      'an embedded enum',
      new InvoiceModel(invoiceInput({ payments: [paymentInput({ method: SECRET })] })),
      'payments.0.method',
    ],
    [
      'a single nested enum',
      new QuoteModel(quoteInput({ discount: { type: SECRET, value: 1 } })),
      'discount.type',
    ],
    [
      'Number min',
      new CounterModel({ businessId: new Types.ObjectId(), key: 'quote', seq: -4512 }),
      'seq',
    ],
    [
      'Number max',
      new BusinessModel({ name: 'Evergreen', quoteValidityDays: 4512 }),
      'quoteValidityDays',
    ],
    ['a role enum', new UserModel({ businessId: new Types.ObjectId(), role: SECRET }), 'role'],
    [
      'a company maxlength',
      new CustomerModel({
        businessId: new Types.ObjectId(),
        name: 'x',
        company: SECRET.repeat(20),
      }),
      'company',
    ],
  ])('never echo the submitted value (%s)', async (_label, document, path) => {
    const error = await validationErrorOf(document);
    expect(error.errors).toHaveProperty([path]);

    const { details } = toClientError(error);
    expect(details?.map((detail) => detail.path)).toContain(path);
    const output = JSON.stringify(details);
    expect(output).not.toContain(SECRET);
    expect(output).not.toContain('4512');
  });

  it('uses readable messages with the schema limits filled in', async () => {
    const errors = (
      await validationErrorOf(
        new QuoteModel({
          ...quoteInput({ status: SECRET, quoteNumber: 'x'.repeat(41) }),
          expiryDate: undefined,
        }),
      )
    ).errors;

    expect(errors.status?.message).toBe('Is not an allowed value');
    expect(errors.quoteNumber?.message).toBe('Must be at most 40 characters');
    expect(errors.expiryDate?.message).toBe('This field is required');

    const counter = await validationErrorOf(
      new CounterModel({ businessId: new Types.ObjectId(), key: 'quote', seq: -1 }),
    );
    expect(counter.errors.seq?.message).toBe('Must be at least 0');
  });
});
