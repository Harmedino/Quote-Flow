import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Avatar } from './Avatar';

describe('Avatar', () => {
  it('shows initials and gives the same name the same colour every time', () => {
    const first = renderToStaticMarkup(<Avatar name="Adaeze Okafor" />);

    expect(first).toContain('>AO<');
    expect(first).toContain('aria-hidden="true"');
    expect(renderToStaticMarkup(<Avatar name="Adaeze Okafor" />)).toBe(first);
  });

  it('uses a fixed tone and tile shape when asked', () => {
    const html = renderToStaticMarkup(<Avatar name="Evergreen" tone="highlight" shape="square" />);

    expect(html).toContain('bg-highlight text-ink');
    expect(html).toContain('rounded-xl');
  });

  it('never renders an empty tile', () => {
    expect(renderToStaticMarkup(<Avatar name="  " />)).toContain('>?<');
  });
});
