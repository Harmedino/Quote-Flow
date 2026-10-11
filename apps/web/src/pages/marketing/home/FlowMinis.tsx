import { Check, CircleCheck, Copy, Download, Link2, MessageCircle, Plus } from 'lucide-react';
import type { ReactNode } from 'react';
import { brandColorVars } from '@/components/documents/brand-color';
import { businessInitials } from '@/components/documents/document-format';
import { TapeMeasure } from '@/components/ui/TapeMeasure';
import { cn } from '@/lib/cn';
import { formatKobo, naira, wholeNaira } from '../sample-money';
import { priceSampleQuote } from '../solutions/sample-quote';
import {
  SAMPLE_BUSINESS,
  SAMPLE_INVOICE,
  SAMPLE_QUOTE,
  SAMPLE_SERVICES,
  SAMPLE_TIMES,
  displayUrl,
  sampleShare,
} from './sample-job';

// Small drawings of QuoteFlow's screens at each step of a job. They illustrate the step's text,
// so they are hidden from screen readers.

const ROW = 'rounded-lg bg-surface shadow-[0_0_0_1px_var(--color-line)]';

function Frame({ children }: { children: ReactNode }) {
  return (
    <div
      aria-hidden="true"
      className="mt-[18px] grid grid-cols-[minmax(0,1fr)] gap-2 rounded-[10px] bg-surface-muted p-3"
    >
      {children}
    </div>
  );
}

/** Step 1: services tapped from the price list. */
export function PickServicesMini() {
  return (
    <Frame>
      {SAMPLE_SERVICES.map((service) => (
        <div
          key={service.name}
          className={cn(
            'flex items-center gap-2.5 rounded-lg bg-surface px-2.5 py-2 text-[13px]',
            service.picked
              ? 'shadow-[0_0_0_1.5px_var(--color-primary)]'
              : 'shadow-[0_0_0_1px_var(--color-line)]',
          )}
        >
          <span
            className={cn(
              'grid size-[22px] shrink-0 place-items-center rounded-md [&_svg]:size-3.5 [&_svg]:stroke-[2.6]',
              service.picked
                ? 'bg-primary text-on-primary'
                : 'text-ink-2 shadow-[inset_0_0_0_1px_var(--color-line-strong)]',
            )}
          >
            {service.picked ? <Check /> : <Plus />}
          </span>
          <b className="min-w-0 flex-1 truncate font-[650] text-ink">{service.name}</b>
          <span className="font-mono text-[11.5px] whitespace-nowrap text-muted">
            {wholeNaira(service.rate)}/{service.unit}
          </span>
        </div>
      ))}
    </Frame>
  );
}

/** Step 2: the quote's link, and the buttons to send it. */
export function ShareMini() {
  const { url } = sampleShare();
  return (
    <Frame>
      <div
        className={cn(
          ROW,
          'flex items-center gap-2 px-2.5 py-2 font-mono text-[11.5px] text-ink-2',
        )}
      >
        <Link2 className="size-3.5 shrink-0 text-muted" />
        <span className="min-w-0 flex-1 truncate">{displayUrl(url)}</span>
        <Copy className="size-3.5 shrink-0 text-muted" />
      </div>
      <div className="grid grid-cols-[1.4fr_1fr] gap-2 text-[13px] font-[650] [&_svg]:size-[15px]">
        <span className="flex h-9 items-center justify-center gap-1.5 rounded-lg bg-ink text-canvas">
          <MessageCircle />
          WhatsApp
        </span>
        <span className="flex h-9 items-center justify-center gap-1.5 rounded-lg bg-surface text-ink shadow-[inset_0_0_0_1px_var(--color-line-strong)]">
          <Download />
          PDF
        </span>
      </div>
    </Frame>
  );
}

/** Step 3: the customer's page, in the business's own colour, with its two answers. */
export function CustomerPageMini() {
  const { totals } = priceSampleQuote(SAMPLE_QUOTE);
  return (
    <Frame>
      <div
        style={brandColorVars(SAMPLE_BUSINESS.brandColor)}
        className="overflow-hidden rounded-[10px] bg-surface shadow-[0_0_0_1px_var(--color-line)]"
      >
        <div className="flex items-center gap-2 bg-(--doc-accent) px-2.5 py-2 text-[12.5px] font-bold text-(--doc-on-accent)">
          <span className="grid size-5 place-items-center rounded-[5px] bg-(--doc-on-accent) text-[9px] font-extrabold text-(--doc-accent)">
            {businessInitials(SAMPLE_BUSINESS.name)}
          </span>
          {SAMPLE_BUSINESS.name}
        </div>
        <div className="p-2.5">
          <div className="flex items-baseline justify-between gap-2 text-xs text-muted">
            <span className="font-mono">{SAMPLE_QUOTE.number}</span>
            <b className="figure text-[17px] text-ink">{formatKobo(totals.total)}</b>
          </div>
          <div className="mt-2.5 grid grid-cols-[1fr_1.5fr] gap-1.5 text-[12.5px] font-[650]">
            <span className="grid h-8 place-items-center rounded-[7px] text-ink shadow-[inset_0_0_0_1px_var(--color-line-strong)]">
              Decline
            </span>
            <span className="grid h-8 place-items-center rounded-[7px] bg-(--doc-accent) text-(--doc-on-accent)">
              Accept quote
            </span>
          </div>
        </div>
      </div>
      <p className="flex flex-wrap items-center gap-1.5 px-0.5 font-mono text-[11px] text-muted">
        <span className="size-1.5 rounded-full bg-viewed" />
        Viewed {SAMPLE_TIMES.viewed} ·
        <span className="size-1.5 rounded-full bg-accepted" />
        Accepted {SAMPLE_TIMES.accepted}
      </p>
    </Frame>
  );
}

/** Step 4: the invoice with a deposit recorded, on the tape measure. */
export function InvoicePaidMini() {
  const { number, customer, total, paid, payment } = SAMPLE_INVOICE;
  return (
    <Frame>
      <div className={cn(ROW, 'px-3 py-2.5')}>
        <div className="flex items-center justify-between gap-2 text-[13px]">
          <b className="font-[650] text-ink">{number}</b>
          <span className="font-mono text-[11.5px] text-muted">{customer}</span>
        </div>
        <TapeMeasure
          value={paid / total}
          label={`${wholeNaira(paid)} of ${wholeNaira(total)} paid`}
          size="sm"
          className="mt-2.5"
        />
        <div className="mt-[7px] flex justify-between gap-2 font-mono text-[11px] text-muted">
          <span>
            Paid <b className="font-semibold text-ink">{wholeNaira(paid)}</b>
          </span>
          <span>
            Owed <b className="font-semibold text-ink">{wholeNaira(total - paid)}</b>
          </span>
        </div>
      </div>
      <div className={cn(ROW, 'flex items-center gap-2 px-2.5 py-2 text-[12.5px] text-ink')}>
        <CircleCheck className="size-[15px] shrink-0 text-accepted" />
        <span className="flex-1">{payment}</span>
        <span className="money text-[11.5px]">{naira(paid)}</span>
      </div>
    </Frame>
  );
}
