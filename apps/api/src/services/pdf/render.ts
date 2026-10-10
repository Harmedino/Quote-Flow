import { DEFAULT_BRAND_COLOR } from '@quoteflow/shared';
import PDFDocument from 'pdfkit';
import type { PdfDocumentModel, PdfTone } from './document-model';
import { PDF_FONTS, loadPdfFonts } from './fonts';
import {
  addressLines,
  breakLongRuns,
  discountLabel,
  formatPdfDate,
  formatPdfMoney,
  formatPercent,
  formatQuantity,
} from './format';

type Doc = PDFKit.PDFDocument;

const PAGE = { width: 595.28, height: 841.89 };
const MARGIN = { top: 56, bottom: 72, left: 50, right: 50 };
const CONTENT_WIDTH = PAGE.width - MARGIN.left - MARGIN.right;
const RIGHT = PAGE.width - MARGIN.right;
/** Content stops here; the footer lives below. */
const CONTENT_BOTTOM = PAGE.height - MARGIN.bottom;

const COLOR = {
  ink: '#111827',
  body: '#374151',
  muted: '#6b7280',
  border: '#e5e7eb',
  headerFill: '#f3f4f6',
};

const TONES: Record<PdfTone, { text: string; fill: string }> = {
  neutral: { text: '#374151', fill: '#f3f4f6' },
  info: { text: '#1d4ed8', fill: '#dbeafe' },
  success: { text: '#047857', fill: '#d1fae5' },
  warning: { text: '#b45309', fill: '#fef3c7' },
  danger: { text: '#b91c1c', fill: '#fee2e2' },
};

/** Item table columns: x offset from the left margin, width and alignment. */
const COLUMNS = {
  item: { x: 0, width: 239, align: 'left' },
  quantity: { x: 247, width: 70, align: 'right' },
  unitPrice: { x: 325, width: 80, align: 'right' },
  amount: { x: 413, width: CONTENT_WIDTH - 413, align: 'right' },
} as const;
const CELL_PADDING_Y = 8;

const HEX_COLOR = /^#[0-9a-f]{6}$/i;

function brandColorOf(model: PdfDocumentModel): string {
  return HEX_COLOR.test(model.business.brandColor)
    ? model.business.brandColor
    : DEFAULT_BRAND_COLOR;
}

function createDocument(model: PdfDocumentModel): Doc {
  const doc = new PDFDocument({
    size: 'A4',
    margins: MARGIN,
    bufferPages: true,
    autoFirstPage: false,
    info: {
      Title: `${model.title} ${model.number}`,
      Author: model.business.name,
      Subject: `${model.title} for ${model.customer.name}`,
      Creator: 'QuoteFlow',
    },
  });
  for (const [name, data] of loadPdfFonts()) doc.registerFont(name, data);
  const brand = brandColorOf(model);
  // Every page, including those pdfkit adds while flowing long notes, gets the accent bar.
  doc.on('pageAdded', () => {
    doc.save().rect(0, 0, PAGE.width, 5).fill(brand).restore();
  });
  doc.addPage();
  return doc;
}

/**
 * `value` ready for wrapping at `options.width`, measured in the current font
 * and size (see breakLongRuns). Only text given a width is changed.
 */
function wrappable(doc: Doc, value: string, options: PDFKit.Mixins.TextOptions): string {
  const { width } = options;
  if (width === undefined) return value;
  return breakLongRuns(value, (run) => doc.widthOfString(run, options) > width);
}

function text(
  doc: Doc,
  value: string,
  x: number,
  y: number,
  options: PDFKit.Mixins.TextOptions & { font?: string; size?: number; color?: string } = {},
): number {
  const { font = PDF_FONTS.regular, size = 9.5, color = COLOR.body, ...rest } = options;
  doc.font(font).fontSize(size).fillColor(color);
  doc.text(wrappable(doc, value, rest), x, y, rest);
  return doc.y;
}

/** Prepares `value` as text() does, so the height matches what text() then draws. */
function heightOf(doc: Doc, value: string, font: string, size: number, width: number): number {
  doc.font(font).fontSize(size);
  return doc.heightOfString(wrappable(doc, value, { width }), { width });
}

