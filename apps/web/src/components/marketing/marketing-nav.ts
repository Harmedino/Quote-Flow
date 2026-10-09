import { paths } from '@/app/paths';
import { TRADES, tradePath } from './trades';

export interface MarketingLink {
  to: string;
  label: string;
}

/** The website's main navigation, in the header and the phone menu. */
export const MARKETING_NAV: MarketingLink[] = [
  { to: paths.features, label: 'Features' },
  { to: paths.solutions, label: 'Solutions' },
  { to: paths.howItWorks, label: 'How it works' },
  { to: paths.pricing, label: 'Pricing' },
  { to: paths.about, label: 'About' },
  { to: paths.demo, label: 'Live demo' },
];

/** Without the live demo, its page is a walkthrough of screenshots: "Live demo" would over-promise. */
export const DEMO_TOUR_LABEL = 'Product tour';

/** A link's label, given whether this deployment has the live demo. */
export function navLabel(link: MarketingLink, liveDemo: boolean): string {
  return link.to === paths.demo && !liveDemo ? DEMO_TOUR_LABEL : link.label;
}

export const FOOTER_COLUMNS: { title: string; links: MarketingLink[] }[] = [
  {
    title: 'Product',
    links: [
      { to: paths.features, label: 'Features' },
      { to: paths.howItWorks, label: 'How it works' },
      { to: paths.pricing, label: 'Pricing' },
      { to: paths.about, label: 'About QuoteFlow' },
      { to: paths.demo, label: 'Live demo' },
    ],
  },
  {
    title: 'Built for',
    links: TRADES.map((trade) => ({ to: tradePath(trade), label: trade.name })),
  },
  {
    title: 'Account',
    links: [
      { to: paths.register, label: 'Create an account' },
      { to: paths.login, label: 'Sign in' },
      { to: `${paths.howItWorks}#faq`, label: 'FAQ' },
    ],
  },
];
