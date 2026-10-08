import type { LineItemInput } from '@quoteflow/shared';
import { Types } from 'mongoose';
import {
  type BusinessDocument,
  BusinessModel,
  type CustomerDocument,
  CustomerModel,
  type LineItem,
  ServiceModel,
} from '../models';
import { sessionExpired, validationFailed } from '../utils/app-error';
import type { AuthContext } from './access-token.service';

/** Building blocks for creating and editing invoice content from validated input. */

export async function findOwnBusiness(auth: AuthContext): Promise<BusinessDocument> {
  const business = await BusinessModel.findById(auth.businessId);
  if (!business) throw sessionExpired();
  return business;
}

/**
 * The customer to bill. It must belong to the business and, unless it is the
 * customer the document already has, must not be archived.
 */
export async function findBillableCustomer(
  businessId: Types.ObjectId,
  customerId: string,
  currentCustomerId?: Types.ObjectId,
): Promise<CustomerDocument> {
  const customer = await CustomerModel.findOne({ _id: customerId, businessId });
  if (!customer) {
    throw validationFailed([{ path: 'customerId', message: 'Choose one of your customers' }]);
  }
  const unchanged = currentCustomerId?.equals(customer._id) ?? false;
  if (customer.archivedAt && !unchanged) {
    throw validationFailed([
      { path: 'customerId', message: 'This customer is archived. Restore it or choose another.' },
    ]);
  }
  return customer;
}

/** Rejects line items that reference a service of another business or one that no longer exists. */
export async function assertServicesBelong(
  businessId: Types.ObjectId,
  items: readonly LineItemInput[],
): Promise<void> {
  const ids = [...new Set(items.flatMap((item) => (item.serviceId ? [item.serviceId] : [])))];
  if (ids.length === 0) return;

  const found = await ServiceModel.find({ businessId, _id: { $in: ids } }, { _id: 1 }).lean();
  const known = new Set(found.map((service) => service._id.toString()));
  const details = items.flatMap((item, index) =>
    item.serviceId && !known.has(item.serviceId.toLowerCase())
      ? [{ path: `items.${index}.serviceId`, message: 'This service no longer exists' }]
      : [],
  );
  if (details.length > 0) throw validationFailed(details);
}

export type LineItemContent = Omit<LineItem, 'amount'>;

/** Amounts are derived by the model, so they are never taken from input. */
export function toLineItemContent(items: readonly LineItemInput[]): LineItemContent[] {
  return items.map((item) => ({
    serviceId: item.serviceId ? new Types.ObjectId(item.serviceId) : undefined,
    name: item.name,
    description: blankToUndefined(item.description),
    quantity: item.quantity,
    unit: blankToUndefined(item.unit),
    unitPrice: item.unitPrice,
  }));
}

export function blankToUndefined(value: string | null | undefined): string | undefined {
  return value ? value : undefined;
}

/** Omitted text takes the fallback; '' means "none" and is not replaced by it. */
export function textOrFallback(
  value: string | undefined,
  fallback: string | null | undefined,
): string | undefined {
  return value === undefined ? blankToUndefined(fallback) : blankToUndefined(value);
}
