import { CURRENCY_CODES } from '@quoteflow/shared';
import { Reveal } from '@/components/marketing/Reveal';
import { SectionHeading } from '@/components/marketing/SectionHeading';
import { useLiveDemo } from '@/components/marketing/use-demo-status';

const DETAILS: { title: string; body: string; liveDemoOnly?: boolean }[] = [
  {
    title: 'Currencies',
    body: `${CURRENCY_CODES.length} of them, including ₦, GH₵, KSh, R, $, £ and €, set per business.`,
  },
  {
    title: 'Time zones',
    body: 'Expiry dates and overdue invoices follow your business’s own time zone.',
  },
  {
    title: 'Your numbering',
    body: 'Quotes and invoices numbered in order, with a prefix you choose.',
  },
  {
    title: 'Tax and discounts',
    body: 'A default tax rate, and a percentage or fixed discount on any quote.',
  },
  { title: 'PDFs', body: 'Any quote or invoice as a PDF, ready to print or attach to a message.' },
  { title: 'Your colour', body: 'Your brand colour on the customer’s page and on your PDFs.' },
  {
    title: 'Notes and terms',
    body: 'Defaults for quotes and invoices, which you can change on each one.',
  },
  { title: 'Repeat jobs', body: 'Duplicate an old quote to price the same job again in seconds.' },
  {
    title: 'Private links',
    body: 'Each link is long and random, so nobody can guess their way to a quote.',
  },
  { title: 'Dark mode', body: 'Follows your phone’s setting, or switch it yourself.' },
  {
    title: 'Built for phones',
    body: 'An app-style layout with a bottom tab bar on small screens.',
  },
  {
    title: 'One-click demo',
    body: 'Look around a sample business with real-looking data, no sign-up.',
    liveDemoOnly: true,
  },
];

export function SmallerThings() {
  const liveDemo = useLiveDemo();
  const details = DETAILS.filter((item) => liveDemo || !item.liveDemoOnly);
  return (
    <section id="details" aria-labelledby="details-title" className="border-t border-stone-200/70">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <SectionHeading id="details-title" title="And the smaller things" />
        <ul className="mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {details.map((item, index) => (
            <li key={item.title}>
              <Reveal delay={(index % 3) * 50} className="border-t border-stone-200 pt-4">
                <h3 className="text-base font-semibold text-stone-900">{item.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-pretty text-stone-600">
                  {item.body}
                </p>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
