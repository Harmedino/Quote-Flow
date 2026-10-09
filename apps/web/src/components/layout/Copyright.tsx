import { APP_NAME } from '@/app/constants';
import { cn } from '@/lib/cn';

export interface CopyrightProps {
  /** `light` for ink backgrounds such as the marketing footer. */
  tone?: 'default' | 'light';
  className?: string;
}

export function Copyright({ tone = 'default', className }: CopyrightProps) {
  return (
    <p className={cn('text-xs', tone === 'light' ? 'text-white/50' : 'text-stone-500', className)}>
      © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
    </p>
  );
}
