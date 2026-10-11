import { DocumentTitle } from '@/components/DocumentTitle';
import { CtaBand } from '@/components/marketing/CtaBand';
import { PageHero } from '@/components/marketing/PageHero';
import { SectionHeading } from '@/components/marketing/SectionHeading';
import { DEMO_TOUR_LABEL } from '@/components/marketing/marketing-nav';
import { SITE_CONTAINER } from '@/components/marketing/site-container';
import { useDemoStatus } from '@/components/marketing/use-demo-status';
import { cn } from '@/lib/cn';
import { DemoActions } from './demo/DemoActions';
import { DemoTour } from './demo/DemoTour';

/** The live demo: open a quote as its customer, then the same business as its owner. */
export default function DemoPage() {
  const status = useDemoStatus();
  const liveDemo = status !== 'unavailable';

  return (
    <>
      <DocumentTitle title={liveDemo ? 'Live demo' : DEMO_TOUR_LABEL} />
      {liveDemo ? (
        <PageHero
          eyebrow="Live demo"
          title="Open a quote as the customer. Then see the owner’s side."
          description="The demo is a sample business in Lagos with a few months of quotes, invoices and payments. Nothing you do reaches a real person, and it starts fresh every day."
        />
      ) : (
        <PageHero
          eyebrow={DEMO_TOUR_LABEL}
          title="See a quote’s whole life on a phone."
          description="Walk through what a quote looks like on each side, from building it to recording the payment."
        />
      )}

      <section aria-label="Try the demo" className={cn(SITE_CONTAINER, 'pt-12 sm:pt-16')}>
        <DemoActions status={status} />
      </section>

      <section aria-labelledby="tour-title" className={cn(SITE_CONTAINER, 'py-20 sm:py-24')}>
        <SectionHeading
          id="tour-title"
          eyebrow="The tour"
          title="What you’ll see"
          description="A quote’s whole life in four steps. Pick one to see it on a phone."
        />
        <div className="mt-10">
          <DemoTour liveDemo={liveDemo} />
        </div>
      </section>

      <CtaBand title="Ready to send your own?" />
    </>
  );
}
