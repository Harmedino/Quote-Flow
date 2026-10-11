import { DEFAULT_BRAND_COLOR } from '@quoteflow/shared';
import PDFDocument from 'pdfkit';
import type { PdfDocumentModel, PdfTone } from './document-model';
import { type TextRun, textRuns } from './font-runs';
import { PDF_FACES, PDF_FONTS, type PdfFace, isFaceSpace, loadPdfFonts } from './fonts';
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
const MARGIN = { top: 44, bottom: 72, left: 44, right: 44 };
const CONTENT_WIDTH = PAGE.width - MARGIN.left - MARGIN.right;
const RIGHT = PAGE.width - MARGIN.right;
/** Content stops here; the footer lives below. */
const CONTENT_BOTTOM = PAGE.height - MARGIN.bottom;

/** Signal on paper: workwear navy text, warm hairlines and dashed perforations. */
const COLOR = {
  ink: '#0e1b33',
  ink2: '#2b3852',
  muted: '#5d6577',
  line: '#e6decf',
  perforation: '#cdbfa6',
  sunken: '#f2ede3',
  /** QuoteFlow's own hi-vis orange: only the mark in the footer. */
  signal: '#ff5f1f',
};

/** The ink of each rubber stamp, as on the ticket in the app. */
const STAMP_INK: Record<PdfTone, string> = {
  draft: '#4f5868',
  sent: '#1f55c9',
  accepted: '#157347',
  declined: '#b42318',
  expired: '#6b5c3a',
  partial: '#9a5300',
  paid: '#157347',
  overdue: '#c81e1e',
};

/** Item table columns: x offset from the left margin, width and alignment. */
const COLUMNS = {
  item: { x: 0, width: 236, align: 'left' },
  quantity: { x: 244, width: 52, align: 'right' },
  unitPrice: { x: 304, width: 98, align: 'right' },
  amount: { x: 410, width: CONTENT_WIDTH - 410, align: 'right' },
} as const;
const CELL_PADDING_Y = 9;
const ITEM_TEXT_WIDTH = COLUMNS.item.width;

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
  // Every page, including those pdfkit adds while flowing long notes, gets the business's band.
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

type TextStyle = PDFKit.Mixins.TextOptions & { font?: string; size?: number; color?: string };

/** Running text in Inter, wrapped at `width`. Returns the y below it. */
function text(doc: Doc, value: string, x: number, y: number, options: TextStyle = {}): number {
  const { font = PDF_FONTS.regular, size = 9.5, color = COLOR.ink2, ...rest } = options;
  doc.font(font).fontSize(size).fillColor(color);
  doc.text(wrappable(doc, value, rest), x, y, rest);
  return doc.y;
}

/** Prepares `value` as text() does, so the height matches what text() then draws. */
function heightOf(doc: Doc, value: string, font: string, size: number, width: number): number {
  doc.font(font).fontSize(size);
  return doc.heightOfString(wrappable(doc, value, { width }), { width });
}

interface LineStyle {
  face: PdfFace;
  size: number;
  color?: string;
  /** With `align`, the box the line is aligned in. */
  width?: number;
  align?: 'left' | 'right';
  characterSpacing?: number;
}

/**
 * How far a run moves the pen: its width in its font, or for spaces a face sets in Inter (see
 * PdfFace.spaceWidth), the face's own advance.
 */
function runWidth(doc: Doc, run: TextRun, style: LineStyle): number {
  const { face, size, characterSpacing = 0 } = style;
  if (face.spaceWidth !== undefined && isFaceSpace(run.text, face)) {
    const count = [...run.text].length;
    return count * face.spaceWidth * size + (count - 1) * characterSpacing;
  }
  return doc.font(run.font).fontSize(size).widthOfString(run.text, { characterSpacing });
}

/** The width of one line in a Signal face, as drawLine() draws it. */
function lineWidth(doc: Doc, value: string, style: LineStyle): number {
  const { characterSpacing = 0 } = style;
  // pdfkit spaces the characters within a run; the runs are spaced the same way.
  return textRuns(value, style.face).reduce(
    (sum, run, index) => sum + (index > 0 ? characterSpacing : 0) + runWidth(doc, run, style),
    0,
  );
}

/**
 * One line in a Signal face (labels, numbers, amounts), drawn run by run because the face comes
 * split by Unicode subset (see textRuns). Returns the y below it.
 */