function drawStatusPill(doc: Doc, label: string, tone: PdfTone, right: number, y: number): number {
  const colors = TONES[tone];
  const upper = label.toUpperCase();
  doc.font(PDF_FONTS.semibold).fontSize(8);
  const width = doc.widthOfString(upper, { characterSpacing: 0.6 }) + 16;
  const height = 18;
  doc
    .save()
    .roundedRect(right - width, y, width, height, 9)
    .fill(colors.fill)
    .restore();
  text(doc, upper, right - width, y + 5, {
    font: PDF_FONTS.semibold,
    size: 8,
    color: colors.text,
    width,
    align: 'center',
    characterSpacing: 0.6,
    lineBreak: false,
  });
  return y + height;
}

function drawHeader(doc: Doc, model: PdfDocumentModel): number {
  const top = MARGIN.top - 8;
  const leftWidth = 290;
  const { business } = model;

  let left = text(doc, business.name, MARGIN.left, top, {
    font: PDF_FONTS.semibold,
    size: 18,
    color: brandColorOf(model),
    width: leftWidth,
  });
  const contact = [
    ...addressLines(business.address),
    ...[business.email, business.phone, business.website].filter((v): v is string => Boolean(v)),
  ];
  left += 4;
  for (const line of contact) {
    left = text(doc, line, MARGIN.left, left, { size: 9, color: COLOR.muted, width: leftWidth });
  }

  const rightX = RIGHT - 200;
  let right = text(doc, model.title.toUpperCase(), rightX, top, {
    font: PDF_FONTS.semibold,
    size: 20,
    color: COLOR.ink,
    width: 200,
    align: 'right',
    characterSpacing: 1.5,
  });
  right = text(doc, model.number, rightX, right + 2, {
    font: PDF_FONTS.medium,
    size: 11,
    color: COLOR.muted,
    width: 200,
    align: 'right',
  });
  if (model.status) {
    right = drawStatusPill(doc, model.status.label, model.status.tone, RIGHT, right + 8);
  }

  const bottom = Math.max(left, right) + 18;
  doc
    .save()
    .moveTo(MARGIN.left, bottom)
    .lineTo(RIGHT, bottom)
    .lineWidth(0.75)
    .strokeColor(COLOR.border)
    .stroke()
    .restore();
  return bottom + 18;
}

function drawLabel(doc: Doc, label: string, x: number, y: number, width = 200): number {
  return text(doc, label.toUpperCase(), x, y, {
    font: PDF_FONTS.semibold,
    size: 7.5,
    color: COLOR.muted,
    characterSpacing: 0.8,
    width,
  });
}

function drawParties(doc: Doc, model: PdfDocumentModel, top: number): number {
  const { customer } = model;
  const leftWidth = 260;
  let left = drawLabel(doc, 'Bill to', MARGIN.left, top) + 4;
  left = text(doc, customer.name, MARGIN.left, left, {
    font: PDF_FONTS.semibold,
    size: 11,
    color: COLOR.ink,
    width: leftWidth,
  });
  const details = [
    customer.company,
    ...addressLines(customer.address),
    customer.email,
    customer.phone,
  ].filter((v): v is string => Boolean(v));
  left += 2;
  for (const line of details) {
    left = text(doc, line, MARGIN.left, left, { size: 9, width: leftWidth });
  }

  const rows: [string, string, boolean][] = [
    ['Issue date', formatPdfDate(model.issueDate), false],
    [model.deadline.label, formatPdfDate(model.deadline.date), false],
  ];
  if (model.payment) {
    rows.push(['Balance due', formatPdfMoney(model.payment.balanceDue, model.currency), true]);
  } else {
    rows.push(['Total', formatPdfMoney(model.totals.total, model.currency), true]);
  }
  const labelX = RIGHT - 220;
  let right = top;
  for (const [label, value, strong] of rows) {
    text(doc, label, labelX, right, { size: 9, color: COLOR.muted, width: 100 });
    right = text(doc, value, labelX + 100, right, {
      font: strong ? PDF_FONTS.semibold : PDF_FONTS.medium,
      size: strong ? 10.5 : 9.5,
      color: COLOR.ink,
      width: 120,
      align: 'right',
    });
    right += 5;
  }
  return Math.max(left, right) + 22;
}

