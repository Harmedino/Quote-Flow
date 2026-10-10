import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { testBusiness } from '@/test/fixtures';
import { BusinessSettingsForm } from './BusinessSettingsForm';

function render(): string {
  return renderToStaticMarkup(
    <QueryClientProvider client={new QueryClient()}>
      <BusinessSettingsForm business={testBusiness} canEdit />
    </QueryClientProvider>,
  );
}

/** The text of the hint the currency select is described by. */
function currencyHint(html: string): string {
  const select = /<select[^>]*name="currency"[^>]*>/.exec(html)?.[0] ?? '';
  const describedBy = /aria-describedby="([^"]+)"/.exec(select)?.[1];
  const hint = describedBy && new RegExp(`<p id="${describedBy}"[^>]*>([^<]*)</p>`).exec(html);
  return hint ? (hint[1] ?? '') : '';
}

describe('BusinessSettingsForm', () => {
  it('warns that a new currency changes service prices, not existing documents', () => {
    const hint = currencyHint(render());

    expect(hint).toContain('Existing quotes and invoices keep their currency.');
    expect(hint).toMatch(/Service prices aren’t converted.*new currency.*check them/);
  });
});
