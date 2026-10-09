import { paths } from '@/app/paths';
import { DocumentTitle } from '@/components/DocumentTitle';
import { CtaBand } from '@/components/marketing/CtaBand';
import { FaqSection } from '@/components/marketing/Faq';
import { UnderlineLink } from '@/components/marketing/MarketingLinks';
import { NumberedSteps, type Step } from '@/components/marketing/NumberedSteps';
import { PageHero } from '@/components/marketing/PageHero';
import { useLiveDemo } from '@/components/marketing/use-demo-status';
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

export default function HowItWorksPage() {
  const liveDemo = useLiveDemo();

  return (
    <>
      <DocumentTitle title="How it works" />
      <PageHero
        title="How it works"
        description="From signing up to your first paid invoice, and what your customer sees on the other side."
      />

      <section
        aria-labelledby="for-you-title"
        className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8"
      >
        <h2
          id="for-you-title"
          className="text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl"
        >
          For you
        </h2>
        <NumberedSteps steps={OWNER_STEPS} />
      </section>

      <section aria-labelledby="for-customers-title" className="bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <h2
            id="for-customers-title"
            className="text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl"
          >
            For your customers
          </h2>
          <NumberedSteps steps={CUSTOMER_STEPS} />
          {liveDemo && (
            <p className="mt-6 text-sm text-stone-600">
              Want to see it from their side?{' '}
              <UnderlineLink to={paths.demo}>Open a demo quote</UnderlineLink>
            </p>
          )}
        </div>
      </section>

      <section
        aria-labelledby="cost-title"
        className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8"
      >
        <div className="rounded-3xl border border-stone-200 bg-surface p-6 sm:p-10">
          <h2
            id="cost-title"
            className="text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl"
          >
            What it costs
          </h2>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-pretty text-stone-600 sm:text-lg">
            Nothing while QuoteFlow is in early access. Every account gets every feature, with no
            card needed to sign up.
          </p>
          <div className="mt-5">
            <UnderlineLink to={paths.pricing}>About pricing</UnderlineLink>
          </div>
        </div>
      </section>

      <FaqSection entries={HOW_IT_WORKS_FAQ} />
      <CtaBand title="Ready to send your first quote?" />
    </>
  );
}
