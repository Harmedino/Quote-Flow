import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { StatCard, StatStrip } from './StatStrip';

describe('StatStrip', () => {
  it('lays figures out as a labelled description list on one ticket', () => {
    const html = renderToStaticMarkup(
      <StatStrip label="This month" columns={3}>
        <StatCard label="Accepted" value="7" unit="quotes" caption="Approved" tone="positive" />
        <StatCard label="Outstanding" value="₦830,000" valueTitle="₦830,000.00" />
      </StatStrip>,
    );

    expect(html).toMatch(/^<dl aria-label="This month"/);
    expect(html).toContain('ticket-row');
    expect(html).toContain('<dt');
    expect(html).toContain('title="₦830,000.00"');
    expect(html).toContain('text-success');
    expect(html).toContain('quotes</span></dd>');
    // No caption, no empty line under the figure.
    expect(html.match(/<dd/g)).toHaveLength(3);
  });

  it('splits four figures into one plus three below the desktop width', () => {
    const html = renderToStaticMarkup(
      <StatStrip>
        <StatCard label="Outstanding" value="₦240,263" />
      </StatStrip>,
    );

    expect(html).toContain('max-lg:ticket-split lg:ticket-row');
  });
});
