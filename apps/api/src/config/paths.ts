export const API_PREFIX = '/api';
export const HEALTH_PATH = `${API_PREFIX}/health`;

/** Whether a request targets the health endpoints. Expects Express's `originalUrl`. */
export function isHealthCheckUrl(originalUrl: string): boolean {
  const path = originalUrl.split('?', 1)[0];
  return path === HEALTH_PATH || (path?.startsWith(`${HEALTH_PATH}/`) ?? false);
}
