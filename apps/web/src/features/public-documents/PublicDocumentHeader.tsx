import { Download } from 'lucide-react';
import { buttonClasses } from '@/components/ui/button-styles';

export interface PublicDocumentHeaderProps {
  /** E.g. 'Quote from' or 'Invoice from'. */
  eyebrow: string;
  businessName: string;
  pdfUrl: string;
  pdfFileName: string;
}

/** The page heading above the document, with the PDF download. */
export function PublicDocumentHeader({
  eyebrow,
  businessName,
  pdfUrl,
  pdfFileName,
}: PublicDocumentHeaderProps) {
  return (
    <div className="flex items-end justify-between gap-4 print:hidden">
      <h1 className="min-w-0">
        <span className="block text-sm font-normal text-zinc-500">{eyebrow}</span>
        <span className="block truncate text-lg font-semibold tracking-tight text-zinc-950 sm:text-xl">
          {businessName}
        </span>
      </h1>
      <a
        href={pdfUrl}
        download={pdfFileName}
        className={buttonClasses({ variant: 'secondary', size: 'md', className: 'shrink-0' })}
      >
        <Download aria-hidden="true" />
        <span>
          <span className="sm:hidden">PDF</span>
          <span className="hidden sm:inline">Download PDF</span>
        </span>
      </a>
    </div>
  );
}