function drawTableHeader(doc: Doc, y: number): number {
  const height = 22;
  doc.save().rect(MARGIN.left, y, CONTENT_WIDTH, height).fill(COLOR.headerFill).restore();
  const labels: [keyof typeof COLUMNS, string][] = [
    ['item', 'Item'],
    ['quantity', 'Qty'],
    ['unitPrice', 'Unit price'],
    ['amount', 'Amount'],
  ];
  for (const [key, label] of labels) {
    const column = COLUMNS[key];
    const inset = key === 'item' ? 8 : key === 'amount' ? -8 : 0;
    text(doc, label.toUpperCase(), MARGIN.left + column.x + inset, y + 7.5, {
      font: PDF_FONTS.semibold,
      size: 7.5,
      color: COLOR.muted,
      characterSpacing: 0.6,
      width: column.width,
      align: column.align,
      lineBreak: false,
    });
  }
  return y + height;
}

/** Starts a continuation page for the items table. */
function continueOnNewPage(doc: Doc, model: PdfDocumentModel): number {
  doc.addPage();
  const y = text(doc, `${model.title} ${model.number} (continued)`, MARGIN.left, MARGIN.top - 8, {
    size: 9,
    color: COLOR.muted,
  });
  return y + 10;
}

const ITEM_TEXT_WIDTH = COLUMNS.item.width - 8;

function drawItems(doc: Doc, model: PdfDocumentModel, top: number): number {
  let y = drawTableHeader(doc, top);
  for (const item of model.items) {
    const nameHeight = heightOf(doc, item.name, PDF_FONTS.medium, 10, ITEM_TEXT_WIDTH);
    const descriptionHeight = item.description
      ? heightOf(doc, item.description, PDF_FONTS.regular, 8.5, ITEM_TEXT_WIDTH) + 3
      : 0;
    const rowHeight = CELL_PADDING_Y * 2 + nameHeight + descriptionHeight;
    if (y + rowHeight > CONTENT_BOTTOM) {
      y = drawTableHeader(doc, continueOnNewPage(doc, model));
    }
    // A row taller than a whole page (only possible with extreme text) is clipped, not split.
    const available = CONTENT_BOTTOM - y - CELL_PADDING_Y * 2;
    const cellTop = y + CELL_PADDING_Y;
    const left = MARGIN.left + COLUMNS.item.x + 8;
    text(doc, item.name, left, cellTop, {
      font: PDF_FONTS.medium,
      size: 10,
      color: COLOR.ink,
      width: ITEM_TEXT_WIDTH,
    });
    if (item.description) {
      text(doc, item.description, left, cellTop + nameHeight + 3, {
        size: 8.5,
        color: COLOR.muted,
        width: ITEM_TEXT_WIDTH,
        height: Math.max(available - nameHeight - 3, 10),
        ellipsis: true,
      });
    }
    const numbers: [keyof typeof COLUMNS, string][] = [
      ['quantity', formatQuantity(item.quantity, item.unit)],
      ['unitPrice', formatPdfMoney(item.unitPrice, model.currency)],
      ['amount', formatPdfMoney(item.amount, model.currency)],
    ];
    for (const [key, value] of numbers) {
      const column = COLUMNS[key];
      text(doc, value, MARGIN.left + column.x + (key === 'amount' ? -8 : 0), cellTop + 1, {
        font: key === 'amount' ? PDF_FONTS.medium : PDF_FONTS.regular,
        size: 9.5,
        color: key === 'amount' ? COLOR.ink : COLOR.body,
        width: column.width,
        align: 'right',
        lineBreak: false,
      });
    }
    y = Math.min(y + rowHeight, CONTENT_BOTTOM);
    doc
      .save()
      .moveTo(MARGIN.left, y)
      .lineTo(RIGHT, y)
      .lineWidth(0.5)
      .strokeColor(COLOR.border)
      .stroke()
      .restore();
  }
  return y + 16;
}

interface TotalRow {
  label: string;
  value: string;
  emphasis?: 'total' | 'due';
}

function totalRows(model: PdfDocumentModel): TotalRow[] {
  const money = (minor: number) => formatPdfMoney(minor, model.currency);
  const { totals, payment } = model;
  const rows: TotalRow[] = [{ label: 'Subtotal', value: money(totals.subtotal) }];
  if (totals.discount > 0) {
    rows.push({ label: discountLabel(model.discount), value: `−${money(totals.discount)}` });
  }
  if (model.taxRate > 0 || totals.tax > 0) {
    rows.push({ label: `Tax (${formatPercent(model.taxRate)})`, value: money(totals.tax) });
  }
  rows.push({
    label: 'Total',
    value: money(totals.total),
    emphasis: payment ? undefined : 'total',
  });
  if (payment) {
    rows.push({ label: 'Amount paid', value: money(payment.amountPaid) });
    rows.push({ label: 'Balance due', value: money(payment.balanceDue), emphasis: 'due' });
  }
  return rows;
}

