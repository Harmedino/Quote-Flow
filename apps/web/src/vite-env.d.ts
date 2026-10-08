interface ImportMetaEnv {
  /** Base URL of the QuoteFlow API. Defaults to `/api` (proxied by Vite in development). */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
