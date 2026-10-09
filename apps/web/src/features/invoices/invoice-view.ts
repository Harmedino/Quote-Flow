import {
  type InvoiceDto,
  buildInvoiceShareMessage,
  buildWhatsAppUrl,
  canCancelInvoice,
  canDeleteInvoice,
  canEditInvoice,
  canRecordPayment,
  canSendInvoice,
} from '@quoteflow/shared';
import { dueLabel } from '@/features/dashboard/dashboard-format';
import { formatCalendarDate, formatDate, formatMoney } from '@/lib/format';

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

export interface InvoiceOutlook {
  /** What the big figure is. */
  label: string;
  /** The big figure, in minor units. */
  amount: number;
  /** When it is due, or how it ended. */
  line: string;
  /** How much of the total is paid, 0 to 1; null while payments aren't tracked (draft, cancelled). */
  paidShare: number | null;
}

/** The headline of an invoice page: what is still owed and when. `today` is 'YYYY-MM-DD'. */
export function invoiceOutlook(
  invoice: Pick<
    InvoiceDto,
    'status' | 'dueDate' | 'paidAt' | 'cancelledAt' | 'totals' | 'amountPaid' | 'balanceDue'
  >,
  today: string,
  timeZone: string,
): InvoiceOutlook {
  const { total } = invoice.totals;
  const due = formatCalendarDate(invoice.dueDate);
  const paidShare = total > 0 ? Math.min(1, invoice.amountPaid / total) : 1;
  switch (invoice.status) {
    case 'cancelled':
      return {
        label: 'Cancelled',
        amount: total,
        line: invoice.cancelledAt
          ? `Cancelled on ${formatDate(invoice.cancelledAt, { timeZone })} · nothing is owed`
          : 'Nothing is owed',
        paidShare: null,
      };
    case 'paid':
      return {
        label: 'Paid in full',
        amount: total,
        line: invoice.paidAt
          ? `Last payment on ${formatCalendarDate(invoice.paidAt.slice(0, 10))}`
          : 'Nothing left to pay',
        paidShare: 1,
      };
    case 'draft':
      // Payments are tracked once it is sent.
      return {
        label: 'Balance due',
        amount: invoice.balanceDue,
        line: `Not sent yet · due ${due}`,
        paidShare: null,
      };
    case 'overdue':
      return {
        label: 'Balance due',
        amount: invoice.balanceDue,
        line: `${dueLabel(invoice.dueDate, today)} · was due ${due}`,
        paidShare,
      };
    default:
      return {
        label: 'Balance due',
        amount: invoice.balanceDue,
        line: `${dueLabel(invoice.dueDate, today)} · ${due}`,
        paidShare,
      };
  }
}
