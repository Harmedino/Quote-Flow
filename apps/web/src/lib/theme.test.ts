import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { THEME_STORAGE_KEY, ThemeStore } from './theme';

type Handler = (event: { matches?: boolean; key?: string; newValue?: string | null }) => void;

let stored: Map<string, string>;
let systemDark: boolean;
let darkClass: boolean;
let mediaHandlers: Set<Handler>;
let windowHandlers: Set<Handler>;

function setSystemDark(dark: boolean) {
  systemDark = dark;
  for (const handler of mediaHandlers) handler({ matches: dark });
}

function storageEventFromAnotherTab(newValue: string | null) {
  for (const handler of windowHandlers) handler({ key: THEME_STORAGE_KEY, newValue });
}

beforeEach(() => {
  stored = new Map();
  systemDark = false;
  darkClass = false;
  mediaHandlers = new Set();
  windowHandlers = new Set();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => stored.get(key) ?? null,
    setItem: (key: string, value: string) => stored.set(key, value),
  });
  vi.stubGlobal('window', {
    matchMedia: () => ({
      get matches() {
        return systemDark;
      },
      addEventListener: (_type: string, handler: Handler) => mediaHandlers.add(handler),
      removeEventListener: (_type: string, handler: Handler) => mediaHandlers.delete(handler),
    }),
    addEventListener: (_type: string, handler: Handler) => windowHandlers.add(handler),
    removeEventListener: (_type: string, handler: Handler) => windowHandlers.delete(handler),
  });
  vi.stubGlobal('document', {
    documentElement: {
      classList: {
        toggle: (name: string, force: boolean) => {
          if (name === 'dark') darkClass = force;
        },
      },
    },
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('ThemeStore', () => {
  it('follows the system preference until a theme is chosen', () => {
    systemDark = true;
    const store = new ThemeStore();
    store.subscribe(() => {});

    expect(store.getSnapshot()).toBe('dark');
    expect(darkClass).toBe(true);

    setSystemDark(false);
    expect(store.getSnapshot()).toBe('light');
    expect(darkClass).toBe(false);
  });

  it('prefers a saved choice over the system and ignores unknown values', () => {
    stored.set(THEME_STORAGE_KEY, 'dark');
    expect(new ThemeStore().getSnapshot()).toBe('dark');

    stored.set(THEME_STORAGE_KEY, 'sepia');
    expect(new ThemeStore().getSnapshot()).toBe('light');
  });

  it('saves a toggle, applies it and keeps every subscriber in sync', () => {
    const store = new ThemeStore();
    const sidebar = vi.fn();
    const topBar = vi.fn();
    store.subscribe(sidebar);
    store.subscribe(topBar);

    store.toggle();

    expect(store.getSnapshot()).toBe('dark');
    expect(stored.get(THEME_STORAGE_KEY)).toBe('dark');
    expect(darkClass).toBe(true);
    expect(sidebar).toHaveBeenCalledTimes(1);
    expect(topBar).toHaveBeenCalledTimes(1);

    // Once chosen, a system change no longer overrides it.
    setSystemDark(false);
    expect(store.getSnapshot()).toBe('dark');
  });

  it('picks up a choice made in another tab, and the system again when it is cleared', () => {
    systemDark = true;
    const store = new ThemeStore();
    const listener = vi.fn();
    store.subscribe(listener);

    storageEventFromAnotherTab('light');
    expect(store.getSnapshot()).toBe('light');
    expect(darkClass).toBe(false);

    storageEventFromAnotherTab(null);
    expect(store.getSnapshot()).toBe('dark');
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('still works when storage is unavailable', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('SecurityError');
      },
      setItem: () => {
        throw new Error('QuotaExceededError');
      },
    });
    const store = new ThemeStore();

    expect(store.getSnapshot()).toBe('light');
    store.toggle();
    expect(store.getSnapshot()).toBe('dark');
    expect(darkClass).toBe(true);
  });

  it('stops listening once the last subscriber leaves', () => {
    const store = new ThemeStore();
    const unsubscribe = store.subscribe(() => {});
    expect(mediaHandlers.size).toBe(1);
    expect(windowHandlers.size).toBe(1);

    unsubscribe();
    expect(mediaHandlers.size).toBe(0);
    expect(windowHandlers.size).toBe(0);
  });
});
