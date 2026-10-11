import { paths } from '@/app/paths';
import { DocumentTitle } from '@/components/DocumentTitle';
import { CtaBand } from '@/components/marketing/CtaBand';
import { FaqSection } from '@/components/marketing/Faq';
import { ArrowLink } from '@/components/marketing/MarketingLinks';
import { NumberedSteps, type Step } from '@/components/marketing/NumberedSteps';
import { PageHero } from '@/components/marketing/PageHero';
import { Photo } from '@/components/marketing/Photo';
import { Reveal } from '@/components/marketing/Reveal';
import { SectionHeading } from '@/components/marketing/SectionHeading';
import { PHOTOS } from '@/components/marketing/photos';
import { SITE_CONTAINER } from '@/components/marketing/site-container';
import { useLiveDemo } from '@/components/marketing/use-demo-status';
import { cn } from '@/lib/cn';
import { HOW_IT_WORKS_FAQ } from './faq-entries';

const OWNER_STEPS: Step[] = [
  {
    title: 'Create your account',
    body: 'Your name, your business’s name, an email and a password. Pick your currency; the time zone comes from your device. It takes about two minutes.',
  },
  {
    title: 'Set up your business',
    body: 'Add the phone number and address customers see, your brand colour, your quote and invoice numbering, a default tax rate, and the notes and terms that go on every quote.',
  },
  {
    title: 'Add your services and customers',
    body: 'Each service gets a price and a unit, like per visit, per hour or per square metre. Save customers’ phone numbers with the country code (+234…), so sharing on WhatsApp opens their chat.',
  },
  {
    title: 'Build a quote and share it',
    body: 'Pick the customer and the items, check the total, and share it on WhatsApp or copy the link. Sharing marks the quote as sent.',
  },
  {
    title: 'Watch for the answer',
    body: 'The quote shows when your customer opened it, and whether they accepted or declined. Change it and the same link shows the new version.',
  },
  {
    title: 'Invoice the job and record payments',
    body: 'Turn the accepted quote into an invoice, share its link, and record each payment as it arrives. Overdue invoices stand out on your dashboard.',
  },
];

const CUSTOMER_STEPS: Step[] = [
  {
    title: 'Opens your link',
    body: 'From your WhatsApp message, on any phone or computer. No app to download and no account to create.',
  },
  {
    title: 'Reads the quote',
    body: 'Your business name, contact details and colour at the top, then every item, the discount, tax and total, and the date the price is valid until.',
  },
  {
    title: 'Accepts or declines',
    body: 'One tap to accept. If they decline, they can say why. Either way, their answer is on the quote the next time you open it.',
  },
  {
    title: 'Pays you the way they always do',
    body: 'The invoice has its own link showing what’s paid and what’s still due. They pay you directly, by transfer, cash or card, and you record it.',
  },
];

/** "What it costs" as a ticket: the explanation, and the price on the stub. */
function CostTicket() {
  return (
    <Reveal>
      <div className="lift max-sm:ticket-col sm:ticket-row">
        <div className="p-6 sm:grow-[2.4] sm:p-10">
          <h2
            id="cost-title"
            className="text-[1.5rem] leading-tight font-[780] tracking-[-0.015em] text-ink font-stretch-112% sm:text-[1.75rem]"
          >
            What it costs
          </h2>
          <p className="mt-3 max-w-2xl text-[1.0625rem] leading-relaxed text-pretty text-ink-2">
            Nothing while QuoteFlow is in early access. Every account gets every feature, with no
            card needed to sign up.
          </p>
          <ArrowLink to={paths.pricing} className="mt-5 inline-block">
            About pricing
          </ArrowLink>
        </div>
        <div className="flex flex-col items-center justify-center bg-primary-tint p-6 text-center sm:p-10">
          <p className="figure text-[3rem] text-ink">Free</p>
          <p className="mt-2 label-mono text-ink-2">In early access</p>
        </div>
      </div>
    </Reveal>
  );
}

export default function HowItWorksPage() {
  const liveDemo = useLiveDemo();

  return (
    <>
      <DocumentTitle title="How it works" />
      <PageHero
        eyebrow="How it works"
        title="From sign-up to the first payment."
        description="Six steps on your side and four on your customer’s: what you do in QuoteFlow, and what they see when your link arrives."
      />

      <section
        aria-labelledby="for-you-title"
        className={cn(
          SITE_CONTAINER,
          'grid gap-12 py-20 sm:py-24 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16',
        )}
      >
        <div>
          <SectionHeading id="for-you-title" eyebrow="Your side" title="For you" />
          <Reveal className="mt-10 hidden lg:block">
            {/* A 3:2 photo in a 4:5 box renders about 1.9x wider than its column. */}
            <Photo
              photo={PHOTOS.onSiteCall}
              sizes="(min-width: 1024px) 800px, 100vw"
              className="aspect-[4/5] object-[62%_50%]"
            />
          </Reveal>
        </div>
        <NumberedSteps steps={OWNER_STEPS} />
      </section>

      <section aria-labelledby="for-customers-title" className="border-y border-line bg-surface">
        <div className={cn(SITE_CONTAINER, 'py-20 sm:py-24')}>
          <SectionHeading
            id="for-customers-title"
            eyebrow="Your customer’s side"
            title="For your customers"
          />
          <NumberedSteps steps={CUSTOMER_STEPS} />
          {liveDemo && (
            <p className="mt-8 text-[0.9375rem] text-ink-2">
              Want to see it from their side?{' '}
              <ArrowLink to={paths.demo}>Open a demo quote</ArrowLink>
            </p>
          )}
        </div>
      </section>

      <section aria-labelledby="cost-title" className={cn(SITE_CONTAINER, 'pt-20 sm:pt-24')}>
        <CostTicket />
      </section>

      <FaqSection entries={HOW_IT_WORKS_FAQ} />
      <CtaBand title="Ready to send your first quote?" />
    </>
  );
}
