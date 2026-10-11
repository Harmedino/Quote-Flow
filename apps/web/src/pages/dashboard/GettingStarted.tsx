import { ArrowRight, Check, ChevronRight } from 'lucide-react';
import { useId } from 'react';
import { Link } from 'react-router';
import { ButtonLink } from '@/components/ui/ButtonLink';
import { Card } from '@/components/ui/Card';
import { TapeMeasure } from '@/components/ui/TapeMeasure';
import { Ticket, TicketPart } from '@/components/ui/Ticket';
import type { ChecklistItem } from '@/features/dashboard/getting-started';
import { cn } from '@/lib/cn';

const HOW_IT_WORKS = [
  { title: 'Price the job', text: 'Add items from your services, a discount and tax.' },
  {
    title: 'Share it on WhatsApp or by link',
    text: 'Your customer opens a page in your brand colour and accepts or declines, no account needed.',
  },
  {
    title: 'Invoice and get paid',
    text: 'Turn the accepted quote into an invoice and record payments as they come in.',
  },
];

function SetupSteps({ items }: { items: readonly ChecklistItem[] }) {
  return (
    <ol className="divide-y-[1.5px] divide-dashed divide-line-strong">
      {items.map((item, index) => (
        <li key={item.id}>
          <Link
            to={item.to}
            className="group -mx-2 flex items-center gap-3.5 rounded-lg px-2 py-3.5 transition-colors hover:bg-surface-muted"
          >
            <span
              aria-hidden="true"
              className={cn(
                'flex size-8 shrink-0 items-center justify-center rounded-lg font-mono text-[12.5px] font-semibold',
                item.done
                  ? 'bg-accepted-tint text-accepted'
                  : 'bg-surface-muted text-ink-2 shadow-[inset_0_0_0_1px_var(--color-line-strong)]',
              )}
            >
              {item.done ? (
                <Check className="size-4" strokeWidth={3} />
              ) : (
                String(index + 1).padStart(2, '0')
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span
                className={cn(
                  'block text-[14.5px] font-bold',
                  item.done ? 'text-muted line-through decoration-line-strong' : 'text-ink',
                )}
              >
                {item.title}
                {item.done && <span className="sr-only"> (done)</span>}
              </span>
              <span className="mt-0.5 block text-[13px] text-muted">{item.description}</span>
            </span>
            {!item.done && (
              <>
                <span className="hidden shrink-0 items-center gap-1 text-[13.5px] font-[650] text-primary-ink group-hover:underline sm:inline-flex">
                  {item.action}
                  <ArrowRight aria-hidden="true" className="size-4" strokeWidth={2.4} />
                </span>
                <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-muted sm:hidden" />
              </>
            )}
          </Link>
        </li>
      ))}
    </ol>
  );
}

/** What a business sees before its first quote: the setup steps as a job ticket, and how a job flows. */
export function GettingStarted({ items }: { items: readonly ChecklistItem[] }) {
  const titleId = useId();
  const done = items.filter((item) => item.done).length;
  const next = items.find((item) => !item.done);

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
      <section aria-labelledby={titleId} className="min-w-0 lg:col-span-8">
        <Ticket>
          <TicketPart tone="stub" className="px-5 pt-5 pb-5 sm:px-6">
            <p className="label-mono text-ink-2">Get your business ready</p>
            <h2
              id={titleId}
              className="mt-2 text-[22px] leading-tight font-[800] tracking-[-0.015em] text-balance font-stretch-112% text-ink sm:text-[26px]"
            >
              A few quick steps and you’re ready to send your first quote.
            </h2>
            <div className="mt-4 flex items-center gap-3">
              <TapeMeasure
                value={items.length ? done / items.length : 0}
                label="Setup progress"
                className="min-w-0 flex-1"
              />
              <span className="money text-[12.5px] text-ink">
                {done} of {items.length} done
              </span>
            </div>
          </TicketPart>
          <TicketPart className="px-5 py-2 sm:px-6">
            <SetupSteps items={items} />
          </TicketPart>
          {next && (
            <TicketPart className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-6">
              <p className="text-[13.5px] text-muted">
                Next: <span className="font-semibold text-ink">{next.title}</span>
              </p>
              {/* Secondary: the header's New quote is the one primary action on the page. */}
              <ButtonLink to={next.to} variant="secondary">
                Continue setup
              </ButtonLink>
            </TicketPart>
          )}
        </Ticket>
      </section>

      <Card className="self-start p-5 lg:col-span-4">
        <h2 className="heading-card text-ink">How a job flows</h2>
        <ol className="mt-4 space-y-4">
          {HOW_IT_WORKS.map((step, index) => (
            <li key={step.title} className="flex gap-3.5">
              <span
                aria-hidden="true"
                className="flex h-7 w-9 shrink-0 items-center justify-center rounded-md bg-primary font-mono text-[12.5px] font-semibold text-on-primary notch-mid [--notch:4px]"
              >
                {index + 1}
              </span>
              <span>
                <span className="block text-[14.5px] font-bold text-ink">{step.title}</span>
                <span className="mt-0.5 block text-[13.5px] text-muted">{step.text}</span>
              </span>
            </li>
          ))}
        </ol>
      </Card>
    </div>
  );
}
