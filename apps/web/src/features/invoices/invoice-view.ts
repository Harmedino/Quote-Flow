import {
  type BusinessDto,
  type InvoiceDto,
  type PublicBusinessDto,
  buildInvoiceShareMessage,
  buildWhatsAppUrl,
  canCancelInvoice,
  canDeleteInvoice,
  canEditInvoice,
  canRecordPayment,
  canSendInvoice,
} from '@quoteflow/shared';
import { formatCalendarDate, formatMoney } from '@/lib/format';

/** What the customer sees about the business, for previewing the invoice as they will. */
export function toPublicBusiness(business: BusinessDto): PublicBusinessDto {
  return {
    name: business.name,
    logoUrl: business.logoUrl,
    email: business.email,
    phone: business.phone,
    website: business.website,
    address: business.address,
    brandColor: business.brandColor,
  };
}

/** The customer-facing link; the token is the only credential it needs. */
export function invoicePublicUrl(origin: string, publicToken: string): string {
  return `${origin}/invoice/${encodeURIComponent(publicToken)}`;
}

export interface InvoiceActions {
  edit: boolean;
  delete: boolean;
  /** Only drafts need marking as sent; later sends are no-ops. */
  markAsSent: boolean;
  recordPayment: boolean;
  /** Sharing a draft marks it as sent first. */
  share: boolean;
  cancel: boolean;
}

/** The actions the shared lifecycle rules allow, so the page only offers what will succeed. */
export function getInvoiceActions(invoice: InvoiceDto): InvoiceActions {
  const { status } = invoice;
  return {
    edit: canEditInvoice(status),
    delete: canDeleteInvoice(status),
    markAsSent: status === 'draft',
    recordPayment: canRecordPayment(status, invoice.balanceDue),
    share: canSendInvoice(status),
    cancel: canCancelInvoice(status, invoice.amountPaid),
  };
}

export function buildInvoiceShareLinks(
  invoice: InvoiceDto,
  businessName: string,
  origin: string,
): { url: string; message: string; whatsAppUrl: string } {
  const url = invoicePublicUrl(origin, invoice.publicToken);
  const message = buildInvoiceShareMessage({
    customerName: invoice.customer.name,
    businessName,
    invoiceNumber: invoice.invoiceNumber,
    amountDue: formatMoney(invoice.balanceDue, invoice.currency),
    dueDate: formatCalendarDate(invoice.dueDate),
    url,
  });
  return { url, message, whatsAppUrl: buildWhatsAppUrl(message, invoice.customer.phone) };
}
