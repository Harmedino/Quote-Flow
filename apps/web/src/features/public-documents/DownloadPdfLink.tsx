import { Download } from 'lucide-react';
import { buttonClasses } from '@/components/ui/button-styles';

export function DownloadPdfLink({
  href,
  fileName,
  className,
}: {
  href: string;
  fileName: string;
  className?: string;
}) {
  return (
    <a
      href={href}
      download={fileName}
      className={buttonClasses({ variant: 'secondary', size: 'lg', className })}
    >
      <Download aria-hidden="true" />
      Download PDF
    </a>
  );
}
