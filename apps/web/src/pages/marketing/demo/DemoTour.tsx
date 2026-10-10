import { useState } from 'react';
import { ScreenFrame } from '@/components/marketing/ScreenFrame';
import { type AppScreen, SCREENS } from '@/components/marketing/screens';
import { cn } from '@/lib/cn';

interface TourStep {
  title: string;
  body: string;
  /** Said only when the live demo is on. */
  demoNote?: string;
  screen: AppScreen;
}

const STEPS: TourStep[] = [
  {
    title: 'Build a quote',
    body: 'As the owner, tap New quote, pick a customer and add a few services. The total updates as you go.',
    screen: SCREENS.quoteEditorMobile,
  },
  {
    title: 'Share it on WhatsApp',
    body: 'On a quote, tap Share on WhatsApp: the message and the link are written for you.',
    demoNote: 'In the demo, send it to yourself.',
    screen: SCREENS.quoteShareMobile,
  },
  {
    title: 'Your customer accepts',
    body: 'The link opens the customer’s page with the business’s details and the total. One tap accepts it.',
    screen: SCREENS.quoteMobile,
  },
  {
    title: 'Invoice it and record the payment',
    body: 'Convert the accepted quote to an invoice, then record a payment. The invoice link shows what’s paid and what’s still due.',
    screen: SCREENS.invoiceMobile,
  },
];

const CAPTION = 'Screenshots from the demo business.';

/**
 * The four steps of a quote, each with a screenshot from the demo business on a phone: beside
 * the steps on wide screens, and under the chosen step on phones, where it stays in view.
 */
export function DemoTour({ liveDemo }: { liveDemo: boolean }) {
  const [current, setCurrent] = useState(0);
  const screen = STEPS[current]?.screen;

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-16">
      <ol className="space-y-2">
        {STEPS.map((entry, index) => {
          const active = index === current;
          return (
            <li key={entry.title}>
              <button
                type="button"
                onClick={() => setCurrent(index)}
                aria-pressed={active}
                className={cn(
                  'flex w-full gap-4 rounded-2xl border p-4 text-left transition-colors sm:p-5',
                  active
                    ? 'border-stone-900 bg-surface dark:border-stone-500'
                    : 'border-transparent hover:bg-surface',
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    'font-display text-2xl font-semibold',
                    active ? 'text-stone-900' : 'text-stone-400',
                  )}
                >
                  {index + 1}
                </span>
                <span>
                  <span className="block text-lg font-semibold text-stone-900">{entry.title}</span>
                  <span className="mt-1 block text-[0.9375rem] leading-relaxed text-pretty text-stone-600">
                    {entry.body}
                    {liveDemo && entry.demoNote && ` ${entry.demoNote}`}
                  </span>
                </span>
              </button>
              {active && (
                <figure className="mx-auto mt-4 mb-6 w-full max-w-[13rem] animate-fade-in lg:hidden">
                  <ScreenFrame screen={entry.screen} />
                  <figcaption className="mt-3 text-center text-xs text-stone-600">
                    {CAPTION}
                  </figcaption>
                </figure>
              )}
            </li>
          );
        })}
      </ol>
      <div className="hidden lg:block">
        <figure className="sticky top-24 mx-auto w-full max-w-[18rem]">
          {/* Keyed so each new screenshot fades in. */}
          <div key={current} className="animate-fade-in">
            {screen && <ScreenFrame screen={screen} />}
          </div>
          <figcaption className="mt-3 text-center text-xs text-stone-600">{CAPTION}</figcaption>
        </figure>
      </div>
    </div>
  );
}
