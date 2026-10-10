import type { ReactNode } from 'react';
import { paths } from '@/app/paths';
import { UnderlineLink } from '@/components/marketing/MarketingLinks';
import { Photo } from '@/components/marketing/Photo';
import { Reveal } from '@/components/marketing/Reveal';
import { ScreenFrame } from '@/components/marketing/ScreenFrame';
import { PHOTOS } from '@/components/marketing/photos';
import { SCREENS } from '@/components/marketing/screens';
import { cn } from '@/lib/cn';

// Row photos sit in a 4:3 box, so the 3:2 image renders 1.125x wider than its column.
const ROW_SIZES = '(min-width: 1152px) 576px, (min-width: 1024px) 50vw, 110vw';

interface Row {
  /** The matching section of the Features page. */
  feature: string;
  title: string;
  body: string;
  link: string;
  visual: ReactNode;
}

const ROWS: Row[] = [
  {
    feature: 'quotes',
    title: 'Price the job before you leave the site',
    body: 'Your services and prices are saved, so a quote takes a few taps: pick the customer, add the items, set a discount and tax. Your usual notes and terms fill themselves in.',
    link: 'See the quote builder',
    visual: <Photo photo={PHOTOS.wiringSurvey} sizes={ROW_SIZES} className="aspect-[4/3]" />,
  },
  {
    feature: 'customer-page',
    title: 'Your customer says yes from their phone',
    body: 'They open the link you sent on WhatsApp and see a clean quote with your business name and colour. One tap accepts or declines it, and you can see when they first opened it.',
    link: 'What your customer sees',
    visual: (
      <div className="relative">
        <Photo
          photo={PHOTOS.customerOnPhone}
          sizes={ROW_SIZES}
          className="aspect-[4/3] object-[40%_45%]"
        />
        <ScreenFrame
          screen={SCREENS.quoteAcceptedMobile}
          className="absolute -right-2 -bottom-10 w-[34%] max-w-[12rem] sm:-right-6"
        />
      </div>
    ),
  },
  {
    feature: 'invoices',
    title: 'Turn the yes into an invoice, then track every payment',
    body: 'An accepted quote becomes an invoice with the same items in one click. Record cash, transfer or card payments as they come in, part or full, and the balance updates itself.',
    link: 'Invoices and payments',
    visual: (
      <Photo
        photo={PHOTOS.ownerOnCall}
        sizes={ROW_SIZES}
        className="aspect-[4/3] object-[60%_45%]"
      />
    ),
  },
  {
    feature: 'dashboard',
    title: 'Know who still owes you',
    body: 'The dashboard shows the money still to collect, the invoices that are overdue and the quotes waiting for an answer, so you know who to call first.',
    link: 'The dashboard',
    visual: <ScreenFrame screen={SCREENS.dashboard} />,
  },
];

/** Alternating rows: what QuoteFlow does at each step, beside a photo or a screenshot. */
export function FeatureRows() {
  return (
    <section aria-label="What QuoteFlow does" className="border-t border-stone-200/70">
      <div className="mx-auto max-w-6xl space-y-24 px-4 py-20 sm:space-y-28 sm:px-6 sm:py-24 lg:px-8">
        {ROWS.map((row, index) => (
          <div key={row.feature} className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <Reveal className={cn(index % 2 === 1 && 'lg:order-2')}>
              <h2 className="text-3xl leading-tight font-semibold tracking-tight text-balance text-stone-900 sm:text-[2.5rem]">
                {row.title}
              </h2>
              <p className="mt-4 max-w-lg text-base leading-relaxed text-pretty text-stone-600 sm:text-lg">
                {row.body}
              </p>
              <div className="mt-6">
                <UnderlineLink to={`${paths.features}#${row.feature}`}>{row.link}</UnderlineLink>
              </div>
            </Reveal>
            <Reveal delay={100} className={cn(index % 2 === 1 && 'lg:order-1')}>
              {row.visual}
            </Reveal>
          </div>
        ))}
      </div>
    </section>
  );
}
