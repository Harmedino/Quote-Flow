import type { ReactNode } from 'react';
import { paths } from '@/app/paths';
import { ArrowLink } from '@/components/marketing/MarketingLinks';
import { Photo } from '@/components/marketing/Photo';
import { Reveal } from '@/components/marketing/Reveal';
import { ScreenFrame } from '@/components/marketing/ScreenFrame';
import { SectionHeading } from '@/components/marketing/SectionHeading';
import { PHOTOS } from '@/components/marketing/photos';
import { SCREENS } from '@/components/marketing/screens';
import { SITE_CONTAINER } from '@/components/marketing/site-container';
import { cn } from '@/lib/cn';

// Row photos sit in a 4:3 box, so the 3:2 image renders 1.125x wider than its column.
const ROW_SIZES = '(min-width: 1280px) 660px, (min-width: 1024px) 55vw, 110vw';

interface Row {
  /** The matching section of the Features page. */
  feature: string;
  eyebrow: string;
  title: string;
  body: string;
  link: string;
  visual: ReactNode;
}

const ROWS: Row[] = [
  {
    feature: 'customer-page',
    eyebrow: 'Your customer’s side',
    title: 'A clean quote they can answer from WhatsApp',
    body: 'They open the link you sent and see your business name and colour, every item and the total. One tap accepts or declines it, and you can see when they first opened it.',
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
    eyebrow: 'Invoices and payments',
    title: 'Part payments, balances and overdue days, kept for you',
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
    eyebrow: 'Dashboard',
    title: 'Know who still owes you',
    body: 'The dashboard shows the money still to collect, the invoices that are overdue and the quotes waiting for an answer, so you know who to call first.',
    link: 'The dashboard',
    visual: <ScreenFrame screen={SCREENS.dashboard} />,
  },
];

/** Alternating rows: a closer look at three parts of QuoteFlow, beside a photo or a screenshot. */
export function FeatureRows() {
  return (
    <section
      aria-label="A closer look"
      className={cn(SITE_CONTAINER, 'space-y-24 py-20 sm:space-y-32 sm:py-28')}
    >
      {ROWS.map((row, index) => (
        <div
          key={row.feature}
          className="grid items-center gap-10 lg:grid-cols-[1fr_1.15fr] lg:gap-16"
        >
          <Reveal className={cn(index % 2 === 1 && 'lg:order-2')}>
            <SectionHeading
              eyebrow={row.eyebrow}
              title={row.title}
              description={row.body}
              size="md"
            />
            <ArrowLink to={`${paths.features}#${row.feature}`} className="mt-6 inline-block">
              {row.link}
            </ArrowLink>
          </Reveal>
          <Reveal delay={100} className={cn(index % 2 === 1 && 'lg:order-1')}>
            {row.visual}
          </Reveal>
        </div>
      ))}
    </section>
  );
}
