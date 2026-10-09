import { cn } from '@/lib/cn';
import type { FeatureSection } from './feature-sections';

/** The sticky row of section links under the header, highlighting the section on screen. */
export function FeatureNav({
  sections,
  active,
}: {
  sections: readonly FeatureSection[];
  active: string | undefined;
}) {
  return (
    <nav
      aria-label="Feature sections"
      className="sticky top-16 z-30 border-b border-stone-200 bg-paper/90 backdrop-blur-xl"
    >
      <ul className="no-scrollbar mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 py-2.5 sm:px-6 lg:px-8">
        {sections.map((section) => {
          const current = section.id === active;
          return (
            <li key={section.id} className="shrink-0">
              <a
                href={`#${section.id}`}
                aria-current={current ? 'true' : undefined}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium transition-colors focus-visible:outline-offset-0',
                  current
                    ? 'bg-ink text-white dark:bg-highlight dark:text-ink'
                    : 'text-stone-600 hover:text-stone-900',
                )}
              >
                <section.icon aria-hidden="true" className="size-4" />
                {section.nav}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
