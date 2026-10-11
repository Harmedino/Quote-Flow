import { useId } from 'react';
import { cn } from '@/lib/cn';

/** Tick lengths along an 80px span: a long tick at 0, a middle one at 40 and short ones every 8. */
const TICKS = Array.from({ length: 10 }, (_, index) => ({
  x: index * 8 + 0.75,
  length: index === 0 ? 13 : index === 5 ? 9 : 5,
}));

/**
 * A ruler edge, ticks hanging from a hairline: the website's divider under a page's hero.
 * Decorative. Its colour is the text colour (line-strong unless given).
 */
export function Ruler({ className }: { className?: string }) {
  const patternId = `ruler-${useId().replace(/[^\w-]/g, '')}`;
  return (
    <svg aria-hidden="true" className={cn('block h-3.5 w-full text-line-strong', className)}>
      <defs>
        <pattern id={patternId} width="80" height="14" patternUnits="userSpaceOnUse">
          {TICKS.map((tick) => (
            <line
              key={tick.x}
              x1={tick.x}
              x2={tick.x}
              y1="0"
              y2={tick.length}
              stroke="currentColor"
              strokeWidth={tick.length > 5 ? 1.5 : 1}
            />
          ))}
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${patternId})`} />
      <line x1="0" x2="100%" y1="0.75" y2="0.75" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
