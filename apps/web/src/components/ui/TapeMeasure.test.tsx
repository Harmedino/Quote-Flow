import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { TapeMeasure } from './TapeMeasure';

describe('TapeMeasure', () => {
  it('is a labelled meter whose blade length is the value', () => {
    const html = renderToStaticMarkup(<TapeMeasure value={0.808} label="81% collected" />);

    expect(html).toContain('role="meter"');
    expect(html).toContain('aria-label="81% collected"');
    expect(html).toContain('aria-valuenow="80.8"');
    expect(html).toContain('aria-valuetext="81%"');
    expect(html).toContain('--value:80.8%');
  });

  it('clamps values outside 0 to 1', () => {
    expect(renderToStaticMarkup(<TapeMeasure value={1.4} label="Paid" />)).toContain(
      'aria-valuenow="100"',
    );
    expect(renderToStaticMarkup(<TapeMeasure value={-1} label="Paid" />)).toContain(
      'aria-valuenow="0"',
    );
  });
});
