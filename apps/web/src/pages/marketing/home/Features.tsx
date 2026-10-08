import {
  ArrowRightLeft,
  CircleCheckBig,
  FileText,
  type LucideIcon,
  MessageCircle,
  Users,
  Wallet,
} from 'lucide-react';

interface Feature {
  icon: LucideIcon;
  title: string;
  body: string;
}

const FEATURES: Feature[] = [
  {
    icon: FileText,
    title: 'Create professional quotes',
    body: 'Pick saved services, adjust quantities, add a discount and tax. Totals are calculated for you, in your currency.',
  },
  {
    icon: MessageCircle,
    title: 'Send via WhatsApp',
    body: 'Share a secure link in a WhatsApp message, or copy it anywhere. Customers need no account and no app.',
  },
  {
    icon: CircleCheckBig,
    title: 'Get customer approval',
    body: 'Customers open the quote on their phone and accept or decline in one tap. You see when it was viewed and answered.',
  },
  {
    icon: ArrowRightLeft,
    title: 'Convert quotes to invoices',
    body: 'Turn an accepted quote into an invoice with one click. Items, prices and customer details carry over.',
  },
  {
    icon: Wallet,
    title: 'Track payments',
    body: 'Record cash, transfer, card or mobile money payments as they arrive. Balances and overdue invoices update themselves.',
  },
  {
    icon: Users,
    title: 'Manage customers',
    body: 'Keep contact details and every quote and invoice for a customer in one place, ready for the next job.',
  },
];

export function Features() {
  return (
    <ul className="grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
      {FEATURES.map(({ icon: Icon, title, body }) => (
        <li key={title}>
          <span className="flex size-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700 ring-1 ring-brand-600/15">
            <Icon aria-hidden="true" className="size-5" strokeWidth={1.75} />
          </span>
          <h3 className="mt-4 text-base font-semibold text-zinc-950">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-pretty text-zinc-600">{body}</p>
        </li>
      ))}
    </ul>
  );
}
