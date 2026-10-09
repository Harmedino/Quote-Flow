import type {
  CustomerDto,
  PaginationMeta,
  customerInputSchema,
  customerListQuerySchema,
  updateCustomerInputSchema,
} from '@quoteflow/shared';
import type { QueryFilter } from 'mongoose';
import type { z } from 'zod';
import { type Customer, type CustomerDocument, CustomerModel } from '../models';
import { toCustomerDto } from '../serializers/customer.serializer';
import { notFound } from '../utils/app-error';
import { skipFor, toPaginationMeta } from '../utils/pagination';
import { containsPattern, phoneDigitsPattern } from '../utils/search-pattern';
import type { AuthContext } from './access-token.service';
import { toFieldChanges, withoutBlankFields } from './field-changes';

export type CreateCustomerData = z.output<typeof customerInputSchema>;
export type UpdateCustomerData = z.output<typeof updateCustomerInputSchema>;
export type CustomerListData = z.output<typeof customerListQuerySchema>;

const CUSTOMER_NOT_FOUND = 'Customer not found.';

/** A customer of the caller's business; anything else (including another tenant's) is a 404. */
export async function findOwnCustomer(auth: AuthContext, id: string): Promise<CustomerDocument> {
  const customer = await CustomerModel.findOne({ _id: id, businessId: auth.businessId });
  if (!customer) throw notFound(CUSTOMER_NOT_FOUND);
  return customer;
}

function searchConditions(search: string): QueryFilter<Customer>[] {
  const pattern = containsPattern(search);
  const conditions: QueryFilter<Customer>[] = [
    { name: pattern },
    { email: pattern },
    { phone: pattern },
    { company: pattern },
  ];
  const phonePattern = phoneDigitsPattern(search);
  if (phonePattern) conditions.push({ phone: phonePattern });
  return conditions;
}

/** Newest first. Archived customers are included only when `archived` is true. */
export async function listCustomers(
  auth: AuthContext,
  query: CustomerListData,
): Promise<{ data: CustomerDto[]; meta: PaginationMeta }> {
  const filter: QueryFilter<Customer> = { businessId: auth.businessId };
  if (!query.archived) filter.archivedAt = null;
  if (query.search) filter.$or = searchConditions(query.search);

  const [customers, total] = await Promise.all([
    CustomerModel.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip(skipFor(query))
      .limit(query.pageSize),
    CustomerModel.countDocuments(filter),
  ]);
  return { data: customers.map(toCustomerDto), meta: toPaginationMeta(query, total) };
}

export async function getCustomer(auth: AuthContext, id: string): Promise<CustomerDto> {
  return toCustomerDto(await findOwnCustomer(auth, id));
}

/** Blank optional fields ('') are not stored. */
export async function createCustomer(
  auth: AuthContext,
  input: CreateCustomerData,
): Promise<CustomerDto> {
  const { address, ...fields } = input;
  const cleanAddress = address && withoutBlankFields(address);
  const customer = await CustomerModel.create({
    ...withoutBlankFields(fields),
    ...(cleanAddress && Object.keys(cleanAddress).length > 0 && { address: cleanAddress }),
    businessId: auth.businessId,
  });
  return toCustomerDto(customer);
}

/**
 * PATCH semantics: omitted fields are left alone and '' clears an optional
 * field, part by part for the address. Loads and saves the document so every
 * model validator runs.
 */
export async function updateCustomer(
  auth: AuthContext,
  id: string,
  input: UpdateCustomerData,
): Promise<CustomerDto> {
  const customer = await findOwnCustomer(auth, id);
  for (const [path, value] of toFieldChanges(input)) customer.set(path, value);
  await customer.save();
  return toCustomerDto(customer);
}

/** Idempotent: archiving an archived customer keeps the original archive date. */
export async function archiveCustomer(auth: AuthContext, id: string): Promise<CustomerDto> {
  const customer = await findOwnCustomer(auth, id);
  if (!customer.archivedAt) {
    customer.archivedAt = new Date();
    await customer.save();
  }
  return toCustomerDto(customer);
}

export async function restoreCustomer(auth: AuthContext, id: string): Promise<CustomerDto> {
  const customer = await findOwnCustomer(auth, id);
  if (customer.archivedAt) {
    customer.archivedAt = null;
    await customer.save();
  }
  return toCustomerDto(customer);
}
