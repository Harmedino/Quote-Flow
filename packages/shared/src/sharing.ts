/**
 * WhatsApp sharing without the WhatsApp Business API: build the message and a
 * wa.me link that opens WhatsApp (app or web) with the text ready to send.
 */

/**
 * Digits of an international phone number for wa.me, or null when the number
 * is too short to be one. wa.me needs the country code; local numbers
 * without it open the wrong chat, so the UI should say so.
 */
export function toWhatsAppPhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '').replace(/^00/, '');
  return digits.length >= 8 && digits.length <= 15 ? digits : null;
}

export function buildWhatsAppUrl(message: string, phone?: string | null): string {
  const digits = toWhatsAppPhone(phone);
  return `https://wa.me/${digits ?? ''}?text=${encodeURIComponent(message)}`;
}

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name;
}

export function buildQuoteShareMessage(input: {
  customerName: string;
  businessName: string;
  quoteNumber: string;
  url: string;
}): string {
  return [
    `Hi ${firstName(input.customerName)},`,
    '',
    `Here is your quotation ${input.quoteNumber} from ${input.businessName}.`,
    '',
    'View your quotation:',
    input.url,
    '',
    'Thank you.',
  ].join('\n');
}

export function buildInvoiceShareMessage(input: {
  customerName: string;
  businessName: string;
  invoiceNumber: string;
  /** Already formatted, e.g. "$1,250.00". */
  amountDue: string;
  /** Already formatted, e.g. "15 Nov 2026". */
  dueDate: string;
  url: string;
}): string {
  return [
    `Hi ${firstName(input.customerName)},`,
    '',
    `Here is invoice ${input.invoiceNumber} from ${input.businessName}.`,
    `Amount due: ${input.amountDue}, due by ${input.dueDate}.`,
    '',
    'View your invoice:',
    input.url,
    '',
    'Thank you for your business.',
  ].join('\n');
}
