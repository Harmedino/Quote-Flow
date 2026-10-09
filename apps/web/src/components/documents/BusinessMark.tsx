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
          'size-12 shrink-0 rounded-xl border border-stone-200 bg-surface object-contain sm:size-14',
          className,
        )}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex size-12 shrink-0 items-center justify-center rounded-xl bg-(--doc-accent) font-display text-lg font-bold tracking-tight text-(--doc-on-accent) sm:size-14 sm:text-xl',
        className,
      )}
    >
      {businessInitials(name)}
    </span>
  );
}
