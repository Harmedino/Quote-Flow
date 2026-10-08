import { type QuoteDto, canSendQuote } from '@quoteflow/shared';
import { Check, ExternalLink, Link2, MessageCircle } from 'lucide-react';
import { useState } from 'react';
import { paths } from '@/app/paths';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { buttonClasses } from '@/components/ui/button-styles';
import { getErrorMessage } from '@/lib/api-client';
import { buildQuoteShare } from '../quote-share';
import { useSendQuote } from '../use-quotes';

export interface QuoteSharePanelProps {
  quote: QuoteDto;
  businessName: string;
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

  if (!canSendQuote(quote.status) && quote.status !== 'accepted') {
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

  return (
    <div className="space-y-3">
      <Button
        className="w-full"
        size="lg"
        loading={sendQuote.isPending}
        onClick={() => void shareOnWhatsApp()}
      >
        <MessageCircle aria-hidden="true" />
        Share via WhatsApp
      </Button>
      {!share.hasWhatsAppNumber && (
        <p className="text-xs text-pretty text-zinc-500">
          {quote.customer.phone
            ? `${quote.customer.phone} has no country code, so WhatsApp will open without a chat. Pick ${quote.customer.name} there.`
            : `${quote.customer.name} has no phone number, so WhatsApp will open without a chat.`}
        </p>
      )}
      <div className="grid grid-cols-2 gap-2.5">
        <Button
          variant="secondary"
          onClick={() => void copyLink()}
          aria-disabled={sendQuote.isPending || undefined}
        >
          {copied ? (
            <Check aria-hidden="true" className="text-emerald-600" />
          ) : (
            <Link2 aria-hidden="true" />
          )}
          {copied ? 'Copied' : 'Copy link'}
        </Button>
        {isDraft ? (
          <Button
            variant="secondary"
            aria-disabled
            title="Customers can open the link once it is sent"
          >
            <ExternalLink aria-hidden="true" />
            Preview
          </Button>
        ) : (
          <a
            href={paths.publicQuote(quote.publicToken)}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonClasses({ variant: 'secondary' })}
          >
            <ExternalLink aria-hidden="true" />
            Preview
            <span className="sr-only"> as customer (opens in a new tab)</span>
          </a>
        )}
      </div>
      {isDraft && <p className="text-xs text-zinc-500">Sharing marks this draft as sent.</p>}
      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>
      {error && <Alert tone="danger">{error}</Alert>}
    </div>
  );
}
