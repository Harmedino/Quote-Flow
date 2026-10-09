import { paths } from '@/app/paths';
import { QuoteStatusBadge } from '@/components/StatusBadge';
import { ArrowLink, StartFreeLink } from '@/components/marketing/MarketingLinks';
import { Photo } from '@/components/marketing/Photo';
import { Reveal } from '@/components/marketing/Reveal';
import { ScreenFrame } from '@/components/marketing/ScreenFrame';
import { PHOTOS } from '@/components/marketing/photos';
import { SCREENS } from '@/components/marketing/screens';
import { useLiveDemo } from '@/components/marketing/use-demo-status';
import { naira } from '../sample-money';

/** A quote's status as the owner sees it in QuoteFlow, floating over the hero photo. */
function AcceptedQuoteCard() {
  return (
    <div
      aria-hidden="true"
      className="absolute top-8 -right-3 hidden w-52 animate-float rounded-2xl border border-stone-200 bg-surface p-4 shadow-[var(--shadow-elevated)] sm:block lg:-right-6"
    >
      <p className="text-xs text-stone-500">Quote LHS-Q-0012 · Chioma Eze</p>
      <p className="mt-1 font-display text-xl font-semibold tracking-tight text-stone-900 tabular-nums">
        {naira(185_000)}
      </p>
      <div className="mt-2">
        <QuoteStatusBadge status="accepted" />
      </div>
    </div>
  );
}

export function HomeHero() {
  const liveDemo = useLiveDemo();

  return (
    <section className="overflow-hidden bg-ink">
      <div className="mx-auto grid max-w-6xl items-center gap-14 px-4 pt-12 pb-20 sm:px-6 sm:pt-16 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:pb-24">
        <Reveal>
          <h1 className="text-[2.5rem] leading-[1.04] font-semibold tracking-tight text-balance text-white sm:text-6xl">
            Quotes your customers accept from their phone.
          </h1>
          <p className="mt-6 max-w-lg text-base leading-relaxed text-pretty text-white/70 sm:text-lg">
            Price the job in a few taps and send it on WhatsApp. Your customer opens it and accepts,
            no app or account needed. Then you turn it into an invoice and record what they pay.
          </p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
            <StartFreeLink>Create your first quote</StartFreeLink>
            {liveDemo ? (
              <ArrowLink to={paths.demo} onInk>
                View live demo
              </ArrowLink>
            ) : (
              <ArrowLink to={paths.howItWorks} onInk>
                How it works
              </ArrowLink>
            )}
          </div>
          <p className="mt-6 text-sm text-white/60">
            Free while we&apos;re in early access. Works in naira and any other currency.
          </p>
        </Reveal>

        <Reveal delay={150} className="relative">
          {/* Cropped to 4:5 on desktop, so the image renders about 1.9x wider than its column. */}
          <Photo
            photo={PHOTOS.onSiteCall}
            sizes="(min-width: 1152px) 880px, (min-width: 1024px) 75vw, 110vw"
            className="aspect-[4/3] object-[62%_50%] lg:aspect-[4/5]"
            eager
          />
          <AcceptedQuoteCard />
          <ScreenFrame
            screen={SCREENS.quoteMobile}
            className="absolute -bottom-8 left-3 w-[32%] max-w-[13rem] sm:left-6 lg:-bottom-10 lg:-left-10 lg:w-[38%]"
          />
        </Reveal>
      </div>
    </section>
  );
}
