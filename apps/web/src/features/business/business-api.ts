import type { BusinessDto, UpdateBusinessInput } from '@quoteflow/shared';
import { request } from '@/lib/api-client';

export function getBusiness(): Promise<BusinessDto> {
  return request('/business');
}

/** Owners only. Omitted fields are unchanged; '' clears an optional text field. */
export function updateBusiness(input: UpdateBusinessInput): Promise<BusinessDto> {
  return request('/business', { method: 'PATCH', body: input });
}
