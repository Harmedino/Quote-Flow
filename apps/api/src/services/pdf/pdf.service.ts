import { objectIdSchema, todayInTimeZone } from '@quoteflow/shared';
import type { Types } from 'mongoose';
import { type Business, BusinessModel, InvoiceModel, QuoteModel } from '../../models';
import type { InvoiceRecord } from '../../serializers/invoice.serializer';
import type { QuoteRecord } from '../../serializers/quote.serializer';
import { notFound } from '../../utils/app-error';
import type { Clock } from '../../utils/clock';
import { PUBLIC_TOKEN_PATTERN } from '../../utils/tokens';
import type { AuthContext } from '../access-token.service';
import { type PdfDocumentModel, invoicePdfModel, quotePdfModel } from './document-model';
import { pdfFileName } from './format';
import { renderDocumentPdf } from './render';

export interface PdfFile {
  fileName: string;
  content: Buffer;
}

export interface DocumentPdfService {
  quotePdf(auth: AuthContext, id: string): Promise<PdfFile>;
  invoicePdf(auth: AuthContext, id: string): Promise<PdfFile>;
  publicQuotePdf(token: string): Promise<PdfFile>;
  publicInvoicePdf(token: string): Promise<PdfFile>;
}

const QUOTE_NOT_FOUND = 'Quote not found.';
const INVOICE_NOT_FOUND = 'Invoice not found.';

const isObjectId = (id: string) => objectIdSchema.safeParse(id).success;
const isPublicToken = (token: string) => PUBLIC_TOKEN_PATTERN.test(token);

async function render(model: PdfDocumentModel): Promise<PdfFile> {
  return { fileName: pdfFileName(model.number), content: await renderDocumentPdf(model) };
}

export function createDocumentPdfService({ clock }: { clock: Clock }): DocumentPdfService {
  async function businessOf(businessId: Types.ObjectId | string): Promise<Business | null> {
    return BusinessModel.findById(businessId).lean<Business>();
  }

  const todayFor = (business: Business) => todayInTimeZone(business.timezone, clock());

  async function quoteFile(quote: QuoteRecord | null): Promise<PdfFile> {
    const business = quote && (await businessOf(quote.businessId));
    if (!quote || !business) throw notFound(QUOTE_NOT_FOUND);
    return render(quotePdfModel(quote, business, todayFor(business)));
  }

  async function invoiceFile(invoice: InvoiceRecord | null): Promise<PdfFile> {
    const business = invoice && (await businessOf(invoice.businessId));
    if (!invoice || !business) throw notFound(INVOICE_NOT_FOUND);
    return render(invoicePdfModel(invoice, business, todayFor(business)));
  }

  return {
    async quotePdf(auth, id) {
      if (!isObjectId(id)) throw notFound(QUOTE_NOT_FOUND);
      return quoteFile(
        await QuoteModel.findOne({ _id: id, businessId: auth.businessId }).lean<QuoteRecord>(),
      );
    },

    async invoicePdf(auth, id) {
      if (!isObjectId(id)) throw notFound(INVOICE_NOT_FOUND);
      return invoiceFile(
        await InvoiceModel.findOne({ _id: id, businessId: auth.businessId }).lean<InvoiceRecord>(),
      );
    },

    // Public links work once a document has been sent: drafts are never exposed.
    async publicQuotePdf(token) {
      if (!isPublicToken(token)) throw notFound(QUOTE_NOT_FOUND);
      return quoteFile(
        await QuoteModel.findOne({ publicToken: token, status: { $ne: 'draft' } })
          .setOptions({ skipTenantGuard: true })
          .lean<QuoteRecord>(),
      );
    },

    async publicInvoicePdf(token) {
      if (!isPublicToken(token)) throw notFound(INVOICE_NOT_FOUND);
      return invoiceFile(
        await InvoiceModel.findOne({ publicToken: token, status: { $ne: 'draft' } })
          .setOptions({ skipTenantGuard: true })
          .lean<InvoiceRecord>(),
      );
    },
  };
}
