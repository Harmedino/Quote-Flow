import { TAB_LIST_CLASSES, TAB_SCROLLER_CLASSES, tabClasses } from '@/components/ui/tab-styles';

const VIEWS = [
  { archived: false, label: 'Active' },
  { archived: true, label: 'Archived' },
] as const;

/** Active or archived customers, as the same underlined tabs as the other lists. */
export function ArchiveFilter({
  archived,
  onChange,
}: {
  archived: boolean;
  onChange: (archived: boolean) => void;
}) {
  return (
    <div role="group" aria-label="Show customers" className={TAB_SCROLLER_CLASSES}>
      <div className={TAB_LIST_CLASSES}>
        {VIEWS.map((view) => (
          <button
            key={view.label}
            type="button"
            aria-pressed={archived === view.archived}
            onClick={() => onChange(view.archived)}
            className={tabClasses(archived === view.archived)}
          >
            {view.label}
          </button>
        ))}
      </div>
    </div>
  );
}
