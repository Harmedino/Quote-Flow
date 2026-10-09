import { Check, FileDown, MessageCircle, X } from 'lucide-react';

/**
 * A static, illustrative rendering of the product built from markup (no
 * screenshots), so it stays crisp and matches the real interface. Hidden from
 * assistive technology: the section's text describes what it shows.
 */

const ITEMS = [
  { name: 'Deep clean, 3-bed apartment', detail: '1 × $240.00', amount: '$240.00' },
  { name: 'Oven and range hood degrease', detail: '1 × $65.00', amount: '$65.00' },
  { name: 'Interior windows', detail: '12 × $6.50', amount: '$78.00' },
];

function QuoteBuilderMock() {
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl shadow-zinc-900/5">
      <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="size-2.5 rounded-full bg-zinc-300" />
          <span className="size-2.5 rounded-full bg-zinc-300" />
          <span className="size-2.5 rounded-full bg-zinc-300" />
        </div>
        <span className="text-xs font-medium text-zinc-500">New quote · Q-0042</span>
        <span className="w-12" />
      </div>
      <div className="space-y-5 p-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <p className="text-xs font-medium text-zinc-500">Customer</p>
            <p className="mt-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-950">
              Grace Okafor
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-zinc-500">Valid until</p>
            <p className="mt-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-950">
              Oct 22, 2026
            </p>
          </div>
        </div>
        <div className="rounded-lg border border-zinc-200">
          <div className="grid grid-cols-[1fr_auto] border-b border-zinc-200 bg-zinc-50 px-3 py-2 text-[0.6875rem] font-semibold tracking-wide text-zinc-500 uppercase">
            <span>Item</span>
            <span>Amount</span>
          </div>
          {ITEMS.map((item) => (
            <div
              key={item.name}
              className="grid grid-cols-[1fr_auto] items-center gap-3 border-b border-zinc-100 px-3 py-2.5 last:border-0"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-zinc-950">{item.name}</p>
                <p className="text-xs text-zinc-500">{item.detail}</p>
              </div>
              <span className="text-sm font-medium text-zinc-950 tabular-nums">{item.amount}</span>
            </div>
          ))}
        </div>
        <div className="ml-auto max-w-56 space-y-1.5 text-sm">
          <div className="flex justify-between text-zinc-600">
            <span>Subtotal</span>
            <span className="tabular-nums">$383.00</span>
          </div>
          <div className="flex justify-between text-zinc-600">
            <span>Tax (8.25%)</span>
            <span className="tabular-nums">$31.60</span>
          </div>
          <div className="flex justify-between border-t border-zinc-200 pt-1.5 font-semibold text-zinc-950">
            <span>Total</span>
            <span className="tabular-nums">$414.60</span>
          </div>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700">
            <FileDown className="size-4" />
            PDF
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#1f9d55] px-3 py-2 text-sm font-medium text-white">
            <MessageCircle className="size-4" />
            Send on WhatsApp
          </span>
        </div>
      </div>
    </div>
  );
}

function PhoneQuoteMock() {
  return (
    <div className="mx-auto w-64 rounded-[2.25rem] border-[6px] border-zinc-900 bg-zinc-900 shadow-2xl shadow-zinc-900/20">
      <div className="overflow-hidden rounded-[1.75rem] bg-zinc-50">
        <div className="flex justify-center pt-2">
          <span className="h-1.5 w-16 rounded-full bg-zinc-900" />
        </div>
        <div className="space-y-3 px-4 pt-4 pb-5">
          <div>
            <p className="text-sm font-semibold text-brand-700">Evergreen Home Services</p>
            <p className="text-xs text-zinc-500">Quote Q-0042 for Grace Okafor</p>
          </div>
          <div className="rounded-xl bg-white p-3 ring-1 ring-zinc-200">
            <p className="text-xs text-zinc-500">Total</p>
            <p className="text-2xl font-semibold tracking-tight text-zinc-950 tabular-nums">
              $414.60
            </p>
            <p className="mt-0.5 text-xs text-zinc-500">Valid until Oct 22, 2026</p>
          </div>
          <div className="space-y-1.5 rounded-xl bg-white p-3 text-xs ring-1 ring-zinc-200">
            {ITEMS.map((item) => (
              <div key={item.name} className="flex justify-between gap-2">
                <span className="truncate text-zinc-700">{item.name}</span>
                <span className="text-zinc-950 tabular-nums">{item.amount}</span>
              </div>
            ))}
          </div>
          <span className="flex items-center justify-center gap-1.5 rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white">
            <Check className="size-4" />
            Accept quote
          </span>
          <span className="flex items-center justify-center gap-1.5 rounded-lg bg-white py-2.5 text-sm font-medium text-zinc-700 ring-1 ring-zinc-200">
            <X className="size-4" />
            Decline
          </span>
        </div>
      </div>
    </div>
  );
}

export function ProductPreview() {
  return (
    <div aria-hidden="true" className="grid items-center gap-10 lg:grid-cols-[1fr_auto] lg:gap-12">
      <QuoteBuilderMock />
      <div>
        <PhoneQuoteMock />
      </div>
    </div>
  );
}
