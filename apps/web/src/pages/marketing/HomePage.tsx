import { DocumentTitle } from '@/components/DocumentTitle';
import { CtaBand } from '@/components/marketing/CtaBand';
import { FeatureRows } from './home/FeatureRows';
import { HomeHero } from './home/HomeHero';
import { ProblemSection } from './home/ProblemSection';
import { QuoteJourney } from './home/QuoteJourney';
import { TradesSection } from './home/TradesSection';

export default function HomePage() {
  return (
    <>
      <DocumentTitle title="Quotes and invoices for service businesses" />
      <HomeHero />
      <ProblemSection />
      <QuoteJourney />
      <FeatureRows />
      <TradesSection />
      <CtaBand />
    </>
  );
}
