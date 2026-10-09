import type { DashboardDto } from '@quoteflow/shared';
import {
  CircleCheck,
  Clock,
  FileText,
  HandCoins,
  type LucideIcon,
  Receipt,
  Wallet,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { formatMoney } from '@/lib/format';

interface Tile {
  label: string;
  value: string;
  hint: string;
  icon: LucideIcon;
}

function StatTile({ label, value, hint, icon: Icon }: Tile) {
  return (
    <Card className="p-3.5 sm:p-5">
      <dt className="flex items-center gap-2 text-xs leading-tight font-medium text-zinc-600 sm:text-sm">
        <Icon aria-hidden="true" className="hidden size-4 shrink-0 text-zinc-400 sm:block" />
        {label}
      </dt>
      <dd className="mt-2 truncate text-xl font-semibold tracking-tight text-zinc-950 tabular-nums sm:text-2xl">
        {value}
      </dd>
      <dd className="mt-1 text-xs leading-tight text-zinc-500">{hint}</dd>
    </Card>
  );
}

export function StatTiles({ dashboard }: { dashboard: DashboardDto }) {
  const { quotes, invoices, currency } = dashboard;
  const money = (minor: number) => formatMoney(minor, currency);
  const quoteTiles: Tile[] = [
    { label: 'Total quotes', value: String(quotes.total), hint: 'All time', icon: FileText },
    { label: 'Pending', value: String(quotes.pending), hint: 'Awaiting reply', icon: Clock },
    { label: 'Accepted', value: String(quotes.accepted), hint: 'Approved', icon: CircleCheck },
  ];
  const moneyTiles: Tile[] = [
    {
      label: 'Total invoiced',
      value: money(invoices.totalInvoiced),
      hint: 'Issued invoices',
      icon: Receipt,
    },
    {
      label: 'Amount paid',
      value: money(invoices.amountPaid),
      hint: 'Payments recorded',
      icon: HandCoins,
    },
    {
      label: 'Outstanding',
      value: money(invoices.outstanding),
      hint: 'Still to collect',
      icon: Wallet,
    },
  ];

  return (
    <section aria-label="Key figures" className="space-y-4">
      <dl className="grid grid-cols-3 gap-3 sm:gap-4">
        {quoteTiles.map((tile) => (
          <StatTile key={tile.label} {...tile} />
        ))}
      </dl>
      <dl className="grid gap-3 sm:grid-cols-3 sm:gap-4">
        {moneyTiles.map((tile) => (
          <StatTile key={tile.label} {...tile} />
        ))}
      </dl>
    </section>
  );
}
