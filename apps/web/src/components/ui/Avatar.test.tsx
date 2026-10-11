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

  it('uses a fixed tone and shape when asked', () => {
    const html = renderToStaticMarkup(<Avatar name="Tolu Adebayo" tone="navy" shape="circle" />);

    expect(html).toContain('bg-navy text-on-navy');
    expect(html).toContain('rounded-full');
  });

  it('fills the tile with a brand colour and picks readable letters', () => {
    const html = renderToStaticMarkup(<Avatar name="Lagoon Home" brandColor="#0F6B78" />);

    expect(html).toContain('background-color:#0f6b78');
    expect(html).toContain('color:#ffffff');
    expect(html).not.toContain('bg-avatar-');
  });

  it('never renders an empty tile', () => {
    expect(renderToStaticMarkup(<Avatar name="  " />)).toContain('>?<');
  });
});
