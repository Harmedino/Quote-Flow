import { SITE_CONTAINER } from '@/components/marketing/site-container';
import { TAB_LIST_CLASSES, TAB_SCROLLER_CLASSES, tabClasses } from '@/components/ui/tab-styles';
import type { FeatureSection } from './feature-sections';

/**
 * The sticky row of section links under the header, in the app's tab style: the section on
 * screen is navy with the orange marker. It sits right under the header (tape + bar).
 */
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
      className="sticky top-[4.25rem] z-30 bg-canvas/92 pt-2 backdrop-blur-md xl:top-20"
    >
      <div className={SITE_CONTAINER}>
        <div className={TAB_SCROLLER_CLASSES}>
          <ul className={TAB_LIST_CLASSES}>
            {sections.map((section) => {
              const current = section.id === active;
              return (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    aria-current={current ? 'true' : undefined}
                    className={tabClasses(current)}
                  >
                    <section.icon aria-hidden="true" />
                    {section.nav}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </nav>
  );
}
