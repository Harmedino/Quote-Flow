import { useIsFetching, useIsMutating } from '@tanstack/react-query';
import { useNavigation } from 'react-router';
import { cn } from '@/lib/cn';

/**
 * The orange and navy stripe along the top of the app. While a page loads or something saves,
 * it scrolls like a barber pole (and stands still for reduced motion).
 */
export function HazardTape() {
  const navigating = useNavigation().state !== 'idle';
  const busy = useIsFetching() + useIsMutating() > 0 || navigating;
  return (
    <div aria-hidden="true" className={cn('h-1 hazard-tape', busy && 'animate-hazard-scroll')} />
  );
}
