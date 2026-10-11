import { cn } from '@/lib/cn';

export interface BulletListProps {
  items: readonly string[];
  /** `muted` for things QuoteFlow doesn't do: an outlined mark and quieter text. */
  tone?: 'default' | 'muted';
  className?: string;
}

/** A list marked with small diamonds, like the separators on the trades band. */
export function BulletList({ items, tone = 'default', className }: BulletListProps) {
  return (
    <ul className={cn('space-y-2.5', className)}>
      {items.map((item) => (
        <li
          key={item}
          className={cn(
            'flex gap-3 text-[0.9375rem] leading-snug text-pretty',
            tone === 'muted' ? 'text-muted' : 'text-ink-2',
          )}
        >
          <span
            aria-hidden="true"
            className={cn(
              'mt-[0.4em] size-[7px] shrink-0 rotate-45',
              tone === 'muted' ? 'border-[1.5px] border-edge' : 'bg-primary',
            )}
          />
          {item}
        </li>
      ))}
    </ul>
  );
}
