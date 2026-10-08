import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Button } from './Button';

describe('Button', () => {
  it('defaults to type="button" so it never submits a form by accident', () => {
    expect(renderToStaticMarkup(<Button>Save</Button>)).toMatch(/^<button type="button"/);
    expect(renderToStaticMarkup(<Button type="submit">Save</Button>)).toContain('type="submit"');
  });

  it('marks itself busy and disabled while loading', () => {
    const html = renderToStaticMarkup(<Button loading>Save</Button>);

    expect(html).toContain('aria-busy="true"');
    expect(html).toContain('disabled=""');
    expect(html).toContain('<svg');
  });

  it('is neither busy nor disabled by default', () => {
    const html = renderToStaticMarkup(<Button>Save</Button>);

    expect(html).not.toContain('aria-busy');
    expect(html).not.toContain('disabled=""');
  });
});
