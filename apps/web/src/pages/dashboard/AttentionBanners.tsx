import type { DashboardDto } from '@quoteflow/shared';
import { paths } from '@/app/paths';
import { Alert, type AlertTone } from '@/components/ui/Alert';
import { TextLink } from '@/components/ui/TextLink';
import { plural } from '@/features/dashboard/dashboard-format';
import type { ChecklistItem } from '@/features/dashboard/getting-started';
import { formatMoney } from '@/lib/format';

interface Banner {
  key: string;
  tone: AlertTone;
  message: string;
  to: string;
  action: string;
}

/** More than two stacked banners crowd out the figures under them. */
const MAX_BANNERS = 2;

function banners(dashboard: DashboardDto, checklist: readonly ChecklistItem[]): Banner[] {
  const { quotes, invoices, currency } = dashboard;
  const list: Banner[] = [];
  const open = checklist.filter((item) => !item.done);
  const nextStep = open[0];
  if (nextStep) {
    const percent = Math.round(((checklist.length - open.length) / checklist.length) * 100);
    list.push({
      key: 'setup',
      tone: 'success',
      message: `Your setup is ${percent}% complete, ${plural(open.length, 'step')} left.`,
      to: nextStep.to,
      action: 'Finish setup',
    });
  }
  if (invoices.overdueCount > 0) {
    const amount =
      invoices.overdueAmount > 0
        ? ` ${formatMoney(invoices.overdueAmount, currency)} is past due.`
        : '';
    list.push({
      key: 'overdue',
      tone: 'danger',
      message: `${plural(invoices.overdueCount, 'invoice')} ${invoices.overdueCount === 1 ? 'is' : 'are'} overdue.${amount}`,
      to: `${paths.invoices}?status=overdue`,
      action: 'Review overdue',
    });
  }
  if (quotes.acceptedNotInvoiced > 0) {
    list.push({
      key: 'to-invoice',
      tone: 'warning',
      message: `${plural(quotes.acceptedNotInvoiced, 'accepted quote')} ${quotes.acceptedNotInvoiced === 1 ? 'is' : 'are'} ready to invoice.`,
      to: `${paths.quotes}?status=accepted`,
      action: 'Review accepted',
    });
  }
  return list.slice(0, MAX_BANNERS);
}

/**
 * ServiceBook's slim banners, only for what needs the owner to act. Quotes waiting for an answer
 * have no banner: the "Awaiting an answer" figure already shows them.
 */
export function AttentionBanners({
  dashboard,
  checklist,
}: {
  dashboard: DashboardDto;
  checklist: readonly ChecklistItem[];
}) {
  const list = banners(dashboard, checklist);
  if (list.length === 0) return null;
  return (
    <div className="space-y-2">
      {list.map((banner) => (
        <Alert
          key={banner.key}
          variant="banner"
          tone={banner.tone}
          action={<TextLink to={banner.to}>{banner.action}</TextLink>}
        >
          {banner.message}
        </Alert>
      ))}
    </div>
  );
}
