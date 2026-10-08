import type { Request, Response } from 'express';
import { authOf } from '../middleware/auth';
import type { DocumentPdfService, PdfFile } from '../services/pdf/pdf.service';

function sendPdf(res: Response, { fileName, content }: PdfFile): void {
  res
    .status(200)
    .set({
      'Content-Type': 'application/pdf',
      // fileName is sanitised to [A-Za-z0-9._-], so it needs no quoting or encoding.
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Content-Length': String(content.length),
      'Cache-Control': 'no-store',
    })
    .end(content);
}

const paramOf = (req: Request, name: string): string => String(req.params[name] ?? '');

export function createPdfController(pdfs: DocumentPdfService) {
  return {
    quotePdf: async (req: Request, res: Response): Promise<void> => {
      sendPdf(res, await pdfs.quotePdf(authOf(req), paramOf(req, 'id')));
    },
    invoicePdf: async (req: Request, res: Response): Promise<void> => {
      sendPdf(res, await pdfs.invoicePdf(authOf(req), paramOf(req, 'id')));
    },
    publicQuotePdf: async (req: Request, res: Response): Promise<void> => {
      sendPdf(res, await pdfs.publicQuotePdf(paramOf(req, 'token')));
    },
    publicInvoicePdf: async (req: Request, res: Response): Promise<void> => {
      sendPdf(res, await pdfs.publicInvoicePdf(paramOf(req, 'token')));
    },
  };
}
