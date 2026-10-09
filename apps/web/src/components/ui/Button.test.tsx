import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Button } from './Button';
import { buttonClasses } from './button-styles';

describe('Button', () => {
  it('defaults to type="button" so it never submits a form by accident', () => {
    expect(renderToStaticMarkup(<Button>Save</Button>)).toMatch(/^<button type="button"/);
    expect(renderToStaticMarkup(<Button type="submit">Save</Button>)).toContain('type="submit"');
  });

  it('marks itself busy and aria-disabled while loading, without native disabled', () => {
    const html = renderToStaticMarkup(<Button loading>Save</Button>);

    expect(html).toContain('aria-busy="true"');
    expect(html).toContain('aria-disabled="true"');
    // Native disabled would drop keyboard focus to <body>.
    expect(html).not.toContain('disabled=""');
    expect(html).toContain('<svg');
  });

  it('still honours an explicit disabled prop', () => {
    expect(renderToStaticMarkup(<Button disabled>Save</Button>)).toContain('disabled=""');
  });

  it('is neither busy nor disabled by default', () => {
    const html = renderToStaticMarkup(<Button>Save</Button>);

    expect(html).not.toContain('aria-busy');
    expect(html).not.toContain('disabled=""');
  });

  it('gives the quiet destructive variant red text with no neutral colour to override it', () => {
    const classes = buttonClasses({ variant: 'danger-ghost' });

    expect(classes).toContain('text-red-700');
    expect(classes).not.toMatch(/text-zinc-/);
  });
});
