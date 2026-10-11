import { afterEach, describe, expect, it, vi } from 'vitest';
import packageJson from '../package.json';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('schemas under a Content-Security-Policy without unsafe-eval', () => {
  it('never construct a Function, even to check whether they may', async () => {
    let constructed = 0;
    vi.stubGlobal(
      'Function',
      new Proxy(Function, {
        construct(target, args: string[]) {
          constructed += 1;
          return new target(...args);
        },
      }),
    );

    // Loaded only now, so the schemas are built while Function is being watched.
    const { customerInputSchema, quoteInputSchema } = await import('./index');
    customerInputSchema.safeParse({ name: 'Ada Lovelace', email: 'ada@example.com' });
    quoteInputSchema.safeParse({ customerId: 'not-an-id', lineItems: [] });

    expect(constructed).toBe(0);
  });

  it('keep the setting in bundles, which skip modules not declared to have side effects', () => {
    expect(packageJson.sideEffects).toEqual(['./src/zod.ts']);
  });
});
