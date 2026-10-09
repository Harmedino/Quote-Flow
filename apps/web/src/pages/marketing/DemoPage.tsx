import { DocumentTitle } from '@/components/DocumentTitle';
import { CtaBand } from '@/components/marketing/CtaBand';
import { PageHero } from '@/components/marketing/PageHero';
import { DEMO_TOUR_LABEL } from '@/components/marketing/marketing-nav';
import { useDemoStatus } from '@/components/marketing/use-demo-status';
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
          title="Open a quote as the customer. Then see the owner’s side."
          description="The demo is a sample business in Lagos with a few months of quotes, invoices and payments. Nothing you do reaches a real person, and it starts fresh every day."
        />
      ) : (
        <PageHero
          title="See a quote’s whole life on a phone."
          description="Walk through what a quote looks like on each side, from building it to recording the payment."
        />
      )}

      <section
        aria-label="Try the demo"
        className="mx-auto max-w-6xl px-4 pt-12 sm:px-6 lg:px-8 lg:pt-16"
      >
        <DemoActions status={status} />
      </section>

      <section
        aria-labelledby="tour-title"
        className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20"
      >
        <h2
          id="tour-title"
          className="text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl"
        >
          What you’ll see
        </h2>
        <p className="mt-3 max-w-2xl text-pretty text-stone-600">
          A quote’s whole life in four steps. Pick one to see it on a phone.
        </p>
        <div className="mt-8">
          <DemoTour liveDemo={liveDemo} />
        </div>
      </section>

      <CtaBand title="Ready to send your own?" />
    </>
  );
}
