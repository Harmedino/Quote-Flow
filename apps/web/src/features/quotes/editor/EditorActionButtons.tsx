import { Button } from '@/components/ui/Button';
import type { ButtonSize } from '@/components/ui/button-styles';
import type { EditorAction, SaveIntent } from './editor-actions';

export interface EditorActionButtonsProps {
  actions: EditorAction[];
  pendingIntent: SaveIntent | null;
  onAction: (intent: SaveIntent) => void;
  size?: ButtonSize;
  /** Main action last, as in a row of buttons; otherwise first, as in a stack. */
  mainLast?: boolean;
  className?: string;
}

/** The builder's save buttons; while one save runs, the others wait. */
export function EditorActionButtons({
  actions,
  pendingIntent,
  onAction,
  size,
  mainLast = false,
  className,
}: EditorActionButtonsProps) {
  return (mainLast ? [...actions].reverse() : actions).map((action) => (
    <Button
      key={action.intent}
      variant={action.variant}
      size={size}
      className={className}
      loading={pendingIntent === action.intent}
      aria-disabled={(pendingIntent !== null && pendingIntent !== action.intent) || undefined}
      onClick={() => onAction(action.intent)}
    >
      {action.label}
    </Button>
  ));
}
