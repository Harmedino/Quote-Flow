import type { InvoiceDto } from '@quoteflow/shared';
import { useEffect, useState } from 'react';
import { buildInvoiceShareLinks } from './invoice-view';
import { useSendInvoice } from './use-invoices';

const COPIED_FEEDBACK_MS = 2_500;

/**
 * Sharing an invoice sends it, so a draft is marked as sent first. The
 * WhatsApp tab is opened during the click (before any await), because
 * browsers block windows opened later; it is pointed at wa.me once ready.
 */
export function useInvoiceSharing(invoice: InvoiceDto, businessName: string) {
  const send = useSendInvoice(invoice.id);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), COPIED_FEEDBACK_MS);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const links = buildInvoiceShareLinks(invoice, businessName, window.location.origin);

  async function ensureSent(): Promise<void> {
    if (invoice.status === 'draft') await send.mutateAsync();
  }

  async function shareOnWhatsApp(): Promise<void> {
    if (invoice.status !== 'draft') {
      window.open(links.whatsAppUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    const popup = window.open('', '_blank');
    try {
      await ensureSent();
    } catch {
      popup?.close();
      return;
    }
    if (popup) {
      popup.opener = null;
      popup.location.href = links.whatsAppUrl;
    } else {
      window.location.assign(links.whatsAppUrl);
    }
  }

  async function copyLink(): Promise<void> {
    setCopyError(false);
    try {
      await ensureSent();
    } catch {
      return;
    }
    try {
      await navigator.clipboard.writeText(links.url);
      setCopied(true);
    } catch {
      setCopyError(true);
    }
  }

  return {
    url: links.url,
    shareOnWhatsApp,
    copyLink,
    /** For a draft sent some other way: start tracking it without sharing from here. */
    markAsSent: () => send.mutate(),
    copied,
    copyError,
    sending: send.isPending,
    sendError: send.error,
  };
}
