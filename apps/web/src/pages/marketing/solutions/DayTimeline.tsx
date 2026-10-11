import { Reveal } from '@/components/marketing/Reveal';
import { ScreenFrame } from '@/components/marketing/ScreenFrame';
import { SectionHeading } from '@/components/marketing/SectionHeading';
import { SCREENS } from '@/components/marketing/screens';
import { SITE_CONTAINER } from '@/components/marketing/site-container';
import { cn } from '@/lib/cn';
import { naira } from '../sample-money';

const TIMELINE = [
  {
    time: '08:10',
    title: 'Funmi looks over a flat in Ikoyi',
    body: 'She walks through with the owner and counts the rooms and windows.',
  },
  {
    time: '08:40',
    title: 'The quote is out before she leaves',
    body: 'Three services from her list and a 5% discount. She taps Share and it goes to the customer on WhatsApp.',
  },
  {
    time: '11:25',
    title: 'The customer opens it',
    body: 'When Funmi next checks, the quote shows as viewed, with the time.',
  },
  {
    time: '13:05',
    title: 'Accepted, no account needed',
    body: 'The customer taps Accept on her phone. The quote is marked accepted, with the date and time.',
  },
  {
    time: '17:30',
    title: 'Job done, invoice sent',
    body: 'Funmi turns the quote into an invoice and shares its link on WhatsApp.',
  },
  {
    time: '19:15',
    title: 'Part payment in',
    body: `A transfer of ${naira(60_000)} arrives. She records it, and the rest shows as the balance due.`,
  },
];

/** One working day for a cleaning business, from the viewing to the first payment, on a ruler. */
export function DayTimeline() {
  return (
    <section aria-labelledby="day-title" className="mb-14 border-y border-line bg-surface sm:mb-22">
      <div
        className={cn(
          SITE_CONTAINER,
          'grid items-center gap-14 py-20 sm:py-28 lg:grid-cols-[1.1fr_0.9fr]',
        )}
      >
        <div>
          <SectionHeading
            id="day-title"
            eyebrow="A day with QuoteFlow"
            title="One cleaning job, from viewing to payment."
          />
          <ol className="relative mt-10 space-y-8 border-l-2 border-dashed border-line-strong pl-7">
            {TIMELINE.map((entry, index) => (
              <li key={entry.time} className="relative">
                <Reveal delay={index * 50}>
                  <span
                    aria-hidden="true"
                    className="absolute top-1 -left-[35px] size-3 rotate-45 bg-primary ring-4 ring-surface"
                  />
                  <p className="font-mono text-xs font-semibold text-primary-ink">{entry.time}</p>
                  <h3 className="mt-1 text-lg font-[750] text-ink font-stretch-112%">
                    {entry.title}
                  </h3>
                  <p className="mt-1 text-[0.9375rem] text-pretty text-ink-2">{entry.body}</p>
                </Reveal>
              </li>
            ))}
          </ol>
        </div>
        <Reveal delay={100} className="mx-auto w-full max-w-[18.75rem]">
          <ScreenFrame screen={SCREENS.dashboardMobile} />
        </Reveal>
      </div>
    </section>
  );
}
