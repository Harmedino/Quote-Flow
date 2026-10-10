import { ArrowRight, Check } from 'lucide-react';
import { paths } from '@/app/paths';
import { DocumentTitle } from '@/components/DocumentTitle';
import { CtaBand } from '@/components/marketing/CtaBand';
import { NumberedSteps } from '@/components/marketing/NumberedSteps';
import { PageHero } from '@/components/marketing/PageHero';
import { Photo } from '@/components/marketing/Photo';
import { Reveal } from '@/components/marketing/Reveal';
import { PHOTOS } from '@/components/marketing/photos';
import { useLiveDemo } from '@/components/marketing/use-demo-status';
import { ButtonLink } from '@/components/ui/ButtonLink';
import { cn } from '@/lib/cn';
import { DEMO_ITEM, EVERYTHING, JOURNEY, NOT_YET, SIDES, YOUR_DATA } from './about/about-content';

function Bullet({ muted = false }: { muted?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn('mt-2 size-1.5 shrink-0 rounded-full', muted ? 'bg-stone-400' : 'bg-brand-600')}
    />
  );
}

const sectionClasses = 'mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8';
const h2Classes = 'text-3xl font-semibold tracking-tight text-balance text-stone-900 sm:text-4xl';

/** What QuoteFlow is and everything it does, in plain words. */
export default function AboutPage() {
  const liveDemo = useLiveDemo();

  return (
    <>
      <DocumentTitle title="About" />
      <PageHero
        title="About QuoteFlow"
        description="QuoteFlow is quoting, invoicing and payment tracking for small businesses that price a job before they do it: cleaners, plumbers, electricians, AC and solar technicians, painters, carpenters, decorators, caterers, photographers and makeup artists. It replaces the price typed into a chat, the paper estimate and the notebook of who still owes you with one quote your customer can accept and one place to see what’s been paid."
      >
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink
            to={liveDemo ? paths.demo : paths.register}
            variant="highlight"
            size="lg"
            shape="pill"
            className="group"
          >
            {liveDemo ? 'Try the demo' : 'Start free'}
            <ArrowRight
              aria-hidden="true"
              className="transition-transform group-hover:translate-x-0.5"
            />
          </ButtonLink>
          <ButtonLink to={paths.howItWorks} variant="on-ink" size="lg" shape="pill">
            How it works
          </ButtonLink>
        </div>
      </PageHero>

      <section aria-labelledby="sides-title" className={sectionClasses}>
        <h2 id="sides-title" className={h2Classes}>
          Two sides of every quote
        </h2>
        <p className="mt-3 max-w-2xl text-pretty text-stone-600">
          Your customer sees one clean page. You see everything around it.
        </p>
        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          <Reveal className="h-full">
            {/* Stretched to the cards' height on desktop, so the 3:2 photo is cropped to about 4:5. */}
            <Photo
              photo={PHOTOS.ownerWithPhone}
              sizes="(min-width: 1024px) 560px, 100vw"
              className="aspect-[3/2] object-[50%_40%] lg:aspect-auto lg:h-full"
            />
          </Reveal>
          {SIDES.map((side, index) => (
            <Reveal key={side.who} delay={(index + 1) * 60} className="h-full">
              <article className="h-full rounded-3xl border border-stone-200 bg-surface p-6">
                <h3 className="text-xl font-semibold text-stone-900">{side.who}</h3>
                <p className="mt-1 text-sm text-stone-600">{side.lead}</p>
                <ul className="mt-5 space-y-2.5">
                  {side.points.map((point) => (
                    <li
                      key={point}
                      className="flex gap-2.5 text-[0.9375rem] leading-snug text-stone-700"
                    >
                      <Check aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-brand-600" />
                      {point}
                    </li>
                  ))}
                </ul>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      <section aria-labelledby="journey-title" className="bg-surface">
        <div className={sectionClasses}>
          <h2 id="journey-title" className={h2Classes}>
            A quote, start to finish
          </h2>
          <NumberedSteps steps={JOURNEY} />
        </div>
      </section>

      <section aria-labelledby="everything-title" className={sectionClasses}>
        <h2 id="everything-title" className={h2Classes}>
          Everything it does
        </h2>
        <div className="mt-10 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {EVERYTHING.map((group) => (
            <div key={group.group}>
              <h3 className="text-sm font-semibold tracking-wider text-stone-600 uppercase">
                {group.group}
              </h3>
              <ul className="mt-3 space-y-2">
                {group.items
                  .filter((item) => liveDemo || item !== DEMO_ITEM)
                  .map((item) => (
                    <li key={item} className="flex gap-2.5 text-[0.9375rem] text-stone-800">
                      <Bullet />
                      {item}
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-stone-200/70">
        <div className={`${sectionClasses} grid gap-12 lg:grid-cols-2`}>
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl">
              What it doesn’t do yet
            </h2>
            <p className="mt-3 text-stone-600">Better to say it plainly:</p>
            <ul className="mt-4 space-y-2">
              {NOT_YET.map((item) => (
                <li key={item} className="flex gap-2.5 text-[0.9375rem] text-stone-700">
                  <Bullet muted />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl">
              Your data
            </h2>
            <ul className="mt-4 space-y-3 text-[0.9375rem] leading-relaxed text-pretty text-stone-700">
              {YOUR_DATA.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <CtaBand
        title="See it with a real quote."
        description={
          liveDemo
            ? 'Open the demo quote as the customer, or set up your business and send one to your own phone.'
            : 'Set up your business and send a quote to your own phone. It’s free while we’re in early access.'
        }
      />
    </>
  );
}
