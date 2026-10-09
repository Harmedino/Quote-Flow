import {
  CircleCheckBig,
  FileText,
  type LucideIcon,
  MessageCircle,
  Receipt,
  Wallet,
} from 'lucide-react';
import { paths } from '@/app/paths';
import { ArrowLink } from '@/components/marketing/MarketingLinks';
import { Reveal } from '@/components/marketing/Reveal';
import { SectionHeading } from '@/components/marketing/SectionHeading';
import { cn } from '@/lib/cn';

const STEPS: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: FileText,
    title: 'Build it',
    body: 'Pick the customer, add items from your price list, set a discount and tax. The total updates as you type.',
  },
  {
    icon: MessageCircle,
    title: 'Share it on WhatsApp',
    body: 'The message and the link are written for you. Or copy the link, or download the PDF.',
  },
  {
    icon: CircleCheckBig,
    title: 'They accept',
    body: 'Your customer opens it on their phone and accepts or declines. No app, no account.',
  },
  {
    icon: Receipt,
    title: 'Invoice it',
    body: 'The accepted quote becomes an invoice with the same items and prices, in one click.',
  },
  {
    icon: Wallet,
    title: 'Get paid',
    body: 'Record each payment as it arrives, in part or in full. The balance keeps itself up to date.',
  },
];

function StepNumber({ className, children }: { className: string; children: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn('font-display text-sm font-semibold text-white/60', className)}
    >
      {children}
    </span>
  );
}

/** The five steps from a price to a paid invoice, on ink. */
export function QuoteJourney() {
  return (
    <section aria-labelledby="journey-title" className="bg-ink-grid">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
        <Reveal className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <SectionHeading
            id="journey-title"
            eyebrow="How a quote flows"
            title="From the first price to the last payment."
            description="Each quote keeps its own record: when you sent it, when the customer opened it and what they answered. Its invoice keeps track of what they’ve paid."
            onInk
          />
          <ArrowLink to={paths.howItWorks} onInk className="shrink-0 self-start lg:self-auto">
            How it works
          </ArrowLink>
        </Reveal>
        {/* One row per step on phones (icon beside the text), cards from sm up. */}
        <ol className="mt-10 grid gap-x-6 gap-y-5 sm:mt-14 sm:grid-cols-2 sm:gap-y-10 lg:grid-cols-5">
          {STEPS.map(({ icon: Icon, title, body }, index) => {
            const number = String(index + 1).padStart(2, '0');
            return (
              <li key={title}>
                <Reveal
                  delay={index * 60}
                  className="flex h-full items-start gap-4 border-t border-white/15 pt-5 sm:block"
                >
                  <div className="flex shrink-0 items-center justify-between">
                    <span className="flex size-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-highlight">
                      <Icon aria-hidden="true" className="size-5" strokeWidth={1.75} />
                    </span>
                    <StepNumber className="hidden sm:inline">{number}</StepNumber>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-3 sm:mt-5">
                      <h3 className="text-lg font-semibold text-white">{title}</h3>
                      <StepNumber className="sm:hidden">{number}</StepNumber>
                    </div>
                    <p className="mt-1 text-[0.9375rem] leading-relaxed text-pretty text-white/65 sm:mt-2">
                      {body}
                    </p>
                  </div>
                </Reveal>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
