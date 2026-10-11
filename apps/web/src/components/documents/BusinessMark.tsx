import { useState } from 'react';
import { cn } from '@/lib/cn';
import { businessInitials, safeHttpUrl } from './document-format';

export interface BusinessMarkProps {
  name: string;
  logoUrl: string | null;
  className?: string;
}

/**
 * The business logo, or its initials on the brand color when there is no logo
 * or it fails to load. Expects the brand CSS variables from `brandColorVars`.
 */
export function BusinessMark({ name, logoUrl, className }: BusinessMarkProps) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const src = safeHttpUrl(logoUrl);

  if (src && failedUrl !== src) {
    return (
      <img
        src={src}
        alt={`${name} logo`}
        onError={() => setFailedUrl(src)}
        className={cn(
          'size-11 shrink-0 rounded-[10px] bg-surface object-contain shadow-[0_0_0_1px_var(--color-line)] sm:size-12',
          className,
        )}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex size-11 shrink-0 items-center justify-center rounded-[10px] bg-(--doc-accent) text-base font-[780] tracking-[0.02em] text-(--doc-on-accent) font-stretch-112% sm:size-12 [print-color-adjust:exact]',
        className,
      )}
    >
      {businessInitials(name)}
    </span>
  );
}