function drawTotals(doc: Doc, model: PdfDocumentModel, top: number): number {
  const rows = totalRows(model);
  const width = 250;
  const x = RIGHT - width;
  const blockHeight = rows.reduce((sum, row) => sum + (row.emphasis ? 34 : 20), 0);
  let y = top;
  if (y + blockHeight > CONTENT_BOTTOM) y = continueOnNewPage(doc, model);

  const brand = brandColorOf(model);
  for (const row of rows) {
    if (row.emphasis) {
      const height = 30;
      doc.save().roundedRect(x, y, width, height, 4).fillOpacity(0.08).fill(brand).restore();
      text(doc, row.label, x + 10, y + 9, {
        font: PDF_FONTS.semibold,
        size: 10.5,
        color: COLOR.ink,
        width: 110,
        lineBreak: false,
      });
      text(doc, row.value, x + 110, y + 8, {
        font: PDF_FONTS.semibold,
        size: 12,
        color: brand,
        width: width - 120,
        align: 'right',
        lineBreak: false,
      });
      y += height + 4;
    } else {
      text(doc, row.label, x + 10, y, { size: 9.5, color: COLOR.muted, width: 130 });
      text(doc, row.value, x + 110, y, {
        font: PDF_FONTS.medium,
        size: 9.5,
        color: COLOR.ink,
        width: width - 120,
        align: 'right',
        lineBreak: false,
      });
      y += 20;
    }
  }
  return y + 14;
}

/** Notes and terms may be long; pdfkit flows them onto new pages by itself. */
function drawTextSection(doc: Doc, title: string, body: string, top: number): number {
  let y = top;
  if (y + 40 > CONTENT_BOTTOM) {
    doc.addPage();
    y = MARGIN.top;
  }
  y = text(doc, title, MARGIN.left, y, {
    font: PDF_FONTS.semibold,
    size: 10,
    color: COLOR.ink,
    width: CONTENT_WIDTH,
  });
  y = text(doc, body, MARGIN.left, y + 3, {
    size: 9,
    color: COLOR.body,
    width: CONTENT_WIDTH,
    lineGap: 1.5,
  });
  return y + 16;
}

function drawFooters(doc: Doc, model: PdfDocumentModel): void {
  const range = doc.bufferedPageRange();
  for (let index = range.start; index < range.start + range.count; index += 1) {
    doc.switchToPage(index);
    // Writing below the bottom margin would otherwise make pdfkit start a new page.
    doc.page.margins.bottom = 0;
    const y = PAGE.height - 46;
    doc
      .save()
      .moveTo(MARGIN.left, y)
      .lineTo(RIGHT, y)
      .lineWidth(0.5)
      .strokeColor(COLOR.border)
      .stroke()
      .restore();
    const options = { size: 8, color: COLOR.muted, lineBreak: false } as const;
    text(doc, 'Generated with QuoteFlow', MARGIN.left, y + 10, { ...options, width: 160 });
    text(doc, `${model.title} ${model.number}`, MARGIN.left + 160, y + 10, {
      ...options,
      width: CONTENT_WIDTH - 320,
      align: 'center',
    });
    text(doc, `Page ${index - range.start + 1} of ${range.count}`, RIGHT - 160, y + 10, {
      ...options,
      width: 160,
      align: 'right',
    });
    doc.page.margins.bottom = MARGIN.bottom;
  }
}

function toBuffer(doc: Doc): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });
}

/** Renders a quote or invoice as an A4 PDF. */
export async function renderDocumentPdf(model: PdfDocumentModel): Promise<Buffer> {
  const doc = createDocument(model);
  const output = toBuffer(doc);

  let y = drawHeader(doc, model);
  y = drawParties(doc, model, y);
  y = drawItems(doc, model, y);
  y = drawTotals(doc, model, y);
  if (model.notes) y = drawTextSection(doc, 'Notes', model.notes, y);
  if (model.terms) drawTextSection(doc, 'Terms & conditions', model.terms, y);

  drawFooters(doc, model);
  doc.end();
  return output;
}
