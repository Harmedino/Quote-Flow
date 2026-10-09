import { buildQuoteShareMessage, buildWhatsAppUrl, toWhatsAppPhone } from '@quoteflow/shared';
import { paths } from '@/app/paths';

export function publicQuoteUrl(origin: string, publicToken: string): string {
  return `${origin}${paths.publicQuote(publicToken)}`;
}

export interface QuoteShare {
  url: string;
  message: string;
  whatsAppUrl: string;
  /** False when the customer has no international phone number, so WhatsApp opens without a chat. */
  hasWhatsAppNumber: boolean;
}

export function buildQuoteShare(input: {
  origin: string;
  publicToken: string;
  quoteNumber: string;
  businessName: string;
  customerName: string;
  customerPhone: string | null;
}): QuoteShare {
  const url = publicQuoteUrl(input.origin, input.publicToken);
  const message = buildQuoteShareMessage({
    customerName: input.customerName,
    businessName: input.businessName,
    quoteNumber: input.quoteNumber,
    url,
  });
  return {
    url,
    message,
    whatsAppUrl: buildWhatsAppUrl(message, input.customerPhone),
    hasWhatsAppNumber: toWhatsAppPhone(input.customerPhone) !== null,
  };
}
