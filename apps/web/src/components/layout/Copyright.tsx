import { APP_NAME } from '@/app/constants';
import { cn } from '@/lib/cn';

export interface CopyrightProps {
  /** `light` for navy bands such as a dark footer. */
  tone?: 'default' | 'light';
  className?: string;
}

export function Copyright({ tone = 'default', className }: CopyrightProps) {
  return (
    <p className={cn('text-xs', tone === 'light' ? 'text-on-navy/70' : 'text-muted', className)}>
      © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
    </p>
  );
}
