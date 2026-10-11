import { DocumentTitle } from '@/components/DocumentTitle';
import { CtaBand } from '@/components/marketing/CtaBand';
import { FeatureRows } from './home/FeatureRows';
import { HomeHero } from './home/HomeHero';
import { JobFlow } from './home/JobFlow';
import { ProblemSection } from './home/ProblemSection';
import { TradesBand } from './home/TradesBand';

export default function HomePage() {
  return (
    <>
      <DocumentTitle title="Quotes and invoices for service businesses" />
      <HomeHero />
      <TradesBand />
      <JobFlow />
      <ProblemSection />
      <FeatureRows />
      <CtaBand />
    </>
  );
}
