import { emailSchema, personNameSchema, phoneSchema } from '@quoteflow/shared';
import { Schema } from 'mongoose';
import { TEXT_LIMITS } from '../limits';
import { validateWith } from '../validators';
import { type Address, addressSubschema } from './address';

/** The billing details of a customer. */
export interface CustomerContact {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  address?: Address;
}

/** Field definitions shared by the Customer model and the snapshot stored on documents. */
export const customerContactFields = {
  name: { type: String, required: true, trim: true, validate: validateWith(personNameSchema) },
  email: { type: String, trim: true, lowercase: true, validate: validateWith(emailSchema) },
  phone: { type: String, trim: true, validate: validateWith(phoneSchema) },
  company: { type: String, trim: true, maxlength: TEXT_LIMITS.companyName },
  address: { type: addressSubschema },
};

/**
 * The billed-to details frozen on a quote or invoice when it is created, so
 * editing or archiving the customer never changes documents already issued.
 */
export type CustomerSnapshot = CustomerContact;

export const customerSnapshotSubschema = new Schema<CustomerSnapshot>(customerContactFields, {
  _id: false,
  id: false,
});

export function toCustomerSnapshot(customer: CustomerContact): CustomerSnapshot {
  const { name, email, phone, company, address } = customer;
  return { name, email, phone, company, address };
}