function drawLine(doc: Doc, value: string, x: number, y: number, style: LineStyle): number {
  const { face, size, color = COLOR.ink, width = 0, align = 'left', characterSpacing = 0 } = style;
  let cursor = align === 'right' ? x + width - lineWidth(doc, value, style) : x;
  for (const run of textRuns(value, face)) {
    doc.font(run.font).fontSize(size).fillColor(color);
    doc.text(run.text, cursor, y, { lineBreak: false, characterSpacing });
    cursor += runWidth(doc, run, style) + characterSpacing;
  }
  return y + doc.currentLineHeight();
}

/** A label in mono capitals, as on the ticket in the app ("BILL TO", "THE JOB"). */
function drawLabel(doc: Doc, value: string, x: number, y: number, style: Partial<LineStyle> = {}) {
  return drawLine(doc, value.toUpperCase(), x, y, {
    face: PDF_FACES.mono,
    size: 7.5,
    color: COLOR.muted,
    characterSpacing: 0.9,
    ...style,
  });
}

/**
 * A business or customer name in Archivo, wrapped at `width`. Runs can't be wrapped across lines
 * one at a time, so a name Archivo can't draw in full is set in Inter instead. Returns the y below.
 */
function drawName(doc: Doc, value: string, x: number, y: number, width: number): number {
  const size = 11.5;
  const runs = textRuns(value, PDF_FACES.heading);
  if (runs.some((run) => run.font === PDF_FACES.heading.fallback)) {
    return text(doc, value, x, y, { font: PDF_FONTS.semibold, size, color: COLOR.ink, width });
  }
  doc.fontSize(size).fillColor(COLOR.ink);
  runs.forEach((run, index) => {
    const continued = index < runs.length - 1;
    doc.font(run.font);
    if (index === 0) doc.text(run.text, x, y, { width, continued });
    else doc.text(run.text, { width, continued });
  });
  return doc.y;
}

function dashedRule(doc: Doc, y: number, color = COLOR.perforation): void {
  doc
    .save()
    .moveTo(MARGIN.left, y)
    .lineTo(RIGHT, y)
    .lineWidth(1)
    .dash(3, { space: 2.5 })
    .strokeColor(color)
    .stroke()
    .undash()
    .restore();
}

function hairline(doc: Doc, y: number, color = COLOR.line): void {
  doc
    .save()
    .moveTo(MARGIN.left, y)
    .lineTo(RIGHT, y)
    .lineWidth(0.75)
    .strokeColor(color)
    .stroke()
    .restore();
}

/**
 * The customer's answer (or the invoice's state) as a rubber stamp: double-ruled, tilted, in the
 * status's ink. Centred on (cx, cy).
 */
function drawStamp(doc: Doc, status: string, tone: PdfTone, cx: number, cy: number): void {
  const word = status.toUpperCase();
  const style: LineStyle = {
    face: PDF_FACES.monoBold,
    size: 12,
    color: STAMP_INK[tone],
    characterSpacing: 2,
  };
  const width = lineWidth(doc, word, style) + 22;
  const height = 30;
  doc.save().rotate(-6, { origin: [cx, cy] });
  doc.lineWidth(1.6).strokeColor(STAMP_INK[tone]).strokeOpacity(0.9);
  doc.roundedRect(cx - width / 2, cy - height / 2, width, height, 3).stroke();
  doc.lineWidth(0.7);
  doc.roundedRect(cx - width / 2 + 3, cy - height / 2 + 3, width - 6, height - 6, 2).stroke();
  drawLine(doc, word, cx - width / 2 + 11, cy - 6.5, style);
  doc.restore();
}

const STUB_HEIGHT = 108;
const NOTCH_RADIUS = 7;

