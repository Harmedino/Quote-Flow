import { ArrowRight } from 'lucide-react';
import { paths } from '@/app/paths';
import { DocumentTitle } from '@/components/DocumentTitle';
import { BulletList } from '@/components/marketing/BulletList';
import { CtaBand } from '@/components/marketing/CtaBand';
import { NumberedSteps } from '@/components/marketing/NumberedSteps';
import { PageHero } from '@/components/marketing/PageHero';
import { Photo } from '@/components/marketing/Photo';
import { Reveal } from '@/components/marketing/Reveal';
import { SectionHeading } from '@/components/marketing/SectionHeading';
import { PHOTOS } from '@/components/marketing/photos';
import { SITE_CONTAINER } from '@/components/marketing/site-container';
import { useLiveDemo } from '@/components/marketing/use-demo-status';
import { ButtonLink } from '@/components/ui/ButtonLink';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/cn';
import { DEMO_ITEM, EVERYTHING, JOURNEY, NOT_YET, SIDES, YOUR_DATA } from './about/about-content';

const SECTION = cn(SITE_CONTAINER, 'py-20 sm:py-24');

/** What QuoteFlow is and everything it does, in plain words. */
export default function AboutPage() {
  const liveDemo = useLiveDemo();

  return (
    <>
      <DocumentTitle title="About" />
      <PageHero
        eyebrow="About QuoteFlow"
        title="For businesses that price the job before they do it."
        description="QuoteFlow is quoting, invoicing and payment tracking for cleaners, plumbers, electricians, AC and solar technicians, painters, carpenters, decorators, caterers, photographers and makeup artists. It replaces the price typed into a chat, the paper estimate and the notebook of who still owes you with one quote your customer can accept and one place to see what’s been paid."
      >
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <ButtonLink
            to={liveDemo ? paths.demo : paths.register}
            variant="primary"
            size="lg"
            className="group"
          >
            {liveDemo ? 'Try the demo' : 'Start free'}
            <ArrowRight
              aria-hidden="true"
              className="transition-transform group-hover:translate-x-0.5"
            />
          </ButtonLink>
          <ButtonLink to={paths.howItWorks} variant="outline" size="lg">
            How it works
          </ButtonLink>
        </div>
      </PageHero>

      <section aria-labelledby="sides-title" className={SECTION}>
        <SectionHeading
          id="sides-title"
          eyebrow="Two sides"
          title="Two sides of every quote"
          description="Your customer sees one clean page. You see everything around it."
        />
        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          <Reveal className="h-full">
            {/* Stretched to the tickets' height on desktop, so the 3:2 photo is cropped to about 4:5. */}
            <Photo
              photo={PHOTOS.ownerWithPhone}
              sizes="(min-width: 1024px) 760px, 100vw"
              className="aspect-[3/2] object-[50%_40%] lg:aspect-auto lg:h-full"
            />
          </Reveal>
          {SIDES.map((side, index) => (
            <Reveal key={side.who} delay={(index + 1) * 60} className="h-full">
              <article aria-labelledby={`side-${index}`} className="h-full lift ticket-col">
                <div className="bg-primary-tint px-6 pt-5 pb-5">
                  <h3
                    id={`side-${index}`}
                    className="text-xl font-[780] tracking-[-0.015em] text-ink font-stretch-112%"
                  >
                    {side.who}
                  </h3>
                  <p className="mt-1 text-sm text-ink-2">{side.lead}</p>
                </div>
                <div className="flex-1 px-6 pt-5 pb-6">
                  <BulletList items={side.points} />
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      <section aria-labelledby="journey-title" className="border-y border-line bg-surface">
        <div className={SECTION}>
          <SectionHeading
            id="journey-title"
            eyebrow="The journey"
            title="A quote, start to finish"
          />
          <NumberedSteps steps={JOURNEY} />
        </div>
      </section>

      <section aria-labelledby="everything-title" className={SECTION}>
        <SectionHeading id="everything-title" eyebrow="The full list" title="Everything it does" />
        <div className="mt-12 grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {EVERYTHING.map((group, index) => (
            <Reveal
              key={group.group}
              delay={(index % 3) * 50}
              className="border-t-[1.5px] border-dashed border-line-strong pt-5"
            >
              <h3 className="text-lg font-[750] text-ink font-stretch-112%">{group.group}</h3>
              <BulletList
                items={group.items.filter((item) => liveDemo || item !== DEMO_ITEM)}
                className="mt-4"
              />
            </Reveal>
          ))}
        </div>
      </section>

      <section aria-label="Limits and your data" className={cn(SITE_CONTAINER, 'pb-20 sm:pb-24')}>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-6 sm:p-8">
            <h2 className="text-2xl font-[800] tracking-[-0.02em] text-ink font-stretch-118% sm:text-[1.75rem]">
              What it doesn’t do yet
            </h2>
            <p className="mt-2 text-ink-2">Better to say it plainly:</p>
            <BulletList items={NOT_YET} tone="muted" className="mt-5" />
          </Card>
          <Card className="p-6 sm:p-8">
            <h2 className="text-2xl font-[800] tracking-[-0.02em] text-ink font-stretch-118% sm:text-[1.75rem]">
              Your data
            </h2>
            <ul className="mt-5 text-[0.9375rem] leading-relaxed text-pretty text-ink-2">
              {YOUR_DATA.map((item) => (
                <li
                  key={item}
                  className="border-b-[1.5px] border-dashed border-line-strong py-3 first:pt-0 last:border-b-0 last:pb-0"
                >
                  {item}
                </li>
              ))}
            </ul>
          </Card>
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
