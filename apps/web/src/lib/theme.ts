import { useSyncExternalStore } from 'react';

export type Theme = 'light' | 'dark';

/** Also read by public/theme-init.js, which applies the theme before first paint. */
export const THEME_STORAGE_KEY = 'quoteflow_theme';

const DARK_QUERY = '(prefers-color-scheme: dark)';

type Listener = () => void;

function isTheme(value: unknown): value is Theme {
  return value === 'light' || value === 'dark';
}

function readStoredTheme(): Theme | null {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return isTheme(stored) ? stored : null;
  } catch {
    // Storage unavailable (private mode, blocked site data): follow the system instead.
    return null;
  }
}

function systemTheme(): Theme {
  return window.matchMedia?.(DARK_QUERY).matches ? 'dark' : 'light';
}

/** The phone browser's toolbar in each theme: the top bar's colour. Also in public/theme-init.js. */
export const TOOLBAR_COLORS: Record<Theme, string> = { light: '#fffdf9', dark: '#111b2d' };
/** A page's own toolbar colour while it is on screen, in place of the theme's. */
let pageToolbarColor: string | null = null;

function applyToDocument(theme: Theme): void {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', pageToolbarColor ?? TOOLBAR_COLORS[theme]);
}

/**
 * Light or dark mode, shared by every toggle on the page. A choice made with a toggle is saved
 * and reaches other open tabs; until one is made, the system preference decides and is
 * followed live.
 */
export class ThemeStore {
  #theme: Theme | null = null;
  /** Whether the theme was chosen with a toggle rather than taken from the system. */
  #chosen = false;
  #stopWatching: (() => void) | null = null;
  readonly #listeners = new Set<Listener>();

  readonly getSnapshot = (): Theme => {
    if (this.#theme === null) {
      const stored = readStoredTheme();
      this.#chosen = stored !== null;
      this.#theme = stored ?? systemTheme();
    }
    return this.#theme;
  };

  readonly subscribe = (listener: Listener): (() => void) => {
    if (this.#listeners.size === 0) {
      this.#watch();
    }
    this.#listeners.add(listener);
    return () => {
      this.#listeners.delete(listener);
      if (this.#listeners.size === 0) {
        this.#stopWatching?.();
      }
    };
  };

  setTheme(theme: Theme): void {
    this.#chosen = true;
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Ignore: the theme still applies for this visit.
    }
    this.#publish(theme);
  }

  toggle(): void {
    this.setTheme(this.getSnapshot() === 'dark' ? 'light' : 'dark');
  }

  #watch(): void {
    // Normally public/theme-init.js has already done this.
    applyToDocument(this.getSnapshot());

    const media = window.matchMedia?.(DARK_QUERY);
    const onSystemChange = () => {
      if (!this.#chosen) this.#publish(systemTheme());
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key !== THEME_STORAGE_KEY) return;
      this.#chosen = isTheme(event.newValue);
      this.#publish(isTheme(event.newValue) ? event.newValue : systemTheme());
    };
    media?.addEventListener('change', onSystemChange);
    window.addEventListener('storage', onStorage);
    this.#stopWatching = () => {
      media?.removeEventListener('change', onSystemChange);
      window.removeEventListener('storage', onStorage);
      this.#stopWatching = null;
    };
  }

  #publish(theme: Theme): void {
    applyToDocument(theme);
    if (theme === this.#theme) return;
    this.#theme = theme;
    for (const listener of [...this.#listeners]) {
      listener();
    }
  }
}

export const themeStore = new ThemeStore();

/**
 * Colours the phone browser's toolbar for the page on screen, e.g. a customer's page (always
 * light) in its band's colour; null hands it back to the theme.
 */
export function setPageToolbarColor(color: string | null): void {
  pageToolbarColor = color;
  applyToDocument(themeStore.getSnapshot());
}

const toggleTheme = () => themeStore.toggle();
const serverSnapshot = (): Theme => 'light';

export function useTheme(): { theme: Theme; toggleTheme: () => void } {
  const theme = useSyncExternalStore(themeStore.subscribe, themeStore.getSnapshot, serverSnapshot);
  return { theme, toggleTheme };
}
