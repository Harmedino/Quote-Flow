import { Photo } from '@/components/marketing/Photo';
import { Reveal } from '@/components/marketing/Reveal';
import { SectionHeading } from '@/components/marketing/SectionHeading';
import { PHOTOS } from '@/components/marketing/photos';
import { SITE_CONTAINER } from '@/components/marketing/site-container';
import { cn } from '@/lib/cn';

const PROBLEMS = [
  {
    title: 'Prices get lost',
    body: 'A figure typed into a chat is buried under fifty messages by Friday. The paper copy is somewhere in the van.',
  },
  {
    title: 'Customers go quiet',
    body: 'You can’t tell whether they even opened it, so you don’t know whether to follow up or move on.',
  },
  {
    title: 'No record of the yes',
    body: 'When it’s time to bill, nothing shows what they agreed to, at what price, or on which day.',
  },
];

/** What goes wrong when jobs are priced in chats and on paper, beside a cleaner at work. */
export function ProblemSection() {
  return (
    <section aria-labelledby="problem-title" className="border-t border-line bg-surface">
      <div
        className={cn(
          SITE_CONTAINER,
          'grid items-center gap-12 py-20 sm:py-24 lg:grid-cols-[1fr_0.9fr] lg:gap-16',
        )}
      >
        <div>
          <Reveal>
            <SectionHeading
              id="problem-title"
              eyebrow="Why a ticket"
              title="A price sent on WhatsApp is easy to lose."
              description="Most jobs are still priced in a chat or on paper. QuoteFlow turns each one into a quote with a link, a status and a date."
            />
          </Reveal>
          <ul className="mt-10 border-b-[1.5px] border-dashed border-line-strong">
            {PROBLEMS.map((problem, index) => (
              <li key={problem.title}>
                <Reveal
                  delay={index * 60}
                  className="grid gap-1 border-t-[1.5px] border-dashed border-line-strong py-5 sm:grid-cols-[13rem_1fr] sm:gap-6"
                >
                  <h3 className="text-[1.0625rem] font-[750] text-ink font-stretch-112%">
                    {problem.title}
                  </h3>
                  <p className="text-[0.9375rem] leading-relaxed text-pretty text-ink-2">
                    {problem.body}
                  </p>
                </Reveal>
              </li>
            ))}
          </ul>
        </div>
        <Reveal delay={100}>
          {/* Cropped to 4:5 on desktop, so the 3:2 photo renders about 1.9x wider than its box. */}
          <Photo
            photo={PHOTOS.windowCleaning}
            sizes="(min-width: 1024px) 1000px, 100vw"
            className="aspect-[3/2] object-[50%_40%] lg:aspect-[4/5] lg:object-[68%_45%]"
          />
        </Reveal>
      </div>
    </section>
  );
}
