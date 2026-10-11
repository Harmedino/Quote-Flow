import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { FaqSection } from './Faq';
import { Reveal } from './Reveal';
import { ScreenFrame } from './ScreenFrame';
import { SCREENS, showsDarkCapture } from './screens';

describe('Reveal', () => {
  it('renders its content visible until the browser arms it', () => {
    const html = renderToStaticMarkup(<Reveal delay={60}>Hello</Reveal>);

    expect(html).toContain('Hello');
    expect(html).not.toContain('data-reveal');
    expect(html).toContain('transition-delay:60ms');
  });
});

describe('FaqSection', () => {
  it('ties each question to its collapsed, inert answer', () => {
    const html = renderToStaticMarkup(
      <FaqSection entries={[{ question: 'Is it free?', answer: 'Yes, in early access.' }]} />,
    );

    const controls = /aria-controls="([^"]+)"/.exec(html)?.[1];
    expect(controls).toBeTruthy();
    expect(html).toContain('aria-expanded="false"');
    expect(html).toMatch(new RegExp(`id="${controls}" role="region"[^>]*inert=""`));
    expect(html).toContain('Yes, in early access.');
  });
});

describe('ScreenFrame', () => {
  it('frames a desktop screenshot with its alt text and size', () => {
    const html = renderToStaticMarkup(<ScreenFrame screen={SCREENS.dashboard} />);

    expect(html).toContain('src="/screens/dashboard.webp"');
    expect(html).toContain('width="1440" height="900"');
    expect(html).toContain(`alt="${SCREENS.dashboard.alt}"`);
    expect(html).toContain('quoteflow · dashboard');
  });

  it('shows a desktop screen’s phone version in its place on phones', () => {
    const html = renderToStaticMarkup(<ScreenFrame screen={SCREENS.dashboard} />);

    expect(html).toMatch(/class="[^"]*sm:hidden[^"]*">.*src="\/screens\/dashboard-mobile\.webp"/);
    expect(html).toMatch(/class="[^"]*hidden sm:block[^"]*">.*src="\/screens\/dashboard\.webp"/);
  });

  it('picks the dark capture in dark mode, and keeps a customer’s page light', () => {
    expect(showsDarkCapture(SCREENS.dashboard, 'dark')).toBe(true);
    expect(showsDarkCapture(SCREENS.dashboard, 'light')).toBe(false);
    expect(showsDarkCapture(SCREENS.quoteMobile, 'dark')).toBe(false);
    expect(SCREENS.dashboard.srcDark).toBe('/screens/dashboard-dark.webp');
  });

  it('frames a phone screenshot at the phone size', () => {
    const html = renderToStaticMarkup(<ScreenFrame screen={SCREENS.quoteMobile} />);

    expect(html).toContain('width="390" height="844"');
    expect(html).toContain('loading="lazy"');
  });
});
