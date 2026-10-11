import { CURRENCY_CODES } from '@quoteflow/shared';
import { Reveal } from '@/components/marketing/Reveal';
import { SectionHeading } from '@/components/marketing/SectionHeading';
import { SITE_CONTAINER } from '@/components/marketing/site-container';
import { useLiveDemo } from '@/components/marketing/use-demo-status';
import { cn } from '@/lib/cn';

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
    <section
      id="details"
      aria-labelledby="details-title"
      className="mb-14 border-y border-line bg-surface sm:mb-22"
    >
      <div className={cn(SITE_CONTAINER, 'py-20 sm:py-28')}>
        <SectionHeading id="details-title" eyebrow="Also included" title="And the smaller things" />
        <ul className="mt-12 grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
          {details.map((item, index) => (
            <li key={item.title}>
              <Reveal
                delay={(index % 3) * 50}
                className="h-full border-t-[1.5px] border-dashed border-line-strong pt-4"
              >
                <h3 className="flex items-center gap-2.5 text-base font-[750] text-ink font-stretch-112%">
                  <span aria-hidden="true" className="size-[7px] shrink-0 rotate-45 bg-primary" />
                  {item.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-pretty text-ink-2">{item.body}</p>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
