import { Types } from 'mongoose';
import { describe, expect, it } from 'vitest';
import { invoiceInput, paymentInput } from '../../test/model-fixtures';
import { ALL_MODELS } from '../index';
import { InvoiceModel } from '../invoice.model';

describe('serialization', () => {
  it('outputs a string id, no _id or __v, and ObjectIds as strings', async () => {
    const invoice = new InvoiceModel(invoiceInput({ payments: [paymentInput()] }));
    await invoice.validate();

    for (const output of [invoice.toJSON(), invoice.toObject()]) {
      expect(output).toMatchObject({
        id: invoice._id.toHexString(),
        businessId: invoice.businessId.toHexString(),
        customerId: invoice.customerId.toHexString(),
        createdBy: invoice.createdBy.toHexString(),
      });
      expect(output).not.toHaveProperty('_id');
      expect(output).not.toHaveProperty('__v');
    }
  });

  it('gives embedded payments a string id and no _id', () => {
    const recordedBy = new Types.ObjectId();
    const invoice = new InvoiceModel(invoiceInput({ payments: [paymentInput({ recordedBy })] }));
    const [payment] = invoice.toJSON().payments;

    expect(payment).toMatchObject({
      id: invoice.payments[0]?._id.toHexString(),
      recordedBy: recordedBy.toHexString(),
    });
    expect(payment).not.toHaveProperty('_id');
  });

  it('adds no id to embedded values without one', () => {
    const output = new InvoiceModel(invoiceInput()).toJSON();
    expect(output.items[0]).not.toHaveProperty('id');
    expect(output.customer).not.toHaveProperty('id');
  });

  it('is configured on every model', () => {
    for (const model of ALL_MODELS) {
      expect(model.schema.get('toJSON')).toMatchObject({ virtuals: true, versionKey: false });
      expect(model.schema.get('toObject')).toMatchObject({ virtuals: true, versionKey: false });
    }
  });
});