/** The stub: what it is, its number and dates on a tint of the brand colour, and the stamp. */
function drawStub(doc: Doc, model: PdfDocumentModel): number {
  const top = MARGIN.top;
  const bottom = top + STUB_HEIGHT;
  const brand = brandColorOf(model);
  doc
    .save()
    .roundedRect(MARGIN.left, top, CONTENT_WIDTH, STUB_HEIGHT + 10, 10)
    .clip()
    .rect(MARGIN.left, top, CONTENT_WIDTH, STUB_HEIGHT)
    .fillOpacity(0.1)
    .fill(brand)
    .restore();

  const x = MARGIN.left + 20;
  drawLabel(doc, model.title, x, top + 18, { color: COLOR.ink2, size: 8, characterSpacing: 1.2 });
  drawLine(doc, model.number, x, top + 33, { face: PDF_FACES.display, size: 24 });
  const dates: [string, string][] = [
    ['Issued', model.issueDate],
    [model.deadline.label, model.deadline.date],
  ];
  dates.forEach(([term, date], index) => {
    const dateX = x + index * 130;
    drawLabel(doc, term, dateX, top + 70);
    text(doc, formatPdfDate(date), dateX, top + 82, {
      font: PDF_FONTS.semibold,
      size: 10,
      color: COLOR.ink,
      lineBreak: false,
    });
  });
  if (model.status) {
    drawStamp(doc, model.status.label, model.status.tone, RIGHT - 82, top + STUB_HEIGHT / 2 + 4);
  }

  // The perforation where the stub tears off, with a notch cut into each edge.
  dashedRule(doc, bottom);
  for (const cx of [MARGIN.left, RIGHT]) {
    doc.save().circle(cx, bottom, NOTCH_RADIUS).fill('#ffffff').restore();
  }
  return bottom + 22;
}

/** "From" and who it is for, side by side. */
function drawParties(doc: Doc, model: PdfDocumentModel, top: number): number {
  const { business, customer } = model;
  const columnWidth = (CONTENT_WIDTH - 32) / 2;

  drawLabel(doc, 'From', MARGIN.left, top);
  const nameTop = top + 16;
  let left = drawName(doc, business.name, MARGIN.left, nameTop, columnWidth) + 3;
  const contact = [
    ...addressLines(business.address),
    ...[business.phone, business.email, business.website].filter((v): v is string => Boolean(v)),
  ];
  for (const contactLine of contact) {
    left = text(doc, contactLine, MARGIN.left, left, { size: 8.5, width: columnWidth, lineGap: 1 });
  }

  const rightX = MARGIN.left + columnWidth + 32;
  drawLabel(doc, model.title === 'Invoice' ? 'Bill to' : 'Prepared for', rightX, top);
  let right = drawName(doc, customer.name, rightX, nameTop, columnWidth) + 3;
  const details = [
    customer.company,
    ...addressLines(customer.address),
    customer.email,
    customer.phone,
  ].filter((v): v is string => Boolean(v));
  for (const detail of details) {
    right = text(doc, detail, rightX, right, { size: 8.5, width: columnWidth, lineGap: 1 });
  }

  const bottom = Math.max(left, right) + 18;
  dashedRule(doc, bottom);
  return bottom + 20;
}

function drawTableHeader(doc: Doc, y: number): number {
  const labels: [keyof typeof COLUMNS, string][] = [
    ['item', 'The job'],
    ['quantity', 'Qty'],
    ['unitPrice', 'Unit price'],
    ['amount', 'Amount'],
  ];
  for (const [key, value] of labels) {
    const column = COLUMNS[key];
    drawLabel(doc, value, MARGIN.left + column.x, y, { width: column.width, align: column.align });
  }
  hairline(doc, y + 15);
  return y + 15;
}

/** Starts a continuation page for the items table. */
function continueOnNewPage(doc: Doc, model: PdfDocumentModel): number {
  doc.addPage();
  return drawLabel(doc, `${model.title} ${model.number} (continued)`, MARGIN.left, MARGIN.top) + 14;
}

