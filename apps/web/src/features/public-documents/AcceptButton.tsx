import { Check } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import { BRAND_FILL } from './fills';

/** "Accept quote", filled with the business's colour (from `brandColorVars`). */
export function AcceptButton({
  onClick,
  className,
  children = 'Accept quote',
}: {
  onClick: () => void;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <Button
      size="xl"
      style={BRAND_FILL}
      onClick={onClick}
      className={cn(
        'font-semibold hover:brightness-95 active:brightness-90 dark:ring-1 dark:ring-white/20 dark:ring-inset',
        className,
      )}
    >
      <Check aria-hidden="true" className="hidden sm:block" />
      {children}
    </Button>
  );
}
