import type { QuoteDto } from '@quoteflow/shared';
import { useState } from 'react';
import { paths } from '@/app/paths';
import { Alert } from '@/components/ui/Alert';
import { SharePanel } from '@/features/documents/SharePanel';
import { getErrorMessage } from '@/lib/api-client';
import { buildQuoteShare, canShareQuote } from '../quote-share';
import { useSendQuote } from '../use-quotes';

export interface QuoteSharePanelProps {
  quote: QuoteDto;
  businessName: string;
}

function shareDescription(quote: QuoteDto): string {
  const name = quote.customer.name;
  if (quote.status === 'draft')
    return `${name} can’t see this draft yet. Sharing it marks it as sent.`;
  if (quote.status === 'accepted') return `${name} accepted it. The link still opens the quote.`;
  return `${name} opens the link, sees your prices, then accepts or declines. No account needed.`;
}

/**
 * Share by WhatsApp or link. Drafts are not visible to customers, so sharing
 * one marks it as sent first.
 */
export function QuoteSharePanel({ quote, businessName }: QuoteSharePanelProps) {
  const sendQuote = useSendQuote();
  const [announcement, setAnnouncement] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isDraft = quote.status === 'draft';
  const share = buildQuoteShare({
    origin: window.location.origin,
    publicToken: quote.publicToken,
    quoteNumber: quote.quoteNumber,
    businessName,
    customerName: quote.customer.name,
    customerPhone: quote.customer.phone,
  });

  if (!canShareQuote(quote.status)) {
    return null;
  }

  async function ensureSent(): Promise<boolean> {
    if (!isDraft) return true;
    try {
      await sendQuote.mutateAsync(quote.id);
      return true;
    } catch (sendError) {
      setError(getErrorMessage(sendError));
      return false;
    }
  }

  async function shareOnWhatsApp() {
    setError(null);
    // Opened synchronously so popup blockers allow it; pointed at WhatsApp once the quote is sent.
    const popup = window.open('about:blank', '_blank');
    if (!(await ensureSent())) {
      popup?.close();
      return;
    }
    if (popup) {
      popup.opener = null;
      popup.location.href = share.whatsAppUrl;
    } else {
      window.location.href = share.whatsAppUrl;
    }
    setAnnouncement(isDraft ? 'Quote marked as sent. WhatsApp opened.' : 'WhatsApp opened.');
  }

  async function copyLink() {
    setError(null);
    if (!(await ensureSent())) return;
    try {
      await navigator.clipboard.writeText(share.url);
      setCopied(true);
      setAnnouncement(
        isDraft ? 'Link copied. The quote is marked as sent.' : 'Link copied to clipboard.',
      );
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setError(`Copy failed. Select and copy the link instead: ${share.url}`);
    }
  }

  async function markAsSent() {
    setError(null);
    if (await ensureSent()) setAnnouncement('Quote marked as sent.');
  }

  return (
    <SharePanel
      title="Share with customer"
      description={shareDescription(quote)}
      url={share.url}
      sending={sendQuote.isPending}
      copied={copied}
      onShareWhatsApp={() => void shareOnWhatsApp()}
      onCopyLink={() => void copyLink()}
      previewHref={isDraft ? undefined : paths.publicQuotePreview(quote.publicToken)}
      // Once accepted, the header's "Convert to invoice" (or "View invoice") is the next step.
      emphasis={quote.status === 'accepted' ? 'secondary' : 'primary'}
    >
      {!share.hasWhatsAppNumber && (
        <p className="text-xs text-pretty text-stone-500">
          {quote.customer.phone
            ? `${quote.customer.phone} has no country code, so WhatsApp will open without a chat. Pick ${quote.customer.name} there.`
            : `${quote.customer.name} has no phone number, so WhatsApp will open without a chat.`}
        </p>
      )}
      {isDraft && (
        <p className="text-xs text-stone-500">
          Sent it another way?{' '}
          <button
            type="button"
            onClick={() => void markAsSent()}
            disabled={sendQuote.isPending}
            className="rounded-sm font-medium text-brand-700 hover:text-brand-800 hover:underline disabled:opacity-50"
          >
            Mark as sent
          </button>
        </p>
      )}
      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>
      {error && <Alert tone="danger">{error}</Alert>}
    </SharePanel>
  );
}
