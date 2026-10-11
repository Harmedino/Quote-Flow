import type {
  CurrencyCode,
  CustomerSnapshotDto,
  DiscountDto,
  LineItemDto,
  PublicBusinessDto,
  TotalsDto,
} from '@quoteflow/shared';
import type { ReactNode } from 'react';
import { Stamp, type StampTone } from '@/components/ui/Stamp';
import { cn } from '@/lib/cn';
import { formatCalendarDate } from '@/lib/format';
import { brandColorVars } from './brand-color';
import { BusinessMark } from './BusinessMark';
import { DocumentItems } from './DocumentItems';
import { DocumentTotals } from './DocumentTotals';
import { formatAddressLines, safeHttpUrl, telHref, websiteLabel } from './document-format';

/** A rubber stamp across the ticket's stub, for an answer or outcome that is settled. */
export interface DocumentStamp {
  tone: StampTone;
  /** The word on the stamp, e.g. "Accepted". */
  label: string;
  /** A mono line under it, e.g. "Oct 5 · 10:47". */
  detail?: string;
  /** Drops the stamp in: only when the status changed while the page was open. */
  animate?: boolean;
}

export interface SalesDocumentProps {
  kind: 'quote' | 'invoice';
  number: string;
  business: PublicBusinessDto;
  customer: CustomerSnapshotDto;
  currency: CurrencyCode;
  /** 'YYYY-MM-DD'. */
  issueDate: string;
  /**
   * E.g. { label: 'Valid until', value: expiryDate } or { label: 'Due date', value: dueDate };
   * value is 'YYYY-MM-DD'. `note` is a short line under it in the brand colour, e.g. "9 days left".
   */
  secondaryDate: { label: string; value: string; note?: string };
  items: LineItemDto[];
  discount: DiscountDto;
  taxRate: number;
  totals: TotalsDto;
  /** Invoices: shown under the total, with the balance due as the highlighted figure. */
  amountPaid?: number;
  balanceDue?: number;
  notes: string | null;
  terms: string | null;
  /** Shown at the top of the stub, e.g. a status tag. */
  status?: ReactNode;
  /** Stamped beside the number. A declined stamp also strikes through the total. */
  stamp?: DocumentStamp;
  /**
   * 'print-only' when the page already says who sent it (the customer's page, whose band is not
   * printed): on screen the ticket then goes straight from the stub to the recipient.
   */
  sender?: 'show' | 'print-only';
}

const TITLES = { quote: 'Quotation', invoice: 'Invoice' } as const;
const RECIPIENT_LABELS = { quote: 'Prepared for', invoice: 'Bill to' } as const;
/** One padding for every part of the ticket, so the columns line up across the perforations. */
const PART = 'px-5 py-5 sm:px-8 sm:py-6';

function BusinessContact({ business }: { business: PublicBusinessDto }) {
  const website = safeHttpUrl(business.website);
  const link = 'underline-offset-2 hover:text-ink hover:underline';
  return (
    <div className="mt-1 space-y-0.5 text-sm text-ink-2">
      {formatAddressLines(business.address).map((line, index) => (
        <p key={index}>{line}</p>
      ))}
      {business.phone && (
        <p>
          <a href={telHref(business.phone)} className={link}>
            {business.phone}
          </a>
        </p>
      )}
      {business.email && (
        <p className="wrap-anywhere">
          <a href={`mailto:${business.email}`} className={link}>
            {business.email}
          </a>
        </p>
      )}
      {website && (
        <p className="wrap-anywhere">
          <a href={website} target="_blank" rel="noopener noreferrer" className={link}>
            {websiteLabel(website)}
          </a>
        </p>
      )}
    </div>
  );
}

function Sender({ business, className }: { business: PublicBusinessDto; className?: string }) {
  return (
    <div className={cn('min-w-0', className)}>
      <h3 className="label-mono text-muted">From</h3>
      <div className="mt-2.5 flex items-start gap-3">
        <BusinessMark name={business.name} logoUrl={business.logoUrl} />
        <div className="min-w-0">
          <p className="text-base leading-snug font-bold wrap-break-word font-stretch-105%">
            {business.name}
          </p>
          <BusinessContact business={business} />
        </div>
      </div>
    </div>
  );
}

