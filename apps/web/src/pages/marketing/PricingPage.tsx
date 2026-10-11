import { CURRENCY_CODES } from '@quoteflow/shared';
import { DocumentTitle } from '@/components/DocumentTitle';
import { BulletList } from '@/components/marketing/BulletList';
import { CtaBand } from '@/components/marketing/CtaBand';
import { FaqSection } from '@/components/marketing/Faq';
import { StartFreeLink } from '@/components/marketing/MarketingLinks';
import { PageHero } from '@/components/marketing/PageHero';
import { Reveal } from '@/components/marketing/Reveal';
import { SITE_CONTAINER } from '@/components/marketing/site-container';
import { useLiveDemo } from '@/components/marketing/use-demo-status';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/cn';
import { PRICING_FAQ } from './faq-entries';

const HIGHLIGHTS = [
  'Every feature, for every account',
  'No card needed to sign up',
  'No limit on quotes, invoices or customers',
  'Set up in a few minutes, on your phone',
];

const INCLUDED = [
  'The quote builder, with your saved services and prices',
  'Quote and invoice links to share on WhatsApp',
  'Accept or decline online, with no customer account',
  'Quote and invoice PDFs in your brand colour',
  'Invoices from accepted quotes, or from scratch',
  'Part and full payments, balances and overdue tracking',
  'Customers with all their quotes and invoices',
  `${CURRENCY_CODES.length} currencies, tax and discounts`,
  'The dashboard: what’s owed, overdue and waiting',
];

/** QuoteFlow has no billing: it is free in early access, and this page says only that. */
export default function PricingPage() {
  const liveDemo = useLiveDemo();

  return (
    <>
      <DocumentTitle title="Pricing" />
      <PageHero
        eyebrow="Pricing"
        align="center"
        title="Free while we’re in early access."
        description="Every feature, for every account. There are no paid plans yet, so there’s nothing to choose between and nothing to cancel."
      />

      <section aria-label="What you get" className={cn(SITE_CONTAINER, 'pt-12 sm:pt-16')}>
        <div className="mx-auto grid max-w-4xl gap-6 lg:grid-cols-2">
          <Reveal className="h-full">
            <div className="flex h-full flex-col lift-high ticket-col">
              <div className="bg-primary-tint px-6 pt-5 pb-5 sm:px-7">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-lg font-[750] text-ink font-stretch-112%">QuoteFlow</h2>
                  <Badge tone="brand">Early access</Badge>
                </div>
                <p className="mt-1 text-sm text-ink-2">
                  For any business that quotes before it works.
                </p>
              </div>
              <div className="flex flex-1 flex-col px-6 pt-6 pb-7 sm:px-7">
                <p className="figure text-[4rem] text-ink">Free</p>
                <BulletList items={HIGHLIGHTS} className="mt-6 flex-1" />
                <StartFreeLink className="mt-8 sm:w-full" />
              </div>
            </div>
          </Reveal>
          <Reveal delay={60} className="h-full">
            <Card className="flex h-full flex-col p-6 sm:p-7">
              <h2 className="text-lg font-[750] text-ink font-stretch-112%">What’s included</h2>
              <p className="mt-1 text-sm text-ink-2">All of it, from the first day.</p>
              <BulletList items={INCLUDED} className="mt-6" />
            </Card>
          </Reveal>
        </div>
        <p className="mx-auto mt-8 max-w-4xl text-center text-sm text-pretty text-ink-2">
          QuoteFlow doesn’t take payments: your customers pay you directly, and you record it.
        </p>
      </section>

      <FaqSection
        title="Questions, answered"
        description={
          liveDemo
            ? 'Anything else? The live demo is the quickest way to see how it works.'
            : 'Anything else? How it works walks through every step.'
        }
        entries={PRICING_FAQ}
      />
      <CtaBand
        title="Start free today."
        description="No card needed. Send your first quote in a few minutes."
      />
    </>
  );
}
