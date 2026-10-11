import { Check } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import { BRAND_FILL, FILL_FEEDBACK } from './fills';

/** "Accept quote", filled with the business's colour (inside a BrandedPage). */
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
    <Button size="xl" style={BRAND_FILL} onClick={onClick} className={cn(FILL_FEEDBACK, className)}>
      <Check aria-hidden="true" />
      {children}
    </Button>
  );
}
