import { Card } from '@/components/ui/Card';
import { BrandPreview } from './BrandPreview';

export interface BusinessPreviewRailProps {
  color: string;
  businessName: string;
  /** Example numbers for new documents, or null while a prefix is invalid. */
  quoteNumber: string | null;
  invoiceNumber: string | null;
}

/**
 * Beside the business form from `lg`: what customers will see and how new documents are
 * numbered, kept in view while the owner edits.
 */
export function BusinessPreviewRail({
  color,
  businessName,
  quoteNumber,
  invoiceNumber,
}: BusinessPreviewRailProps) {
  const numbers = [
    { label: 'Quotes', value: quoteNumber },
    { label: 'Invoices', value: invoiceNumber },
  ];
  return (
    <aside aria-label="Preview" className="hidden lg:sticky lg:top-[5.75rem] lg:block">
      <Card className="p-5">
        <BrandPreview color={color} businessName={businessName} />
        <dl className="mt-5 space-y-2 border-t-[1.5px] border-dashed border-line-strong pt-4">
          {numbers.map(({ label, value }) => (
            <div key={label} className="flex items-baseline justify-between gap-3 text-sm">
              <dt className="text-muted">{label} are numbered like</dt>
              <dd className="font-mono text-[13px] font-semibold text-ink">{value ?? '—'}</dd>
            </div>
          ))}
        </dl>
      </Card>
    </aside>
  );
}
