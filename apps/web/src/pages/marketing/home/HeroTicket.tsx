import { Avatar } from '@/components/ui/Avatar';
import { Stamp } from '@/components/ui/Stamp';
import { Ticket, TicketPart } from '@/components/ui/Ticket';
import { cn } from '@/lib/cn';
import { formatKobo, wholeNaira } from '../sample-money';
import { priceSampleQuote } from '../solutions/sample-quote';
import { SAMPLE_BUSINESS, SAMPLE_QUOTE, SAMPLE_TIMES } from './sample-job';

const { lines, totals } = priceSampleQuote(SAMPLE_QUOTE);

const TRAIL = [
  { label: `Sent ${SAMPLE_TIMES.sent}`, dot: 'bg-sent', hideOnPhones: true },
  { label: `Viewed ${SAMPLE_TIMES.viewed}`, dot: 'bg-viewed', hideOnPhones: false },
  { label: `Accepted ${SAMPLE_TIMES.accepted}`, dot: 'bg-accepted', hideOnPhones: false },
];

function Row({ label, detail, amount }: { label: string; detail?: string; amount: string }) {
  return (
    <div className="flex justify-between gap-3 py-1 text-[13px] text-ink-2">
      <span className="min-w-0">
        {label}
        {/* Phones show the line's name only, so every line stays on one row. */}
        {detail && <span className="max-sm:hidden"> · {detail}</span>}
      </span>
      <span className="money text-[12.5px] font-medium text-ink">{amount}</span>
    </div>
  );
}

/**
 * The sample quote as a job ticket, stamped with the customer's answer. Position it with
 * `className` (absolute or relative): the stamp is placed against it.
 */
export function HeroTicket({ className }: { className: string }) {
  return (
    // An illustration of the hero's copy, so screen readers skip it.
    <div aria-hidden="true" className={className}>
      <Ticket lift="high">
        <TicketPart className="flex items-center gap-[11px] px-4 pt-3.5 pb-3">
          <Avatar
            name={SAMPLE_BUSINESS.name}
            kind="business"
            brandColor={SAMPLE_BUSINESS.brandColor}
          />
          <div>
            <b className="block text-[14.5px] leading-tight font-[750] text-ink">
              {SAMPLE_QUOTE.number}
            </b>
            <span className="font-mono text-[11.5px] text-muted">{SAMPLE_QUOTE.customer}</span>
          </div>
        </TicketPart>
        <TicketPart className="px-4 pt-3 pb-3.5">
          {lines.map((line) => (
            <Row
              key={line.name}
              label={line.name}
              detail={
                line.quantity === 1
                  ? undefined
                  : `${line.quantity} ${line.unit} × ${wholeNaira(line.rate)}`
              }
              amount={formatKobo(line.amount)}
            />
          ))}
          <Row label={`Tax ${SAMPLE_QUOTE.taxRate}%`} amount={formatKobo(totals.tax)} />
          <div className="mt-1.5 flex items-baseline justify-between border-t-[1.5px] border-ink pt-2.5">
            <span className="label-mono text-ink-2">Total</span>
            <b className="figure text-2xl text-ink">{formatKobo(totals.total)}</b>
          </div>
        </TicketPart>
        <TicketPart className="flex items-center justify-between gap-2 px-4 pt-2.5 pb-3 font-mono text-[11px] whitespace-nowrap text-muted">
          {TRAIL.map((step) => (
            <span
              key={step.label}
              className={cn(
                'items-center gap-1.5',
                step.hideOnPhones ? 'hidden sm:inline-flex' : 'inline-flex',
              )}
            >
              <span className={cn('size-1.5 rounded-full', step.dot)} />
              {step.label}
            </span>
          ))}
        </TicketPart>
      </Ticket>
      {/* A little smaller than the app's stamp, so the quote number stays clear of it. */}
      <div className="absolute top-2 right-3 origin-top-right scale-[0.72] sm:scale-[0.88]">
        <Stamp tone="accepted" detail={`${SAMPLE_TIMES.day} · ${SAMPLE_TIMES.accepted}`} animate>
          Accepted
        </Stamp>
      </div>
    </div>
  );
}
