import { afterEach, describe, expect, it, vi } from 'vitest';
import { createCapturingLogger } from '../test/helpers';
import { deprecatedEnv } from './deprecated';

// The helper remembers what it reported for the life of the process, so each test uses its own
// variable names.
describe('deprecatedEnv', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('does nothing while the variable is unset or blank', () => {
    const { logger, entries } = createCapturingLogger();

    expect(deprecatedEnv('OLD_UNSET', 'OLD_UNSET is no longer used.', { logger, source: {} })).toBe(
      false,
    );
    expect(
      deprecatedEnv('OLD_BLANK', 'OLD_BLANK is no longer used.', {
        logger,
        source: { OLD_BLANK: '  ' },
      }),
    ).toBe(false);
    expect(entries()).toEqual([]);
  });

  it('warns once per process while the variable is set, and never logs its value', () => {
    const { logger, entries } = createCapturingLogger();
    const source = { OLD_ONCE: 'secret-looking-value' };

    for (let start = 0; start < 3; start += 1) {
      expect(
        deprecatedEnv('OLD_ONCE', 'OLD_ONCE is no longer used and is ignored.', {
          logger,
          source,
        }),
      ).toBe(true);
    }

    expect(entries()).toEqual([
      expect.objectContaining({
        level: 'warn',
        variable: 'OLD_ONCE',
        msg: 'OLD_ONCE is no longer used and is ignored.',
      }),
    ]);
    expect(JSON.stringify(entries())).not.toContain('secret-looking-value');
  });

  it('reports each retired variable on its own', () => {
    const { logger, entries } = createCapturingLogger();
    const source = { OLD_FIRST: 'true', OLD_SECOND: 'true' };

    deprecatedEnv('OLD_FIRST', 'OLD_FIRST is no longer used.', { logger, source });
    deprecatedEnv('OLD_SECOND', 'OLD_SECOND is no longer used.', { logger, source });

    expect(entries().map((entry) => entry.variable)).toEqual(['OLD_FIRST', 'OLD_SECOND']);
  });

  it('reads process.env by default', () => {
    const { logger, entries } = createCapturingLogger();
    vi.stubEnv('OLD_FROM_PROCESS', 'true');

    expect(
      deprecatedEnv('OLD_FROM_PROCESS', 'OLD_FROM_PROCESS is no longer used.', { logger }),
    ).toBe(true);
    expect(entries()).toHaveLength(1);
  });
});
