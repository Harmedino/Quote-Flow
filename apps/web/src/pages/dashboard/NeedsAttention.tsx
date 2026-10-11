import type { DashboardDto } from '@quoteflow/shared';
import {
  ArrowRight,
  ChevronRight,
  Eye,
  FileCheck,
  ListChecks,
  type LucideIcon,
  TriangleAlert,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router';
import { paths } from '@/app/paths';
import { TextLink } from '@/components/ui/TextLink';
import { useAuthenticatedSession } from '@/features/auth/use-session';
import { type AttentionItem, attentionItems } from '@/features/dashboard/attention';
import { formatShortDate, plural } from '@/features/dashboard/dashboard-format';
import type { ChecklistItem } from '@/features/dashboard/getting-started';
import { buildQuoteShare } from '@/features/quotes/quote-share';
import { useConvertQuote } from '@/features/quotes/use-quotes';
import { getErrorMessage } from '@/lib/api-client';
import { cn } from '@/lib/cn';
import { formatMoney } from '@/lib/format';
import { DashboardPanel, PanelCount } from './DashboardPanel';

const OVERDUE_INVOICES = `${paths.invoices}?status=overdue`;

/** Shared look of the action under a job: TextLink's, for the links and the button alike. */
const ACTION_CLASSES =
  'rounded-sm text-[13px] font-[650] text-primary-ink underline-offset-[3px] hover:underline disabled:opacity-60 [&_svg]:ml-1 [&_svg]:inline-block [&_svg]:size-4 [&_svg]:stroke-[2.4] [&_svg]:align-[-3px]';

/** Converts the accepted quote into a draft invoice and opens it, as on the quote page. */
function CreateInvoiceButton({ quoteId }: { quoteId: string }) {
  const navigate = useNavigate();
  const convert = useConvertQuote();
  return (
    <>
      <button
        type="button"
        disabled={convert.isPending}
        onClick={() =>
          convert.mutate(quoteId, {
            onSuccess: (invoice) => void navigate(paths.invoice(invoice.id)),
          })
        }
        className={ACTION_CLASSES}
      >
        {convert.isPending ? 'Creating invoice…' : 'Create invoice'}
        <ArrowRight aria-hidden="true" />
      </button>
      {convert.isError && (
        <span role="alert" className="mt-1 block text-[13px] text-danger">
          {getErrorMessage(convert.error)}
        </span>
      )}
    </>
  );
}

interface JobView {
  key: string;
  icon: LucideIcon;
  tone: 'overdue' | 'ready' | 'viewed' | 'setup';
  title: string;
  detail: ReactNode;
  /** Where the whole card leads on a phone. */
  to: string;
  /** The action under the detail from `lg`. */
  action: ReactNode;
}

const TILES: Record<JobView['tone'], string> = {
  overdue: 'bg-overdue-fill text-white',
  ready: 'bg-primary text-on-primary',
  viewed: 'bg-viewed-tint text-viewed',
  setup: 'bg-surface text-ink-2 shadow-[inset_0_0_0_1px_var(--color-line-strong)]',
};

function Mono({ children }: { children: ReactNode }) {
  return <span className="font-mono text-xs">{children}</span>;
}

function useJobView(): (item: AttentionItem) => JobView {
  const { business } = useAuthenticatedSession();
  return (item) => {
    if (item.kind === 'overdue') {
      return {
        key: 'overdue',
        icon: TriangleAlert,
        tone: 'overdue',
        title: `${plural(item.count, 'invoice')} ${item.count === 1 ? 'is' : 'are'} overdue`,
        detail: (
          <>
            {item.amount > 0 && (
              <>
                <Mono>{formatMoney(item.amount, business.currency)}</Mono> past due
              </>
            )}
            {item.amount > 0 && item.oldestDays !== null && ' · '}
            {item.oldestDays !== null && `oldest ${plural(item.oldestDays, 'day')}`}
          </>
        ),
        to: OVERDUE_INVOICES,
        action: (
          <TextLink to={OVERDUE_INVOICES} className="text-[13px]">
            Review overdue
            <ArrowRight aria-hidden="true" />
          </TextLink>
        ),
      };
    }
    if (item.kind === 'setup') {
      return {
        key: 'setup',
        icon: ListChecks,
        tone: 'setup',
        title: 'Finish setting up',
        detail: (
          <>
            <Mono>
              {item.done} of {item.total}
            </Mono>{' '}
            steps done · next: {item.next.title.toLowerCase()}
          </>
        ),
        to: item.next.to,
        action: (
          <TextLink to={item.next.to} className="text-[13px]">
            {item.next.action}
            <ArrowRight aria-hidden="true" />
          </TextLink>
        ),
      };
    }
    const { quote } = item;
    if (item.kind === 'ready') {
      return {
        key: quote.id,
        icon: FileCheck,
        tone: 'ready',
        title: `${quote.customerName} said yes`,
        detail: (
          <>
            <Mono>
              {quote.quoteNumber} · {formatMoney(quote.total, quote.currency)}
            </Mono>{' '}
            to invoice
          </>
        ),
        to: paths.quote(quote.id),
        action: <CreateInvoiceButton quoteId={quote.id} />,
      };
    }
    const share = buildQuoteShare({
      origin: window.location.origin,
      publicToken: item.quote.publicToken,
      quoteNumber: quote.quoteNumber,
      businessName: business.name,
      customerName: quote.customerName,
      customerPhone: item.quote.customerPhone,
    });
    return {
      key: quote.id,
      icon: Eye,
      tone: 'viewed',
      title: `${quote.customerName} opened your quote`,
      detail: (
        <>
          <Mono>{quote.quoteNumber}</Mono> · no answer yet, valid to{' '}
          {formatShortDate(quote.expiryDate)}
        </>
      ),
      to: paths.quote(quote.id),
      action: (
        <a href={share.whatsAppUrl} target="_blank" rel="noreferrer" className={ACTION_CLASSES}>
          Follow up on WhatsApp
          <span className="sr-only"> (opens WhatsApp)</span>
          <ArrowRight aria-hidden="true" />
        </a>
      ),
    };
  };
}

/**
 * One job. From `lg` it carries its action (review, create the invoice, follow up); on a phone
 * the whole card opens the invoice list or the quote, as the concept's chevron rows do.
 */
function Job({ job }: { job: JobView }) {
  const Icon = job.icon;
  const overdue = job.tone === 'overdue';
  return (
    <li
      className={cn(
        'relative grid grid-cols-[34px_minmax(0,1fr)_18px] items-center gap-3 overflow-hidden rounded-[11px] p-3 lg:grid-cols-[34px_minmax(0,1fr)] lg:items-start lg:rounded-[10px] lg:py-3.5 lg:pr-3.5',
        overdue
          ? 'bg-overdue-tint'
          : 'bg-surface shadow-(--shadow-card) lg:bg-surface-muted lg:shadow-none',
      )}
    >
      {overdue && (
        <span
          aria-hidden="true"
          className="absolute inset-y-0 left-0 w-1 hazard-tape-overdue lg:right-0 lg:left-auto lg:w-2.5 lg:opacity-55"
        />
      )}
      <span
        aria-hidden="true"
        className={cn('flex size-[34px] items-center justify-center rounded-lg', TILES[job.tone])}
      >
        <Icon className="size-[18px]" />
      </span>
      <div className="min-w-0">
        <h3 className="text-[14.5px] leading-tight font-bold text-ink">{job.title}</h3>
        <p className="mt-0.5 text-[12.5px] leading-snug text-ink-2 lg:text-[13px]">{job.detail}</p>
        <div className="relative z-10 mt-1.5 max-lg:hidden">{job.action}</div>
      </div>
      <Link
        to={job.to}
        className="absolute inset-0 rounded-[inherit] focus-visible:outline-offset-[-2px] lg:hidden"
      >
        <span className="sr-only">{job.title}</span>
      </Link>
      <ChevronRight aria-hidden="true" className="size-[18px] text-muted lg:hidden" />
    </li>
  );
}

/**
 * What needs the owner today: overdue money, quotes to invoice, quotes opened but unanswered,
 * and any setup steps left.
 */
export function NeedsAttention({
  dashboard,
  today,
  checklist,
  className,
}: {
  dashboard: DashboardDto;
  today: string;
  checklist: readonly ChecklistItem[];
  className?: string;
}) {
  const { items, total } = attentionItems(dashboard, today, checklist);
  const toView = useJobView();
  const shown = items.length < total ? `${items.length} of ${total} jobs` : plural(total, 'job');

  return (
    <DashboardPanel
      title="Needs attention"
      aside={total > 0 && <PanelCount>{shown}</PanelCount>}
      phoneCard={false}
      className={cn('lg:flex lg:flex-col', className)}
      headerClassName="lg:px-5"
    >
      {items.length === 0 ? (
        <p className="rounded-[10px] border-[1.5px] border-dashed border-line-strong px-4 py-5 text-center text-[13.5px] text-muted lg:mx-5 lg:mb-5">
          <span className="block text-[14.5px] font-bold text-ink">You’re all caught up</span>
          Overdue invoices, accepted quotes to invoice and quotes your customers opened show up
          here.
        </p>
      ) : (
        <ul className="grid gap-2 lg:gap-2.5 lg:px-5 lg:pb-5">
          {items.map((item) => {
            const job = toView(item);
            return <Job key={job.key} job={job} />;
          })}
        </ul>
      )}
    </DashboardPanel>
  );
}
