import { Reveal } from '@/components/marketing/Reveal';
import { ScreenFrame } from '@/components/marketing/ScreenFrame';
import { SectionHeading } from '@/components/marketing/SectionHeading';
import { SCREENS } from '@/components/marketing/screens';
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

/** One working day for a cleaning business, from the viewing to the first payment. */
export function DayTimeline() {
  return (
    <section aria-labelledby="day-title" className="border-t border-stone-200/70">
      <div className="mx-auto grid max-w-6xl items-center gap-14 px-4 py-20 sm:px-6 sm:py-28 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
        <div>
          <SectionHeading
            id="day-title"
            eyebrow="A day with QuoteFlow"
            title="One cleaning job, from viewing to payment."
          />
          <ol className="relative mt-10 space-y-8 border-l border-stone-300 pl-7">
            {TIMELINE.map((entry, index) => (
              <li key={entry.time} className="relative">
                <Reveal delay={index * 50}>
                  <span
                    aria-hidden="true"
                    className="absolute top-1 -left-[33px] size-3 rounded-full border-2 border-paper bg-brand-600 ring-4 ring-brand-100"
                  />
                  <p className="font-mono text-xs font-semibold text-brand-700">{entry.time}</p>
                  <h3 className="mt-1 text-lg font-semibold text-stone-900">{entry.title}</h3>
                  <p className="mt-1 text-[0.9375rem] text-pretty text-stone-600">{entry.body}</p>
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
