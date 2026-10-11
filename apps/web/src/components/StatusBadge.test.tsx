import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { InvoiceStatusBadge, QuoteStatusBadge } from './StatusBadge';

describe('status badges', () => {
  it('shows a status as a hang-tag with its word', () => {
    const html = renderToStaticMarkup(<QuoteStatusBadge status="rejected" />);

    expect(html).toContain('hang-tag');
    expect(html).toContain('text-declined');
    expect(html).toContain('>Declined<');
  });

  it('keeps a viewed quote apart from an accepted one', () => {
    expect(renderToStaticMarkup(<QuoteStatusBadge status="viewed" />)).toContain('text-viewed');
    expect(renderToStaticMarkup(<QuoteStatusBadge status="accepted" />)).toContain('text-accepted');
  });

  it('makes the two money outcomes solid', () => {
    expect(renderToStaticMarkup(<InvoiceStatusBadge status="overdue" />)).toContain(
      'bg-overdue-fill text-white',
    );
    expect(renderToStaticMarkup(<InvoiceStatusBadge status="paid" />)).toContain(
      'bg-paid-fill text-white',
    );
    expect(renderToStaticMarkup(<InvoiceStatusBadge status="partially_paid" />)).toContain(
      'bg-partial-tint',
    );
  });
});
