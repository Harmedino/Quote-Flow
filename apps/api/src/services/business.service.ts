import type { BusinessDto, updateBusinessInputSchema } from '@quoteflow/shared';
import type { z } from 'zod';
import { type BusinessDocument, BusinessModel } from '../models';
import { toBusinessDto } from '../serializers/business.serializer';
import { sessionExpired } from '../utils/app-error';
import type { AuthContext } from './access-token.service';

export type UpdateBusinessData = z.output<typeof updateBusinessInputSchema>;

/** A field to change: its dotted path and new value, where `undefined` removes it. */
export type BusinessChange = readonly [path: string, value: unknown];

async function findOwnBusiness(auth: AuthContext): Promise<BusinessDocument> {
  const business = await BusinessModel.findById(auth.businessId);
  if (!business) throw sessionExpired();
  return business;
}

/**
 * PATCH semantics: omitted fields are left alone and '' clears an optional
 * field. The same applies to each part of the address, so a partial address
 * keeps the parts it does not mention.
 */
export function toBusinessChanges(input: UpdateBusinessData): BusinessChange[] {
  const { address, ...fields } = input;
  const changes: [string, unknown][] = [
    ...Object.entries(fields),
    ...Object.entries(address ?? {}).map(([part, value]): [string, unknown] => [
      `address.${part}`,
      value,
    ]),
  ];
  return changes
    .filter(([, value]) => value !== undefined)
    .map(([path, value]) => [path, value === '' ? undefined : value]);
}

export async function getBusiness(auth: AuthContext): Promise<BusinessDto> {
  return toBusinessDto(await findOwnBusiness(auth));
}

/** Loads, changes and saves the business, so every model validator runs. */
export async function updateBusiness(
  auth: AuthContext,
  input: UpdateBusinessData,
): Promise<BusinessDto> {
  const business = await findOwnBusiness(auth);
  for (const [path, value] of toBusinessChanges(input)) business.set(path, value);
  await business.save();
  return toBusinessDto(business);
}
