import type { PublicBusinessDto } from '@quoteflow/shared';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { SalesDocument, type SalesDocumentProps } from './SalesDocument';

const business: PublicBusinessDto = {
  name: 'Sparkle Cleaning Co.',
  logoUrl: null,
  email: 'hello@sparkle.example',
  phone: '+234 801 234 5678',
  website: 'https://sparkle.example',
  address: { line1: '12 Admiralty Way', city: 'Lekki' },
  brandColor: '#1d4ed8',
};

const props: SalesDocumentProps = {
  kind: 'quote',
  number: 'QT-0042',
  business,
  customer: {
    name: 'Olivia Harper',
    email: 'olivia@example.com',
    phone: null,
    company: 'Harper Studio',
    address: {},
  },
  currency: 'USD',
  issueDate: '2026-10-01',
  secondaryDate: { label: 'Valid until', value: '2026-10-15' },
  items: [
    {
      serviceId: null,
      name: 'Deep cleaning',
      description: 'Kitchen and two bathrooms',
      quantity: 2.5,
      unit: 'hour',
      unitPrice: 5_500,
      amount: 13_750,
    },
  ],
  discount: { type: 'percentage', value: 10 },
  taxRate: 7.5,
  totals: { subtotal: 13_750, discount: 1_375, tax: 928, total: 13_303 },
  notes: 'Thanks for choosing us.',
  terms: null,
};

describe('SalesDocument', () => {
  it('renders a quote with its business, customer, dates, items and totals', () => {
    const html = renderToStaticMarkup(<SalesDocument {...props} status={<span>Viewed</span>} />);

    expect(html).toContain('Quotation');
    expect(html).toContain('QT-0042');
    expect(html).toContain('Prepared for');
    expect(html).toContain('Harper Studio');
    expect(html).toContain('Oct 15, 2026');
    expect(html).toContain('Kitchen and two bathrooms');
    expect(html).toContain('$55.00 / hour');
    expect(html).toContain('Discount (10%)');
    expect(html).toContain('−$13.75');
    expect(html).toContain('Tax (7.5%)');
    expect(html).toContain('$133.03');
    expect(html).toContain('Viewed');
    expect(html).toContain('Thanks for choosing us.');
    expect(html).not.toContain('Terms &amp; conditions');
    expect(html).not.toContain('Balance due');
    // The business's brand color drives the accent.
    expect(html).toContain('--doc-accent:#1d4ed8');
    expect(html).toContain('>SC<');
  });

  it('renders an invoice with the amount paid and balance due', () => {
    const html = renderToStaticMarkup(
      <SalesDocument
        {...props}
        kind="invoice"
        number="INV-0007"
        secondaryDate={{ label: 'Due date', value: '2026-10-20' }}
        discount={null}
        taxRate={0}
        totals={{ subtotal: 13_750, discount: 0, tax: 0, total: 13_750 }}
        amountPaid={5_000}
        balanceDue={8_750}
        terms="Due on receipt."
      />,
    );

    expect(html).toContain('Invoice');
    expect(html).toContain('Bill to');
    expect(html).toContain('Amount paid');
    expect(html).toContain('−$50.00');
    expect(html).toContain('Balance due');
    expect(html).toContain('$87.50');
    expect(html).toContain('Terms &amp; conditions');
    expect(html).not.toContain('Discount');
    expect(html).not.toContain('Tax (');
  });

  it('shows the logo when there is one and never links unsafe URLs', () => {
    const html = renderToStaticMarkup(
      <SalesDocument
        {...props}
        business={{ ...business, logoUrl: 'https://cdn.example/logo.png', website: 'javascript:x' }}
      />,
    );

    expect(html).toContain('src="https://cdn.example/logo.png"');
    expect(html).not.toContain('javascript:');
  });
});
