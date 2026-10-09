import { ArrowRight, Check } from 'lucide-react';
import { paths } from '@/app/paths';
import { ButtonLink } from '@/components/ui/ButtonLink';

const INCLUDED = [
  'Unlimited quotes, invoices and customers',
  'Service catalogue with saved prices',
  'Shareable quote and invoice links, with WhatsApp sharing',
  'Online accept or decline for customers',
  'PDF quotes and invoices with your brand colour',
  'Payment tracking and overdue alerts',
  '48 currencies, with tax and discounts',
];

export function Pricing() {
  return (
    <div className="mx-auto grid max-w-4xl overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm lg:grid-cols-[1fr_1.2fr]">
      <div className="flex flex-col justify-between gap-8 bg-zinc-950 p-8 text-white">
        <div>
          <p className="text-sm font-medium text-brand-300">Early access</p>
          <p className="mt-3 text-4xl font-semibold tracking-tight">Free</p>
          <p className="mt-3 text-sm leading-6 text-pretty text-zinc-300">
            Every feature is free while QuoteFlow is in early access. No card needed to sign up.
          </p>
        </div>
        <ButtonLink to={paths.register} size="lg" className="w-full">
          Start free
          <ArrowRight aria-hidden="true" />
        </ButtonLink>
      </div>
      <div className="p-8">
        <h3 className="text-sm font-semibold text-zinc-950">Everything that is included</h3>
        <ul className="mt-5 space-y-3">
          {INCLUDED.map((item) => (
            <li key={item} className="flex gap-3 text-sm text-zinc-700">
              <Check aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-brand-600" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
