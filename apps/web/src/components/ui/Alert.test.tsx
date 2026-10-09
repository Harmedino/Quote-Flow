import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Alert } from './Alert';

describe('Alert', () => {
  it('announces warnings and errors, and only reports other news politely', () => {
    expect(renderToStaticMarkup(<Alert tone="danger">Failed</Alert>)).toMatch(/^<div role="alert"/);
    expect(renderToStaticMarkup(<Alert tone="success">Saved</Alert>)).toMatch(
      /^<div role="status"/,
    );
  });

  it('renders the banner as a slim line with a coloured edge and an action at the end', () => {
    const html = renderToStaticMarkup(
      <Alert variant="banner" tone="warning" action={<a href="/invoices">Review</a>}>
        2 invoices are overdue.
      </Alert>,
    );

    expect(html).toContain('border-l-2');
    expect(html).toContain('border-amber-400');
    expect(html).not.toContain('<svg');
    expect(html.indexOf('overdue')).toBeLessThan(html.indexOf('Review'));
  });
});
