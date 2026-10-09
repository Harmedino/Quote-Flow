import type { ReactNode } from 'react';
import { useLocation } from 'react-router';
import { paths } from '@/app/paths';
import { ArrowLink, StartFreeLink } from './MarketingLinks';
import { Reveal } from './Reveal';
import type { MarketingLink } from './marketing-nav';
import { useLiveDemo } from './use-demo-status';

export interface CtaBandProps {
  title?: ReactNode;
  description?: ReactNode;
  /** The lime pill; "Start free" unless given. */
  primary?: MarketingLink;
  /** The quieter link beside it; see `secondaryLink` for the default. */
  secondary?: MarketingLink;
}

const DEMO_LINK: MarketingLink = { to: paths.demo, label: 'View live demo' };
const HOW_IT_WORKS_LINK: MarketingLink = { to: paths.howItWorks, label: 'How it works' };
const FEATURES_LINK: MarketingLink = { to: paths.features, label: 'See every feature' };

/** The live demo when this deployment has one, else How it works; never the page itself. */
function secondaryLink(liveDemo: boolean, pathname: string): MarketingLink {
  const candidates = liveDemo
    ? [DEMO_LINK, HOW_IT_WORKS_LINK, FEATURES_LINK]
    : [HOW_IT_WORKS_LINK, FEATURES_LINK];
  return candidates.find((link) => link.to !== pathname) ?? FEATURES_LINK;
}

/** The ink panel that closes every marketing page: start free, or look around first. */
export function CtaBand({
  title = 'Send your next quote from your phone.',
  description = 'Setting up takes a few minutes, and QuoteFlow is free while it’s in early access.',
  primary,
  secondary,
}: CtaBandProps) {
  const liveDemo = useLiveDemo();
  const { pathname } = useLocation();
  const quiet = secondary ?? secondaryLink(liveDemo, pathname);

  return (
    <section aria-labelledby="cta-band-title" className="px-4 pb-20 sm:px-6 lg:px-8">
      <Reveal className="mx-auto flex max-w-6xl flex-col gap-8 rounded-[2rem] bg-ink px-6 py-12 sm:px-12 sm:py-16 lg:flex-row lg:items-end lg:justify-between dark:ring-1 dark:ring-white/10">
        <div className="max-w-xl">
          <h2
            id="cta-band-title"
            className="text-3xl leading-[1.1] font-semibold tracking-tight text-balance text-white sm:text-[2.6rem]"
          >
            {title}
          </h2>
          <p className="mt-4 text-base text-pretty text-white/65 sm:text-lg">{description}</p>
        </div>
        <div className="flex shrink-0 flex-col gap-4 sm:flex-row sm:items-center">
          {primary ? (
            <StartFreeLink to={primary.to}>{primary.label}</StartFreeLink>
          ) : (
            <StartFreeLink />
          )}
          <ArrowLink to={quiet.to} onInk>
            {quiet.label}
          </ArrowLink>
        </div>
      </Reveal>
    </section>
  );
}
