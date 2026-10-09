import { CircleCheck } from 'lucide-react';
import { useState } from 'react';
import { Button } from './ui/Button';

export interface FormActionBarProps {
  dirty: boolean;
  saving: boolean;
  /** True after a successful save, until the next edit or discard. */
  saved: boolean;
  /** A failed save, shown in place of the status. */
  error?: string | null;
  onDiscard: () => void;
}

/**
 * Save and discard controls for a long form, pinned to the bottom of the
 * viewport. It appears with the first edit and then stays, so focus is never
 * lost when a save or discard completes. The status line is a live region;
 * errors use an alert. The form's submit handler must ignore submissions
 * while nothing has changed.
 */
export function FormActionBar({ dirty, saving, saved, error, onDiscard }: FormActionBarProps) {
  const [shown, setShown] = useState(dirty);
  if (dirty && !shown) {
    setShown(true);
  }
  if (!shown) {
    return null;
  }

  return (
    <div className="sticky bottom-[calc(var(--spacing-tab-bar)+0.75rem)] z-20 mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-3 rounded-2xl border border-stone-200 bg-surface/95 px-4 py-3 shadow-[var(--shadow-elevated)] backdrop-blur-md sm:px-5 lg:bottom-4">
      <div className="min-w-0 flex-1 text-sm">
        {error && (
          <p role="alert" className="text-red-700">
            {error}
          </p>
        )}
        <p role="status" className="flex items-center gap-2 text-stone-600">
          {error ? null : dirty ? (
            <>
              <span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-amber-500" />
              You have unsaved changes
            </>
          ) : saved ? (
            <>
              <CircleCheck aria-hidden="true" className="size-4 shrink-0 text-emerald-700" />
              Changes saved
            </>
          ) : (
            'No unsaved changes'
          )}
        </p>
      </div>
      {/* aria-disabled rather than disabled, so focus stays put when a save or discard completes. */}
      <div className="flex shrink-0 items-center gap-3 max-sm:w-full max-sm:[&>*]:flex-1">
        <Button
          variant="secondary"
          aria-disabled={!dirty || saving}
          onClick={() => {
            if (dirty && !saving) {
              onDiscard();
            }
          }}
        >
          Discard
        </Button>
        <Button type="submit" loading={saving} aria-disabled={!dirty}>
          Save changes
        </Button>
      </div>
    </div>
  );
}
