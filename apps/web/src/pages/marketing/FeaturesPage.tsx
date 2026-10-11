import { paths } from '@/app/paths';
import { DocumentTitle } from '@/components/DocumentTitle';
import { BulletList } from '@/components/marketing/BulletList';
import { CtaBand } from '@/components/marketing/CtaBand';
import { PageHero } from '@/components/marketing/PageHero';
import { Reveal } from '@/components/marketing/Reveal';
import { PhonePair, ScreenFrame } from '@/components/marketing/ScreenFrame';
import { SectionHeading } from '@/components/marketing/SectionHeading';
import { SITE_CONTAINER } from '@/components/marketing/site-container';
import { useLiveDemo } from '@/components/marketing/use-demo-status';
import { cn } from '@/lib/cn';
import { FeatureNav } from './features/FeatureNav';
import { FEATURE_SECTIONS, type FeatureSection } from './features/feature-sections';
import { SmallerThings } from './features/SmallerThings';
import { useActiveSection } from './features/use-active-section';

const SECTION_IDS = FEATURE_SECTIONS.map((section) => section.id);

function FeatureVisual({ visual }: { visual: FeatureSection['visual'] }) {
  return 'device' in visual ? <ScreenFrame screen={visual} /> : <PhonePair screens={visual} />;
}

export default function FeaturesPage() {
  const active = useActiveSection(SECTION_IDS);
  const liveDemo = useLiveDemo();

  return (
    <>
      <DocumentTitle title="Features" />
      <PageHero
        eyebrow="Features"
        title="What’s in QuoteFlow"
        description="A quote builder, quotes your customers answer from their phone, invoices and payment tracking, your customers and price list, and a dashboard that shows who still owes you. Here’s how each part works."
      />
      <FeatureNav sections={FEATURE_SECTIONS} active={active} />

      <div className={cn(SITE_CONTAINER, 'space-y-24 py-20 sm:space-y-32 sm:py-28')}>
        {FEATURE_SECTIONS.map((section, index) => (
          <section
            key={section.id}
            id={section.id}
            aria-labelledby={`${section.id}-title`}
            className="grid scroll-mt-36 items-center gap-10 lg:grid-cols-[1fr_1.15fr] lg:gap-16 xl:scroll-mt-40"
          >
            <Reveal className={cn(index % 2 === 1 && 'lg:order-2')}>
              <SectionHeading
                id={`${section.id}-title`}
                eyebrow={section.eyebrow}
                title={section.title}
                description={section.body}
                size="md"
              />
              <BulletList items={section.points} className="mt-7" />
            </Reveal>
            <Reveal delay={100} className={cn(index % 2 === 1 && 'lg:order-1')}>
              <FeatureVisual visual={section.visual} />
            </Reveal>
          </section>
        ))}
      </div>

      <SmallerThings />
      {liveDemo ? (
        <CtaBand
          title="Try it before you sign up."
          description="Open a sample quote as the customer, then look at the same business as its owner. No sign-up needed."
          primary={{ to: paths.demo, label: 'Try the demo' }}
          secondary={{ to: paths.register, label: 'Start free' }}
        />
      ) : (
        <CtaBand
          title="See it with your own quote."
          description="Create a free account and send a quote to your own phone. It takes about two minutes."
        />
      )}
    </>
  );
}
