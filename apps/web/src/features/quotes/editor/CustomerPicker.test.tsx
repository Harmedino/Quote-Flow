import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { CustomerPicker, type CustomerPickerProps } from './CustomerPicker';

const customer = {
  id: '665f1c2b9a1e4b0012345678',
  name: 'Olivia Harper',
  email: 'olivia@example.com',
  phone: null,
  company: 'Harper Studio',
  address: {},
};

const SENT_ERROR = 'This quote has already been sent to its customer.';

function render(props: Partial<CustomerPickerProps>): string {
  return renderToStaticMarkup(
    <QueryClientProvider client={new QueryClient()}>
      <CustomerPicker inputId="customer" customer={customer} onChange={() => {}} {...props} />
    </QueryClientProvider>,
  );
}

function tagWith(html: string, text: string): string {
  return new RegExp(`<[^>]*>(?:(?!<)[\\s\\S])*${text}`).exec(html)?.[0] ?? '';
}

describe('CustomerPicker with a customer selected', () => {
  it('shows an error next to the card and marks "Change" invalid, so it gets focus', () => {
    const html = render({ error: SENT_ERROR });

    expect(html).toContain(`id="customer-error"`);
    expect(html).toContain(SENT_ERROR);
    const change = tagWith(html, 'Change');
    expect(change).toContain('aria-invalid="true"');
    expect(change).toContain('aria-describedby="customer-error"');
  });

  it('offers "Change" without marking anything invalid when there is no error', () => {
    const html = render({});

    expect(html).toContain('Change');
    expect(html).not.toContain('aria-invalid');
    expect(html).not.toContain('customer-error');
  });

  it('shows the locked hint instead of "Change"', () => {
    const html = render({ lockedHint: 'Duplicate it to quote someone else.' });

    expect(html).toContain('Duplicate it to quote someone else.');
    expect(html).not.toContain('Change');
    expect(html).not.toContain('tabindex');
  });

  it('makes a locked card focusable and invalid when it has an error', () => {
    const html = render({ lockedHint: 'Duplicate it to quote someone else.', error: SENT_ERROR });

    const card = /<div[^>]*aria-invalid="true"[^>]*>/.exec(html)?.[0] ?? '';
    expect(card).toContain('tabindex="-1"');
    expect(card).toContain('aria-describedby="customer-error"');
    expect(html).toContain(SENT_ERROR);
  });
});