function drawItems(doc: Doc, model: PdfDocumentModel, top: number): number {
  let y = drawTableHeader(doc, top);
  model.items.forEach((item, index) => {
    const nameHeight = heightOf(doc, item.name, PDF_FONTS.semibold, 10, ITEM_TEXT_WIDTH);
    const descriptionHeight = item.description
      ? heightOf(doc, item.description, PDF_FONTS.regular, 8.5, ITEM_TEXT_WIDTH) + 3
      : 0;
    const rowHeight = CELL_PADDING_Y * 2 + Math.max(nameHeight + descriptionHeight, 22);
    if (y + rowHeight > CONTENT_BOTTOM) {
      y = drawTableHeader(doc, continueOnNewPage(doc, model));
    }
    // A row taller than a whole page (only possible with extreme text) is clipped, not split.
    const available = CONTENT_BOTTOM - y - CELL_PADDING_Y * 2;
    const cellTop = y + CELL_PADDING_Y;
    const left = MARGIN.left + COLUMNS.item.x;
    text(doc, item.name, left, cellTop, {
      font: PDF_FONTS.semibold,
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

    const money = (minor: number) => formatPdfMoney(minor, model.currency);
    const cell = (key: keyof typeof COLUMNS) => ({
      width: COLUMNS[key].width,
      align: 'right' as const,
    });
    const numbersTop = cellTop + 1;
    drawLine(
      doc,
      formatQuantity(item.quantity, null),
      MARGIN.left + COLUMNS.quantity.x,
      numbersTop,
      {
        face: PDF_FACES.mono,
        size: 9.5,
        color: COLOR.ink2,
        ...cell('quantity'),
      },
    );
    drawLine(doc, money(item.unitPrice), MARGIN.left + COLUMNS.unitPrice.x, numbersTop, {
      face: PDF_FACES.mono,
      size: 9.5,
      color: COLOR.ink2,
      ...cell('unitPrice'),
    });
    if (item.unit) {
      drawLine(doc, `per ${item.unit}`, MARGIN.left + COLUMNS.unitPrice.x, numbersTop + 13, {
        face: PDF_FACES.mono,
        size: 7.5,
        color: COLOR.muted,
        ...cell('unitPrice'),
      });
    }
    drawLine(doc, money(item.amount), MARGIN.left + COLUMNS.amount.x, numbersTop, {
      face: PDF_FACES.monoBold,
      size: 10,
      ...cell('amount'),
    });

    y = Math.min(y + rowHeight, CONTENT_BOTTOM);
    if (index < model.items.length - 1) dashedRule(doc, y, COLOR.line);
  });
  hairline(doc, y);
  return y + 14;
}

interface TotalRow {
  label: string;
  value: string;
  strong?: boolean;
  /** A dashed rule above the row. */
  ruled?: boolean;
}

/** The breakdown above the highlighted figure, as in the app's ticket. */
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
  if (payment) {
    rows.push({ label: 'Total', value: money(totals.total), strong: true, ruled: true });
    rows.push({
      label: 'Amount paid',
      value: payment.amountPaid > 0 ? `−${money(payment.amountPaid)}` : money(0),
    });
  }
  return rows;
}

const TOTALS_WIDTH = 236;
const HIGHLIGHT_HEIGHT = 44;

function drawTotals(doc: Doc, model: PdfDocumentModel, top: number): number {
  const rows = totalRows(model);
  const x = RIGHT - TOTALS_WIDTH;
  const blockHeight = rows.length * 19 + HIGHLIGHT_HEIGHT + 24;
  let y = top;
  if (y + blockHeight > CONTENT_BOTTOM) y = continueOnNewPage(doc, model);

  for (const row of rows) {
    if (row.ruled) {
      y += 3;
      doc
        .save()
        .moveTo(x, y)
        .lineTo(RIGHT, y)
        .lineWidth(1)
        .dash(3, { space: 2.5 })
        .strokeColor(COLOR.perforation)
        .stroke()
        .undash()
        .restore();
      y += 9;
    }
    text(doc, row.label, x, y, {
      font: row.strong ? PDF_FONTS.semibold : PDF_FONTS.regular,
      size: 9.5,
      color: row.strong ? COLOR.ink : COLOR.ink2,
      width: 130,
      lineBreak: false,
    });
    drawLine(doc, row.value, x + 110, y, {
      face: row.strong ? PDF_FACES.monoBold : PDF_FACES.mono,
      size: 9.5,
      width: TOTALS_WIDTH - 110,
      align: 'right',
    });
    y += 19;
  }

  // The figure that matters, on the sunken stock with the brand colour under it.
  y += 4;
  doc.save().roundedRect(x, y, TOTALS_WIDTH, HIGHLIGHT_HEIGHT, 8).fill(COLOR.sunken).restore();
  const highlight = model.payment
    ? { label: 'Balance due', minor: model.payment.balanceDue }
    : { label: model.title === 'Quotation' ? 'Total to pay' : 'Total', minor: model.totals.total };
  drawLabel(doc, highlight.label, x + 14, y + 18, { color: COLOR.ink2 });
  const amount = formatPdfMoney(highlight.minor, model.currency);
  const style: LineStyle = {
    face: PDF_FACES.display,
    size: 17,
    width: TOTALS_WIDTH - 28,
    align: 'right',
  };
  const amountWidth = lineWidth(doc, amount, style);
  const amountRight = x + TOTALS_WIDTH - 14;
  drawLine(doc, amount, x + 14, y + 12, style);
  doc
    .save()
    .rect(amountRight - amountWidth, y + 32, amountWidth, 2.5)
    .fillOpacity(0.35)
    .fill(brandColorOf(model))
    .restore();
  // A declined quote's total is struck through, as on the ticket.
  if (model.status?.tone === 'declined') {
    doc
      .save()
      .moveTo(amountRight - amountWidth, y + 22)
      .lineTo(amountRight, y + 22)
      .lineWidth(1.4)
      .strokeColor(COLOR.ink)
      .stroke()
      .restore();
  }
  return y + HIGHLIGHT_HEIGHT + 22;
}

/** Notes and terms may be long; pdfkit flows them onto new pages by itself. */
function drawTextSection(doc: Doc, title: string, body: string, top: number): number {
  let y = top;
  if (y + 40 > CONTENT_BOTTOM) {
    doc.addPage();
    y = MARGIN.top;
  }
  y = drawLabel(doc, title, MARGIN.left, y) + 4;
  y = text(doc, body, MARGIN.left, y, {
    size: 9,
    color: COLOR.ink2,
    width: CONTENT_WIDTH,
    lineGap: 1.5,
  });
  return y + 16;
}

/** QuoteFlow's mark, an orange ticket with side notches, `size` points square at (x, y). */
function drawMark(doc: Doc, x: number, y: number, size: number): void {
  const s = size / 32;
  doc
    .save()
    .translate(x, y)
    .scale(s)
    .path(
      'M7 2H25A5 5 0 0 1 30 7V12A4 4 0 0 0 30 20V25A5 5 0 0 1 25 30H7A5 5 0 0 1 2 25V20A4 4 0 0 0 2 12V7A5 5 0 0 1 7 2Z',
    )
    .fill(COLOR.signal)
    .circle(15.6, 15.4, 5.2)
    .lineWidth(3.1)
    .stroke(COLOR.ink)
    .moveTo(18.7, 18.6)
    .lineTo(21.9, 21.8)
    .lineCap('round')
    .stroke(COLOR.ink)
    .restore();
}

function drawFooters(doc: Doc, model: PdfDocumentModel): void {
  const range = doc.bufferedPageRange();
  for (let index = range.start; index < range.start + range.count; index += 1) {
    doc.switchToPage(index);
    // Writing below the bottom margin would otherwise make pdfkit start a new page.
    doc.page.margins.bottom = 0;
    const y = PAGE.height - 46;
    dashedRule(doc, y);
    const style = { face: PDF_FACES.mono, size: 7.5, color: COLOR.muted } as const;
    drawMark(doc, MARGIN.left, y + 10, 10);
    drawLine(doc, 'Sent with QuoteFlow', MARGIN.left + 15, y + 11.5, style);
    const centre = `${model.title} ${model.number}`;
    drawLine(
      doc,
      centre,
      MARGIN.left + (CONTENT_WIDTH - lineWidth(doc, centre, style)) / 2,
      y + 11.5,
      style,
    );
    drawLine(doc, `Page ${index - range.start + 1} of ${range.count}`, RIGHT - 160, y + 11.5, {
      ...style,
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

/** Renders a quote or invoice as an A4 PDF, laid out as the job ticket in the app. */
export async function renderDocumentPdf(model: PdfDocumentModel): Promise<Buffer> {
  const doc = createDocument(model);
  const output = toBuffer(doc);

  let y = drawStub(doc, model);
  y = drawParties(doc, model, y);
  y = drawItems(doc, model, y);
  y = drawTotals(doc, model, y);
  if (model.notes || model.terms) {
    dashedRule(doc, y - 6);
    y += 12;
  }
  if (model.notes) y = drawTextSection(doc, 'Notes', model.notes, y);
  if (model.terms) drawTextSection(doc, 'Terms & conditions', model.terms, y);

  drawFooters(doc, model);
  doc.end();
  return output;
}
