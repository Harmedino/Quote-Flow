import { describe, expect, it } from 'vitest';
import { createCapturingLogger } from '../test/helpers';

describe('createLogger', () => {
  it('writes JSON lines with a string level and ISO timestamp', () => {
    const { logger, entries } = createCapturingLogger();
    logger.info({ quoteId: 'q1' }, 'Quote sent');

    expect(entries()).toEqual([
      expect.objectContaining({ level: 'info', msg: 'Quote sent', quoteId: 'q1' }),
    ]);
    expect(entries()[0]?.time).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('redacts credentials in request and response headers', () => {
    const { logger, entries } = createCapturingLogger();
    logger.info({
      req: { headers: { authorization: 'Bearer abc.def.ghi', cookie: 'rt=secret', host: 'api' } },
      res: { headers: { 'set-cookie': 'rt=rotated; HttpOnly' } },
    });

    const [entry] = entries();
    expect(entry?.req).toEqual({
      headers: { authorization: '[REDACTED]', cookie: '[REDACTED]', host: 'api' },
    });
    expect(entry?.res).toEqual({ headers: { 'set-cookie': '[REDACTED]' } });
  });

  it('redacts secret fields at the top level and up to two levels deep', () => {
    const { logger, entries } = createCapturingLogger();
    logger.info({
      password: 'pw0',
      user: { email: 'owner@example.com', passwordHash: 'hash1' },
      session: { tokens: { accessToken: 'at2', refreshToken: 'rt2' } },
      quote: { publicToken: 'pt1', number: 'QT-0001' },
      token: 'tok0',
    });

    const output = JSON.stringify(entries());
    for (const secret of ['pw0', 'hash1', 'at2', 'rt2', 'pt1', 'tok0']) {
      expect(output).not.toContain(secret);
    }
    expect(output).toContain('owner@example.com');
    expect(output).toContain('QT-0001');
  });
});
