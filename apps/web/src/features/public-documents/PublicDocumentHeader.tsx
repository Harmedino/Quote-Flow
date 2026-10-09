import type { PublicBusinessDto } from '@quoteflow/shared';
import { BusinessMark } from '@/components/documents/BusinessMark';
import { ContactLinks } from './ContactLinks';
import { DownloadPdfLink } from './DownloadPdfLink';

export interface PublicDocumentHeaderProps {
  business: PublicBusinessDto;
  /** E.g. 'Quote from' or 'Invoice from'. */
  eyebrow: string;
  /** One line about the document, e.g. 'Quote QT-0001 · Valid until Oct 15, 2026'. */
  summary: string;
  /** E.g. 'Quote QT-0001', used in the WhatsApp message and email subject. */
  documentLabel: string;
  pdfUrl: string;
  pdfFileName: string;
}

/**
 * The card at the top of a customer's page: who the document is from, how to
 * reach them and the PDF (in the summary beside the document on wide screens).
 * Expects the brand CSS variables from `brandColorVars`.
 */
export function PublicDocumentHeader({
  business,
  eyebrow,
  summary,
  documentLabel,
  pdfUrl,
  pdfFileName,
}: PublicDocumentHeaderProps) {
  return (
    <header className="animate-fade-in-up rounded-3xl border border-stone-200 bg-surface p-5 shadow-[0_20px_50px_-20px_rgb(12_26_20/0.3)] sm:p-7 print:hidden">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        {/* The faint ring keeps a near-black brand tile visible on the dark card. */}
        <BusinessMark
          name={business.name}
          logoUrl={business.logoUrl}
          className="shadow-lg dark:ring-1 dark:ring-white/15"
        />
        <div className="min-w-0 flex-1">
          <h1>
            <span className="block font-sans text-sm font-normal tracking-normal text-stone-500">
              {eyebrow}
            </span>
            <span className="mt-0.5 block text-2xl font-extrabold wrap-break-word text-stone-900 sm:text-3xl">
              {business.name}
            </span>
          </h1>
          <p className="mt-1.5 text-sm text-stone-600">{summary}</p>
          <ContactLinks business={business} documentLabel={documentLabel} className="mt-4" />
        </div>
        <DownloadPdfLink href={pdfUrl} fileName={pdfFileName} className="lg:hidden" />
      </div>
    </header>
  );
}
