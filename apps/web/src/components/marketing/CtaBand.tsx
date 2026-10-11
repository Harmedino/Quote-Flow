import type { ReactNode } from 'react';
import { useLocation } from 'react-router';
import { paths } from '@/app/paths';
import { ButtonLink } from '@/components/ui/ButtonLink';
import { cn } from '@/lib/cn';
import { StartFreeLink } from './MarketingLinks';
import { Reveal } from './Reveal';
import type { MarketingLink } from './marketing-nav';
import { SITE_CONTAINER } from './site-container';
import { useLiveDemo } from './use-demo-status';

export interface CtaBandProps {
  title?: ReactNode;
  description?: ReactNode;
  /** The orange button; "Start free" unless given. */
  primary?: MarketingLink;
  /** The outlined button under it; see `secondaryLink` for the default. */
  secondary?: MarketingLink;
}

const DEMO_LINK: MarketingLink = { to: paths.demo, label: 'Try the live demo' };
const HOW_IT_WORKS_LINK: MarketingLink = { to: paths.howItWorks, label: 'How it works' };
const FEATURES_LINK: MarketingLink = { to: paths.features, label: 'See every feature' };

/** The live demo when this deployment has one, else How it works; never the page itself. */
function secondaryLink(liveDemo: boolean, pathname: string): MarketingLink {
  const candidates = liveDemo
    ? [DEMO_LINK, HOW_IT_WORKS_LINK, FEATURES_LINK]
    : [HOW_IT_WORKS_LINK, FEATURES_LINK];
  return candidates.find((link) => link.to !== pathname) ?? FEATURES_LINK;
}

/**
 * The ticket that closes every website page: the pitch on the body, the two ways in on an
 * orange-tint stub (beside it on desktop, under it on phones).
 */
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
    <section aria-labelledby="cta-band-title" className={cn(SITE_CONTAINER, 'pt-6 pb-20 sm:pb-28')}>
      <Reveal>
        <div className="lift-high [--notch:12px] max-lg:ticket-col lg:ticket-row">
          <div className="px-6 py-9 sm:px-10 sm:py-12 lg:grow-[1.75] lg:px-12">
            <h2
              id="cta-band-title"
              className="max-w-2xl text-[clamp(1.875rem,1.1rem+2.4vw,2.875rem)] leading-[1.04] font-[840] tracking-[-0.03em] text-balance text-ink font-stretch-120%"
            >
              {title}
            </h2>
            <p className="mt-4 max-w-xl text-[1.0625rem] leading-relaxed text-pretty text-ink-2">
              {description}
            </p>
          </div>
          <div className="flex flex-col justify-center gap-3 bg-primary-tint px-6 py-8 sm:px-10 lg:px-10">
            {primary ? (
              <StartFreeLink to={primary.to} className="sm:w-full">
                {primary.label}
              </StartFreeLink>
            ) : (
              <StartFreeLink className="sm:w-full" />
            )}
            <ButtonLink to={quiet.to} variant="outline" size="xl" className="w-full">
              {quiet.label}
            </ButtonLink>
            <p className="mt-1 text-center label-mono text-ink-2">No card needed</p>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
