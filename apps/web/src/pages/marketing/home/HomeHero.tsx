import { Check, HardHat, Play } from 'lucide-react';
import { paths } from '@/app/paths';
import { StartFreeLink } from '@/components/marketing/MarketingLinks';
import { SITE_CONTAINER } from '@/components/marketing/site-container';
import { useLiveDemo } from '@/components/marketing/use-demo-status';
import { ButtonLink } from '@/components/ui/ButtonLink';
import { cn } from '@/lib/cn';
import { HeroVisual } from './HeroVisual';

const PROOF = ['Free in early access', 'Naira ₦ or any currency', 'PDF with every quote'];

/** "yes", on a tilted orange label with a navy edge. */
function Yes() {
  return (
    <span className="relative z-0 mx-[0.02em] inline-block px-[0.14em] pb-[0.02em] text-on-primary before:absolute before:inset-x-0 before:top-[0.1em] before:bottom-[0.02em] before:-z-10 before:-rotate-[2.5deg] before:rounded-[10px] before:bg-primary before:shadow-[0_3px_0_var(--color-navy)]">
      yes
    </span>
  );
}

export function HomeHero() {
  const liveDemo = useLiveDemo();

  return (
    <section aria-labelledby="hero-title" className="overflow-hidden">
      <div
        className={cn(
          SITE_CONTAINER,
          'grid items-center gap-12 pt-8 pb-16 sm:pt-10 sm:pb-20 xl:grid-cols-[1.06fr_1fr] xl:gap-10 xl:pt-9 xl:pb-18',
        )}
      >
        <div className="animate-fade-in-up">
          <p className="inline-flex min-h-8.5 flex-wrap items-center gap-x-2.5 gap-y-1 rounded-[9px] bg-surface py-1.5 pr-3.5 pl-2 font-mono text-xs font-medium tracking-[0.07em] whitespace-nowrap text-ink-2 uppercase shadow-[inset_0_0_0_1px_var(--color-line-strong)]">
            <span className="inline-flex h-5.5 items-center gap-1.5 rounded-[5px] bg-ink px-2 font-semibold text-canvas">
              <HardHat aria-hidden="true" className="size-[13px] text-primary" />
              For the trades
            </span>
            <span>
              Quotes · invoices<span className="max-sm:hidden"> · payments</span>
            </span>
          </p>
          <h1 id="hero-title" className="mt-6.5 heading-display text-ink">
            {/* Spaces between the lines, so the heading's text reads as one sentence. */}
            <span className="block">Price the job</span> <span className="block">on site.</span>{' '}
            <span className="block">
              Get the <Yes />
            </span>{' '}
            <span className="block">on WhatsApp.</span>
          </h1>
          <p className="mt-6.5 max-w-[35rem] text-[1.0625rem] leading-[1.55] text-pretty text-ink-2 sm:text-[1.1875rem]">
            Build a clean, branded quote in a few taps and send the link on WhatsApp. Your customer
            opens it on their phone and{' '}
            <b className="font-[650] text-ink">accepts with one tap — no app, no account</b>. Then
            the yes becomes an invoice, and you record every payment until it’s settled.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <StartFreeLink />
            {liveDemo ? (
              <ButtonLink to={paths.demo} variant="outline" size="xl">
                <Play aria-hidden="true" />
                Try the live demo
              </ButtonLink>
            ) : (
              <ButtonLink to={paths.howItWorks} variant="outline" size="xl">
                How it works
              </ButtonLink>
            )}
          </div>
          <ul className="mt-7 flex flex-wrap gap-x-5.5 gap-y-2 font-mono text-xs tracking-[0.06em] text-muted uppercase">
            {PROOF.map((item) => (
              <li key={item} className="inline-flex items-center gap-[7px]">
                <Check aria-hidden="true" className="size-[15px] stroke-[2.6] text-accepted" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <HeroVisual />
      </div>
    </section>
  );
}