function Recipient({ customer, label }: { customer: CustomerSnapshotDto; label: string }) {
  return (
    <div className="min-w-0">
      <h3 className="label-mono text-muted">{label}</h3>
      <p className="mt-2.5 text-base leading-snug font-bold wrap-break-word font-stretch-105%">
        {customer.name}
      </p>
      <div className="mt-1 space-y-0.5 text-sm text-ink-2">
        {customer.company && <p className="wrap-break-word">{customer.company}</p>}
        {formatAddressLines(customer.address).map((line, index) => (
          <p key={index}>{line}</p>
        ))}
        {customer.email && <p className="wrap-anywhere">{customer.email}</p>}
        {customer.phone && <p>{customer.phone}</p>}
      </div>
    </div>
  );
}

function TextBlock({ title, text }: { title: string; text: string }) {
  return (
    <section className="break-inside-avoid">
      <h3 className="label-mono text-muted">{title}</h3>
      <p className="mt-2 text-sm/6 wrap-break-word whitespace-pre-line text-ink-2">{text}</p>
    </section>
  );
}

function DateTerm({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div>
      <dt className="label-mono text-muted">{label}</dt>
      <dd className="mt-1.5 text-[15px] font-[650]">{formatCalendarDate(value)}</dd>
      {note && <dd className="text-[12.5px] font-[650] text-(--doc-accent-text)">{note}</dd>}
    </div>
  );
}

/**
 * A quote or invoice as a paper job ticket: a stub in the business's colour carrying the number
 * and dates, then who it is from and for, the job and its total, and the notes, joined by
 * perforations. It stays light in dark mode, as printed. Presentational only: used by the public
 * pages and the business-side previews alike.
 */
export function SalesDocument({
  kind,
  number,
  business,
  customer,
  currency,
  issueDate,
  secondaryDate,
  items,
  discount,
  taxRate,
  totals,
  amountPaid,
  balanceDue,
  notes,
  terms,
  status,
  stamp,
  sender = 'show',
}: SalesDocumentProps) {
  const senderOnScreen = sender === 'show';
  return (
    <article
      aria-label={`${TITLES[kind]} ${number}`}
      style={brandColorVars(business.brandColor)}
      // `scheme-light` keeps the paper light in dark mode: it is the customer's document.
      className="scheme-light text-ink"
    >
      <div className="ticket-col lift [--notch:10px] print:filter-none">
        <header className={`bg-(--doc-accent-soft) ${PART} [print-color-adjust:exact]`}>
          <div className="flex min-h-5.5 items-center justify-between gap-3">
            <p className="label-mono text-ink-2">{TITLES[kind]}</p>
            {status}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
            <div className="min-w-0">
              <h2 className="mt-2 text-[27px] leading-none font-[820] tracking-[-0.01em] wrap-anywhere font-stretch-125%">
                {number}
              </h2>
              <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 sm:flex sm:gap-x-12">
                <DateTerm label="Issued" value={issueDate} />
                <DateTerm {...secondaryDate} />
              </dl>
            </div>
            {stamp && (
              <Stamp
                tone={stamp.tone}
                detail={stamp.detail}
                animate={stamp.animate}
                className="my-1 mr-2 ml-auto"
              >
                {stamp.label}
              </Stamp>
            )}
          </div>
        </header>

        <section
          aria-label={senderOnScreen ? 'From and to' : RECIPIENT_LABELS[kind]}
          className={cn(
            'grid gap-6',
            senderOnScreen ? 'sm:grid-cols-2 sm:gap-10' : 'print:grid-cols-2 print:gap-10',
            PART,
          )}
        >
          <Sender
            business={business}
            className={senderOnScreen ? undefined : 'hidden print:block'}
          />
          <Recipient customer={customer} label={RECIPIENT_LABELS[kind]} />
        </section>

        <section aria-label="The job" className={PART}>
          <DocumentItems items={items} currency={currency} />
          <DocumentTotals
            currency={currency}
            discount={discount}
            taxRate={taxRate}
            totals={totals}
            amountPaid={amountPaid}
            balanceDue={balanceDue}
            totalLabel={kind === 'quote' ? 'Total to pay' : 'Total'}
            struck={stamp?.tone === 'declined'}
            className="mt-4 sm:ml-auto sm:max-w-sm"
          />
        </section>

        {(notes || terms) && (
          <div className={`grid gap-5 sm:grid-cols-2 sm:gap-10 ${PART}`}>
            {notes && <TextBlock title="Notes" text={notes} />}
            {terms && <TextBlock title="Terms & conditions" text={terms} />}
          </div>
        )}
      </div>
    </article>
  );
}
