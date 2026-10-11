// Applies the theme before first paint so dark mode never flashes white. A same-origin file, not
// an inline script, so the Content-Security-Policy needs no 'unsafe-inline' for scripts.
// Mirrors src/lib/theme.ts: a saved choice wins, otherwise the system preference.
(function () {
  var theme = null;
  try {
    theme = localStorage.getItem('quoteflow_theme');
  } catch {
    // Storage unavailable (private mode, blocked site data): follow the system instead.
  }
  if (theme !== 'light' && theme !== 'dark') {
    theme =
      window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
  }
  document.documentElement.classList.toggle('dark', theme === 'dark');
  var toolbar = document.querySelector('meta[name="theme-color"]');
  if (toolbar) toolbar.setAttribute('content', theme === 'dark' ? '#111b2d' : '#fffdf9');
})();
