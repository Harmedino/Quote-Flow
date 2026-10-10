import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { StatCard, StatStrip } from './StatStrip';

describe('StatStrip', () => {
  it('lays figures out as a labelled description list', () => {
    const html = renderToStaticMarkup(
      <StatStrip label="This month" columns={3}>
        <StatCard label="Accepted" value="7" caption="Approved" tone="positive" />
        <StatCard label="Outstanding" value="₦830,000" valueTitle="₦830,000.00" />
      </StatStrip>,
    );

    expect(html).toMatch(/^<dl aria-label="This month"/);
    expect(html).toContain('sm:grid-cols-3');
    expect(html).toContain('<dt');
    expect(html).toContain('title="₦830,000.00"');
    expect(html).toContain('text-emerald-700');
    // No caption, no empty line under the figure.
    expect(html.match(/<dd/g)).toHaveLength(3);
  });
});
