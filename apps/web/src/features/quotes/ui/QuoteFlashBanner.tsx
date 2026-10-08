import type { QuoteDto } from '@quoteflow/shared';
import { Alert } from '@/components/ui/Alert';
import type { QuoteFlash } from '../quote-flash';

const MESSAGES: Record<
  QuoteFlash,
  (quote: QuoteDto) => { tone: 'success' | 'warning'; text: string }
> = {
  created: (quote) => ({
    tone: 'success',
    text: `Draft ${quote.quoteNumber} saved. Share it when you’re ready.`,
  }),
  updated: () => ({ tone: 'success', text: 'Changes saved.' }),
  sent: (quote) => ({
    tone: 'success',
    text: `${quote.quoteNumber} is ready to share. Send ${quote.customer.name} the link by WhatsApp or copy it.`,
  }),
  'send-failed': (quote) => ({
    tone: 'warning',
    text: `${quote.quoteNumber} was saved as a draft, but it couldn’t be marked as sent. Try sharing it again.`,
  }),
  duplicated: (quote) => ({ tone: 'success', text: `Copy created as ${quote.quoteNumber}.` }),
};

export function QuoteFlashBanner({ flash, quote }: { flash: QuoteFlash; quote: QuoteDto }) {
  const { tone, text } = MESSAGES[flash](quote);
  return (
    <Alert tone={tone} className="mb-6">
      {text}
    </Alert>
  );
}
