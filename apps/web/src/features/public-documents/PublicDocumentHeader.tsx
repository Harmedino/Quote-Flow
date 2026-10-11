import type { PublicBusinessDto } from '@quoteflow/shared';
import { BusinessMark } from '@/components/documents/BusinessMark';
import { formatAddressLines } from '@/components/documents/document-format';
import { ContactLinks } from './ContactLinks';
import { DocumentBand } from './DocumentBand';

export interface PublicDocumentHeaderProps {
  business: PublicBusinessDto;
  /** Who the document is for, e.g. 'Quote for Musa Ibrahim'. */
  eyebrow: string;
  /** The document's date, e.g. 'Oct 5, 2026'. */
  date: string;
  /** E.g. 'Quote LHS-Q-0014', used in the WhatsApp message and email subject. */
  documentLabel: string;
}

/**
 * The band at the top of a customer's page, in the business's colour: who sent the document and
 * how to reach them. The monogram is inverted (brand letters on a white tile) so it stands out
 * on its own colour. Expects the variables from `brandPageVars`.
 */
export function PublicDocumentHeader({
  business,
  eyebrow,
  date,
  documentLabel,
}: PublicDocumentHeaderProps) {
  const address = formatAddressLines(business.address).join(', ');
  return (
    <DocumentBand tone="brand">
      <header>
        <div className="flex items-center justify-between gap-4 label-mono">
          <p className="min-w-0 truncate">{eyebrow}</p>
          <p className="shrink-0">{date}</p>
        </div>
        <div className="mt-4.5 flex flex-col gap-4 lg:mt-6 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
          <div className="flex min-w-0 items-center gap-3.5 lg:gap-4.5">
            <span className="flex size-13 shrink-0 items-center justify-center rounded-xl bg-white shadow-[0_1px_0_rgb(0_0_0/0.1)] ring-1 ring-(--doc-fill-edge) [--doc-accent:transparent] [--doc-on-accent:var(--doc-accent-text)] lg:size-16">
              <BusinessMark name={business.name} logoUrl={business.logoUrl} />
            </span>
            <div className="min-w-0">
              <h1 className="text-[22px] leading-[1.12] font-extrabold tracking-[-0.015em] wrap-break-word font-stretch-115% lg:text-[32px]">
                {business.name}
              </h1>
              {address && <p className="mt-0.5 text-sm lg:mt-1 lg:text-[15px]">{address}</p>}
            </div>
          </div>
          <ContactLinks business={business} documentLabel={documentLabel} />
        </div>
      </header>
    </DocumentBand>
  );
}
