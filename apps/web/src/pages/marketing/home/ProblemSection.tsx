import { Photo } from '@/components/marketing/Photo';
import { Reveal } from '@/components/marketing/Reveal';
import { PHOTOS } from '@/components/marketing/photos';

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

/** What goes wrong when jobs are priced in chats and on paper. */
export function ProblemSection() {
  return (
    <section
      aria-labelledby="problem-title"
      className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8"
    >
      <Reveal>
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <h2
            id="problem-title"
            className="max-w-md text-3xl leading-tight font-semibold tracking-tight text-balance text-stone-900 sm:text-4xl"
          >
            A price sent on WhatsApp is easy to lose.
          </h2>
          <p className="max-w-sm text-[0.9375rem] text-pretty text-stone-600">
            Most jobs are still priced in a chat or on paper. QuoteFlow turns each one into a quote
            with a link, a status and a date.
          </p>
        </div>
      </Reveal>
      <ul className="mt-10 grid gap-x-8 gap-y-8 sm:grid-cols-3">
        {PROBLEMS.map((problem, index) => (
          <li key={problem.title}>
            <Reveal delay={index * 60} className="border-t border-stone-300 pt-4">
              <h3 className="text-base font-semibold text-stone-900">{problem.title}</h3>
              <p className="mt-1 text-[0.9375rem] leading-relaxed text-pretty text-stone-600">
                {problem.body}
              </p>
            </Reveal>
          </li>
        ))}
      </ul>
      <Reveal>
        <Photo
          photo={PHOTOS.windowCleaning}
          sizes="(min-width: 1152px) 1088px, 100vw"
          className="mt-12 aspect-[3/2] object-[50%_40%] sm:aspect-[16/9]"
        />
      </Reveal>
    </section>
  );
}
