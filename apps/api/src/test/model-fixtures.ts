import { DEFAULT_CURRENCY } from '@quoteflow/shared';
import mongoose, { Types } from 'mongoose';
import { generatePublicToken } from '../utils/tokens';

/** Validates a document and returns its errors as `{ path: message }` (empty when valid). */
export async function validationErrorsOf(document: {
  validate(): Promise<void>;
}): Promise<Record<string, string>> {
  try {
    await document.validate();
    return {};
  } catch (error) {
    if (!(error instanceof mongoose.Error.ValidationError)) throw error;
    return Object.fromEntries(
      Object.entries(error.errors).map(([path, fieldError]) => [path, fieldError.message]),
    );
  }
}

const ISSUE_DATE = new Date('2026-03-02T09:00:00.000Z');
const DAY_MS = 24 * 60 * 60 * 1000;

function salesDocumentInput() {
  return {
    businessId: new Types.ObjectId(),
    customerId: new Types.ObjectId(),
    customer: { name: 'Olivia Harper', email: 'olivia.harper@example.com' },
    currency: DEFAULT_CURRENCY,
    items: [{ name: 'Deep cleaning', quantity: 2.5, unit: 'hour', unitPrice: 5_500 }],
    issueDate: ISSUE_DATE,
    publicToken: generatePublicToken(),
    createdBy: new Types.ObjectId(),
  };
}

export function quoteInput(overrides: Record<string, unknown> = {}) {
  return {
    ...salesDocumentInput(),
    quoteNumber: 'QT-0001',
    expiryDate: new Date(ISSUE_DATE.getTime() + 14 * DAY_MS),
    ...overrides,
  };
}

export function invoiceInput(overrides: Record<string, unknown> = {}) {
  return {
    ...salesDocumentInput(),
    invoiceNumber: 'INV-0001',
    dueDate: new Date(ISSUE_DATE.getTime() + 14 * DAY_MS),
    ...overrides,
  };
}

export function paymentInput(overrides: Record<string, unknown> = {}) {
  return {
    amount: 5_000,
    method: 'bank_transfer',
    paidAt: new Date(ISSUE_DATE.getTime() + 2 * DAY_MS),
    recordedBy: new Types.ObjectId(),
    ...overrides,
  };
}
