import type { DashboardDto } from '@quoteflow/shared';
import { request } from '@/lib/api-client';

export function getDashboard(signal?: AbortSignal): Promise<DashboardDto> {
  return request('/dashboard', { signal });
}
