/** A one-time message passed in navigation state to the quote detail page after a save. */
export type QuoteFlash = 'created' | 'updated' | 'sent' | 'send-failed' | 'duplicated';

const FLASHES: ReadonlySet<string> = new Set<QuoteFlash>([
  'created',
  'updated',
  'sent',
  'send-failed',
  'duplicated',
]);

/** Reads the flash from `location.state`, which can hold anything. */
export function readQuoteFlash(state: unknown): QuoteFlash | null {
  if (typeof state !== 'object' || state === null || !('flash' in state)) return null;
  const { flash } = state;
  return typeof flash === 'string' && FLASHES.has(flash) ? (flash as QuoteFlash) : null;
}
