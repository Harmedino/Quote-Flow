import { CURRENCY_CODES } from '@quoteflow/shared';
import { Check } from 'lucide-react';
import { paths } from '@/app/paths';
import { DocumentTitle } from '@/components/DocumentTitle';
import { CtaBand } from '@/components/marketing/CtaBand';
import { FaqSection } from '@/components/marketing/Faq';
import { Reveal } from '@/components/marketing/Reveal';
import { useLiveDemo } from '@/components/marketing/use-demo-status';
import { ButtonLink } from '@/components/ui/ButtonLink';
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

function CheckItem({ children, onInk = false }: { children: string; onInk?: boolean }) {
  return (
    <li
      className={cn('flex items-start gap-2.5 text-sm', onInk ? 'text-white/80' : 'text-stone-700')}
    >
      <Check
        aria-hidden="true"
        strokeWidth={3}
        className={cn('mt-0.5 size-4 shrink-0', onInk ? 'text-highlight' : 'text-brand-600')}
      />
      {children}
    </li>
  );
}

/** QuoteFlow has no billing: it is free in early access, and this page says only that. */
export default function PricingPage() {
  const liveDemo = useLiveDemo();

  return (
    <>
      <DocumentTitle title="Pricing" />
      <section aria-labelledby="pricing-title" className="relative pb-10">
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-[26rem] bg-ink-grid sm:h-[25rem]"
        />
        <div className="relative mx-auto max-w-6xl px-4 pt-14 sm:px-6 sm:pt-20 lg:px-8">
          <div className="mx-auto max-w-2xl animate-fade-in-up text-center">
            <h1
              id="pricing-title"
              className="text-4xl leading-[1.05] font-semibold tracking-tight text-balance text-white sm:text-6xl"
            >
              Free while we’re in early access.
            </h1>
            <p className="mx-auto mt-5 max-w-lg text-base text-pretty text-white/70 sm:text-lg">
              Every feature, for every account. There are no paid plans yet, so there’s nothing to
              choose between and nothing to cancel.
            </p>
          </div>

          <div className="mx-auto mt-12 grid max-w-4xl gap-4 lg:grid-cols-2">
            <Reveal className="h-full">
              <div className="relative flex h-full flex-col rounded-3xl bg-ink p-6 text-white ring-1 ring-white/10 sm:p-7">
                <span className="absolute top-5 right-5 rounded-full bg-highlight px-2.5 py-1 text-[11px] font-semibold text-ink">
                  Early access
                </span>
                <h2 className="text-lg font-semibold text-white">QuoteFlow</h2>
                <p className="mt-1 text-sm text-white/65">
                  For any business that quotes before it works.
                </p>
                <p className="mt-6 font-display text-5xl font-semibold tracking-tight text-white">
                  Free
                </p>
                <ul className="mt-6 flex-1 space-y-3">
                  {HIGHLIGHTS.map((item) => (
                    <CheckItem key={item} onInk>
                      {item}
                    </CheckItem>
                  ))}
                </ul>
                <ButtonLink
                  to={paths.register}
                  variant="highlight"
                  size="xl"
                  shape="pill"
                  className="mt-8 w-full"
                >
                  Start free
                </ButtonLink>
              </div>
            </Reveal>
            <Reveal delay={60} className="h-full">
              <div className="flex h-full flex-col rounded-3xl border border-stone-200 bg-surface p-6 sm:p-7">
                <h2 className="text-lg font-semibold text-stone-900">What’s included</h2>
                <p className="mt-1 text-sm text-stone-600">All of it, from the first day.</p>
                <ul className="mt-6 space-y-3">
                  {INCLUDED.map((item) => (
                    <CheckItem key={item}>{item}</CheckItem>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
          <p className="mx-auto mt-6 max-w-4xl text-center text-sm text-pretty text-stone-600">
            QuoteFlow doesn’t take payments: your customers pay you directly, and you record it.
          </p>
        </div>
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
