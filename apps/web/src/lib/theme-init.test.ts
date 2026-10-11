import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { THEME_STORAGE_KEY, TOOLBAR_COLORS } from './theme';

// The classic script index.html runs before first paint. A variable, so TypeScript doesn't look
// for types of a plain browser script.
const THEME_INIT_SCRIPT = '../../public/theme-init.js';

let stored: string | null | Error;
let systemDark: boolean;
let darkClass: boolean | undefined;
let toolbarColor: string | undefined;
let hasToolbarMeta: boolean;

/** Runs public/theme-init.js afresh against the stubbed browser. */
async function runThemeInit(): Promise<void> {
  vi.resetModules();
  await import(/* @vite-ignore */ THEME_INIT_SCRIPT);
}

beforeEach(() => {
  stored = null;
  systemDark = false;
  darkClass = undefined;
  toolbarColor = undefined;
  hasToolbarMeta = true;
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => {
      if (stored instanceof Error) throw stored;
      return key === THEME_STORAGE_KEY ? stored : null;
    },
  });
  vi.stubGlobal('window', {
    matchMedia: (query: string) => ({
      matches: query === '(prefers-color-scheme: dark)' && systemDark,
    }),
  });
  vi.stubGlobal('document', {
    documentElement: {
      classList: {
        toggle: (name: string, force: boolean) => {
          if (name === 'dark') darkClass = force;
        },
      },
    },
    querySelector: (selector: string) =>
      selector === 'meta[name="theme-color"]' && hasToolbarMeta
        ? {
            setAttribute: (name: string, value: string) => {
              if (name === 'content') toolbarColor = value;
            },
          }
        : null,
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('public/theme-init.js', () => {
  it.each(['light', 'dark'] as const)(
    'applies a saved %s choice over the system',
    async (theme) => {
      stored = theme;
      systemDark = theme === 'light';

      await runThemeInit();

      expect(darkClass).toBe(theme === 'dark');
      expect(toolbarColor).toBe(TOOLBAR_COLORS[theme]);
    },
  );

  it.each([
    ['nothing is saved', null],
    ['the saved value is unknown', 'sepia'],
    ['storage is blocked', new Error('SecurityError')],
  ])('follows the system when %s', async (_case, value) => {
    stored = value;
    systemDark = true;

    await runThemeInit();

    expect(darkClass).toBe(true);
    expect(toolbarColor).toBe(TOOLBAR_COLORS.dark);

    systemDark = false;
    await runThemeInit();

    expect(darkClass).toBe(false);
    expect(toolbarColor).toBe(TOOLBAR_COLORS.light);
  });

  it('still sets the theme when the page has no theme-color tag', async () => {
    stored = 'dark';
    hasToolbarMeta = false;

    await runThemeInit();

    expect(darkClass).toBe(true);
  });
});
