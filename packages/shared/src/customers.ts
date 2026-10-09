import { z } from 'zod';
import { TEXT_LIMITS } from './constants/limits';
import {
  type AddressInput,
  addressSchema,
  emailSchema,
  paginationQuerySchema,
  personNameSchema,
  phoneSchema,
} from './validation';

/**
 *   GET   /api/customers               CustomerListQuery → 200 paginated CustomerDto[]
 *   POST  /api/customers               CustomerInput     → 201 CustomerDto
 *   GET   /api/customers/:id                             → 200 CustomerDto
 *   PATCH /api/customers/:id           UpdateCustomerInput → 200 CustomerDto
 *   POST  /api/customers/:id/archive                     → 200 CustomerDto
 *   POST  /api/customers/:id/restore                     → 200 CustomerDto
 *
 * Customers are archived rather than deleted because issued documents
 * reference them. Lists hide archived customers unless `archived=true`.
 */

const optionalText = (max: number) =>
  z.string().trim().max(max, `Must be at most ${max} characters`).optional();

export const booleanQuerySchema = z.enum(['true', 'false']).transform((value) => value === 'true');

export const customerInputSchema = z.object({
  name: personNameSchema,
  email: z.union([z.literal(''), emailSchema]).optional(),
  phone: z.union([z.literal(''), phoneSchema]).optional(),
  company: optionalText(TEXT_LIMITS.companyName),
  address: addressSchema.optional(),
  notes: optionalText(TEXT_LIMITS.notes),
});

export const updateCustomerInputSchema = customerInputSchema.partial();

export const customerListQuerySchema = paginationQuerySchema.extend({
  search: z.string().trim().max(100).optional(),
  archived: booleanQuerySchema.optional(),
});

export type CustomerInput = z.input<typeof customerInputSchema>;
export type UpdateCustomerInput = z.input<typeof updateCustomerInputSchema>;
export type CustomerListQuery = z.input<typeof customerListQuerySchema>;

export interface CustomerDto {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  address: AddressInput;
  notes: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
