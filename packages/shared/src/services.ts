import { z } from 'zod';
import { TEXT_LIMITS } from './constants/limits';
import { booleanQuerySchema } from './customers';
import { moneySchema, paginationQuerySchema } from './validation';

/**
 *   GET    /api/services          ServiceListQuery → 200 paginated ServiceDto[]
 *   POST   /api/services          ServiceInput     → 201 ServiceDto
 *   GET    /api/services/:id                       → 200 ServiceDto
 *   PATCH  /api/services/:id      UpdateServiceInput → 200 ServiceDto
 *   DELETE /api/services/:id                       → 204
 *
 * Deleting a service never changes existing quotes or invoices: their line
 * items keep the name and price used at the time.
 */

const optionalText = (max: number) =>
  z.string().trim().max(max, `Must be at most ${max} characters`).optional();

export const serviceInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Service name is required')
    .max(TEXT_LIMITS.itemName, 'Service name is too long'),
  description: optionalText(TEXT_LIMITS.itemDescription),
  /** Minor units. */
  price: moneySchema,
  unit: optionalText(TEXT_LIMITS.itemUnit),
  active: z.boolean().optional(),
});

export const updateServiceInputSchema = serviceInputSchema.partial();

export const serviceListQuerySchema = paginationQuerySchema.extend({
  search: z.string().trim().max(100).optional(),
  active: booleanQuerySchema.optional(),
});

export type ServiceInput = z.input<typeof serviceInputSchema>;
export type UpdateServiceInput = z.input<typeof updateServiceInputSchema>;
export type ServiceListQuery = z.input<typeof serviceListQuerySchema>;

export interface ServiceDto {
  id: string;
  name: string;
  description: string | null;
  price: number;
  unit: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}
