import { describe, expect, it } from 'vitest';
import { isHealthCheckUrl } from './paths';

describe('isHealthCheckUrl', () => {
  it.each(['/api/health', '/api/health/', '/api/health/live', '/api/health?probe=lb'])(
    'matches %s',
    (url) => {
      expect(isHealthCheckUrl(url)).toBe(true);
    },
  );

  it.each(['/api/healthz', '/api/health-report', '/health', '/api/quotes?next=/api/health'])(
    'does not match %s',
    (url) => {
      expect(isHealthCheckUrl(url)).toBe(false);
    },
  );
});
