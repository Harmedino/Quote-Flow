import type {
  CurrencyCode,
  CustomerSnapshotDto,
  DiscountDto,
  LineItemDto,
  PublicBusinessDto,
  TotalsDto,
} from '@quoteflow/shared';
import type { ReactNode } from 'react';
import { formatCalendarDate } from '@/lib/format';
import './paper.css';
import { brandColorVars } from './brand-color';
import { BusinessMark } from './BusinessMark';
import { DocumentItems } from './DocumentItems';
import { DocumentTotals } from './DocumentTotals';
import { formatAddressLines, safeHttpUrl, telHref, websiteLabel } from './document-format';

export interface SalesDocumentProps {
  kind: 'quote' | 'invoice';
  number: string;
  business: PublicBusinessDto;
  customer: CustomerSnapshotDto;
  currency: CurrencyCode;
  /** 'YYYY-MM-DD'. */
  issueDate: string;
  /** E.g. { label: 'Valid until', value: expiryDate } or { label: 'Due date', value: dueDate }; value is 'YYYY-MM-DD'. */
  secondaryDate: { label: string; value: string };
  items: LineItemDto[];
  discount: DiscountDto;
  taxRate: number;
  totals: TotalsDto;
  /** Invoices: shown under the total, with the balance due as the highlighted figure. */
  amountPaid?: number;
  balanceDue?: number;
  notes: string | null;
  terms: string | null;
  /** Rendered under the document number, e.g. a status badge. */
  status?: ReactNode;
}

const LABEL = 'text-xs font-medium tracking-wider text-stone-500 uppercase';

const TITLES = { quote: 'Quotation', invoice: 'Invoice' } as const;
const RECIPIENT_LABELS = { quote: 'Prepared for', invoice: 'Bill to' } as const;

function BusinessContact({ business }: { business: PublicBusinessDto }) {
  const website = safeHttpUrl(business.website);
  return (
    <div className="mt-1.5 space-y-0.5 text-sm text-stone-600">
      {formatAddressLines(business.address).map((line, index) => (
        <p key={index}>{line}</p>
      ))}
      {business.phone && (
        <p>
          <a href={telHref(business.phone)} className="hover:text-stone-900">
            {business.phone}
          </a>
        </p>
      )}
      {business.email && (
        <p className="wrap-anywhere">
          <a href={`mailto:${business.email}`} className="hover:text-stone-900">
            {business.email}
          </a>
        </p>
      )}
      {website && (
        <p className="wrap-anywhere">
          <a
            href={website}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-stone-900"
          >
            {websiteLabel(website)}
          </a>
        </p>
      )}
    </div>
  );
}

function Recipient({ customer, label }: { customer: CustomerSnapshotDto; label: string }) {
  return (
    <div className="min-w-0">
      <h3 className={LABEL}>{label}</h3>
      <p className="mt-2 font-semibold wrap-break-word text-stone-900">{customer.name}</p>
      <div className="mt-0.5 space-y-0.5 text-sm text-stone-600">
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
      <h3 className={LABEL}>{title}</h3>
      <p className="mt-2 text-sm/6 wrap-break-word whitespace-pre-line text-stone-600">{text}</p>
    </section>
  );
}

/**
 * A quote or invoice laid out like a printed business document, tinted with the
 * business's brand color. Presentational only: used by the public pages and the
 * business-side previews alike.
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
}: SalesDocumentProps) {
  return (
    <article
      aria-label={`${TITLES[kind]} ${number}`}
      style={brandColorVars(business.brandColor)}
      // `doc-paper` keeps the sheet light in dark mode: it is the customer's document.
      className="doc-paper overflow-hidden rounded-2xl border border-stone-200 bg-surface text-stone-900 print:rounded-none print:border-0"
    >
      <div aria-hidden="true" className="h-1.5 bg-(--doc-accent) [print-color-adjust:exact]" />
      <div className="px-5 py-7 sm:px-10 sm:py-10">
        <header className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between sm:gap-10">
          <div className="flex min-w-0 items-start gap-4">
            <BusinessMark name={business.name} logoUrl={business.logoUrl} />
            <div className="min-w-0 pt-0.5">
              <p className="font-display text-lg font-semibold tracking-tight wrap-break-word text-stone-900">
                {business.name}
              </p>
              <BusinessContact business={business} />
            </div>
          </div>
          <div className="shrink-0 sm:text-right">
            <p className="text-xs font-semibold tracking-[0.16em] text-(--doc-accent-text) uppercase">
              {TITLES[kind]}
            </p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight wrap-anywhere text-stone-900">
              {number}
            </h2>
            {status && <div className="mt-3 flex sm:justify-end">{status}</div>}
          </div>
        </header>

        <div className="mt-8 grid gap-6 rounded-2xl bg-stone-50 p-5 sm:mt-10 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-10 sm:p-6 print:bg-transparent print:p-0">
          <Recipient customer={customer} label={RECIPIENT_LABELS[kind]} />
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-1 sm:content-start sm:text-right">
            <div>
              <dt className={LABEL}>Issue date</dt>
              <dd className="mt-1.5 text-sm font-medium text-stone-900">
                {formatCalendarDate(issueDate)}
              </dd>
            </div>
            <div>
              <dt className={LABEL}>{secondaryDate.label}</dt>
              <dd className="mt-1.5 text-sm font-medium text-stone-900">
                {formatCalendarDate(secondaryDate.value)}
              </dd>
            </div>
          </dl>
        </div>

        <div className="mt-8 sm:mt-10">
          <DocumentItems items={items} currency={currency} />
        </div>

        <div className="mt-2 flex justify-end border-t border-stone-200 pt-6">
          <DocumentTotals
            currency={currency}
            discount={discount}
            taxRate={taxRate}
            totals={totals}
            amountPaid={amountPaid}
            balanceDue={balanceDue}
          />
        </div>

        {(notes || terms) && (
          <div className="mt-10 grid gap-8 border-t border-stone-100 pt-8 sm:grid-cols-2">
            {notes && <TextBlock title="Notes" text={notes} />}
            {terms && <TextBlock title="Terms & conditions" text={terms} />}
          </div>
        )}
      </div>
    </article>
  );
}
