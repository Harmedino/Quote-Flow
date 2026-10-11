import type { ReactNode } from 'react';
import { paths } from '@/app/paths';
import { QuoteStatusBadge } from '@/components/StatusBadge';
import { ArrowLink } from '@/components/marketing/MarketingLinks';
import { StepNumber } from '@/components/marketing/NumberedSteps';
import { Reveal } from '@/components/marketing/Reveal';
import { Eyebrow } from '@/components/marketing/SectionHeading';
import { SITE_CONTAINER } from '@/components/marketing/site-container';
import { HangTag } from '@/components/ui/HangTag';
import { CustomerPageMini, InvoicePaidMini, PickServicesMini, ShareMini } from './FlowMinis';

interface FlowStep {
  /** The short name on the ticket's stub. */
  label: string;
  title: string;
  body: string;
  tag: ReactNode;
  mini: ReactNode;
}

const STEPS: FlowStep[] = [
  {
    label: 'Price it',
    title: 'Price the job before you leave the site',
    body: 'Pick the customer and tap services from your list. Prices fill in; add VAT or a discount and the total updates as you go.',
    tag: <QuoteStatusBadge status="draft" />,
    mini: <PickServicesMini />,
  },
  {
    label: 'Send it',
    title: 'Send it on WhatsApp, or any way you like',
    body: 'Share a link straight to WhatsApp, copy it into any chat, or send the PDF. It carries your name and your colour.',
    tag: <QuoteStatusBadge status="sent" />,
    mini: <ShareMini />,
  },
  {
    label: 'The yes',
    title: 'They accept from their phone',
    body: 'No app, no account. They see the items and the total, then tap Accept or Decline — and you can see when they opened it.',
    tag: <QuoteStatusBadge status="accepted" />,
    mini: <CustomerPageMini />,
  },
  {
    label: 'Get paid',
    title: 'Invoice the yes and track every naira',
    body: 'One click turns the quote into an invoice. Record cash or transfers as they come in; the balance and overdue days keep themselves.',
    // The concept's short word: "Partially paid" doesn't fit beside the step on the stub.
    tag: <HangTag tone="partial">Part paid</HangTag>,
    mini: <InvoicePaidMini />,
  },
];

/** "How a job flows": the four steps of a job, each a ticket with its status tag on the stub. */
export function JobFlow() {
  return (
    <section aria-labelledby="flow-title" className="py-20 sm:py-24 xl:pb-26">
      <div className={SITE_CONTAINER}>
        <div className="grid items-end gap-8 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
          <Reveal>
            <Eyebrow>How a job flows</Eyebrow>
            <h2 id="flow-title" className="mt-3.5 heading-section text-ink">
              <span className="block">From first price</span>{' '}
              <span className="block">to last payment,</span>{' '}
              <span className="block">on one ticket.</span>
            </h2>
          </Reveal>
          <Reveal delay={80}>
            <p className="max-w-[32.5rem] text-[1.0625rem] leading-[1.6] text-pretty text-ink-2 sm:text-lg">
              Every quote keeps its own record: when you sent it, when the customer opened it, what
              they answered. Its invoice keeps track of what’s been paid and what’s still owed.
            </p>
            <ArrowLink to={paths.howItWorks} className="mt-3.5 inline-block">
              See how it works
            </ArrowLink>
          </Reveal>
        </div>

        {/* A dashed line runs behind the stubs on wide screens, joining the four tickets. */}
        <ol className="relative mt-14 grid gap-6 sm:grid-cols-2 xl:grid-cols-4 xl:before:absolute xl:before:inset-x-10 xl:before:top-[39px] xl:before:border-t-2 xl:before:border-dashed xl:before:border-line-strong">
          {STEPS.map((step, index) => (
            <li key={step.label} className="relative">
              <Reveal delay={index * 70} className="h-full">
                <article aria-labelledby={`flow-step-${index}`} className="h-full lift ticket-col">
                  <div className="flex items-center justify-between gap-3 px-[18px] pt-4 pb-[15px]">
                    <p className="flex items-baseline gap-2">
                      <StepNumber index={index} />
                      <span className="font-mono text-[11.5px] tracking-[0.08em] whitespace-nowrap text-muted">
                        {step.label}
                      </span>
                    </p>
                    {step.tag}
                  </div>
                  <div className="flex-1 px-[18px] py-5">
                    <h3
                      id={`flow-step-${index}`}
                      className="text-xl leading-[1.15] font-[780] tracking-[-0.015em] text-ink font-stretch-112%"
                    >
                      {step.title}
                    </h3>
                    <p className="mt-2 text-[14.5px] leading-[1.55] text-pretty text-ink-2">
                      {step.body}
                    </p>
                    {step.mini}
                  </div>
                </article>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
