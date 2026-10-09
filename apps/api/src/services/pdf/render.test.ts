import { inflateSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import type { PdfDocumentModel } from './document-model';
import { formatPdfMoney, pdfFileName } from './format';
import { renderDocumentPdf } from './render';

const LONG_DESCRIPTION =
  'Full interior repaint including surface preparation, filling cracks, sanding, two coats of ' +
  'premium emulsion on walls and ceilings, gloss on skirting boards and door frames, and a ' +
  'final clean of all affected rooms. Furniture is moved and covered before work starts. ';

export function sampleModel(overrides: Partial<PdfDocumentModel> = {}): PdfDocumentModel {
  return {
    title: 'Quotation',
    number: 'QUO-0042',
    status: { label: 'Accepted', tone: 'success' },
    currency: 'NGN',
    business: {
      name: 'Adébáyọ̀ Home Services',
      logoUrl: null,
      email: 'hello@adebayo.example',
      phone: '+234 803 555 0100',
      website: 'https://adebayo.example',
      address: { line1: '12 Admiralty Way', city: 'Lekki', state: 'Lagos', country: 'Nigeria' },
      brandColor: '#0f766e',
    },
    customer: {
      name: 'Chiamaka Ọkafọ̀r',
      email: 'chiamaka@example.com',
      phone: '+234 802 000 1111',
      company: 'Ọkafọ̀r Holdings',
      address: { line1: '4 Bourdillon Road', city: 'Ikoyi', country: 'Nigeria' },
    },
    issueDate: '2026-10-08',
    deadline: { label: 'Valid until', date: '2026-10-22' },
    items: Array.from({ length: 14 }, (_, index) => ({
      serviceId: null,
      name: `Room ${index + 1} repaint`,
      description: LONG_DESCRIPTION.repeat(index % 3 === 0 ? 4 : 1).trim(),
      quantity: 2.5,
      unit: 'day',
      unitPrice: 4_500_000,
      amount: 11_250_000,
    })),
    discount: { type: 'percentage', value: 10 },
    taxRate: 7.5,
    totals: { subtotal: 157_500_000, discount: 15_750_000, tax: 10_631_250, total: 152_381_250 },
    payment: null,
    notes: 'Thank you for your business.',
    terms: 'A 50% deposit is due before work starts.',
    ...overrides,
  };
}

/** The text drawn by every content stream, decompressed (fonts are embedded as hex glyph ids). */
function contentStreams(pdf: Buffer): string {
  const raw = pdf.toString('latin1');
  const streams: string[] = [];
  const pattern = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
  for (const match of raw.matchAll(pattern)) {
    try {
      streams.push(inflateSync(Buffer.from(match[1] ?? '', 'latin1')).toString('latin1'));
    } catch {
      // Not a deflated stream (e.g. a font file); nothing to read.
    }
  }
  return streams.join('\n');
}

describe('renderDocumentPdf', () => {
  it('renders a multi-page quote with Naira amounts and long descriptions', async () => {
    const pdf = await renderDocumentPdf(sampleModel());

    expect(pdf.subarray(0, 5).toString('latin1')).toBe('%PDF-');
    expect(pdf.length).toBeGreaterThan(20_000);
    const pageCount = pdf.toString('latin1').match(/\/Type \/Page\b/g)?.length ?? 0;
    expect(pageCount).toBeGreaterThanOrEqual(2);
    // The Inter subset is embedded, so the Naira sign and names can be drawn.
    expect(pdf.toString('latin1')).toMatch(/\/FontFile2/);
    expect(contentStreams(pdf)).toMatch(/TJ/);
  });

  it('renders an invoice with payments on a single page', async () => {
    const pdf = await renderDocumentPdf(
      sampleModel({
        title: 'Invoice',
        number: 'INV-0007',
        status: { label: 'Overdue', tone: 'danger' },
        currency: 'USD',
        deadline: { label: 'Due date', date: '2026-10-01' },
        items: sampleModel().items.slice(1, 3),
        payment: { amountPaid: 50_000, balanceDue: 102_331_250 },
        notes: null,
        terms: null,
      }),
    );

    expect(pdf.subarray(0, 5).toString('latin1')).toBe('%PDF-');
    expect(pdf.toString('latin1').match(/\/Type \/Page\b/g)).toHaveLength(1);
  });
});

describe('pdf formatting', () => {
  it('uses the local currency symbol with exact minor units', () => {
    expect(formatPdfMoney(152_381_250, 'NGN')).toBe('₦1,523,812.50');
    expect(formatPdfMoney(1_000, 'GHS')).toBe('GH₵10.00');
    expect(formatPdfMoney(1_250, 'KWD')).toBe('KWD\u00a01.250');
    expect(formatPdfMoney(1_234_500, 'USD')).toBe('$12,345.00');
  });

  it('sanitises the attachment file name', () => {
    expect(pdfFileName('QUO-0042')).toBe('QUO-0042.pdf');
    expect(pdfFileName('INV/2026 "07"')).toBe('INV-2026-07.pdf');
    expect(pdfFileName('../..')).toBe('document.pdf');
  });
});
