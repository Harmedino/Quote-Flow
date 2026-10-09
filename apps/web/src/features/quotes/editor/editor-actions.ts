/** What a save button does after validation passes. */
export type SaveIntent = 'draft' | 'send' | 'save';

export interface EditorAction {
  intent: SaveIntent;
  label: string;
  variant: 'primary' | 'secondary';
}

/**
 * Drafts can be saved privately or saved and sent; a quote that is already
 * out (sent, viewed or expired) is simply saved, and stays out.
 */
export function editorActions(isDraft: boolean): EditorAction[] {
  return isDraft
    ? [
        { intent: 'send', label: 'Save and send', variant: 'primary' },
        { intent: 'draft', label: 'Save draft', variant: 'secondary' },
      ]
    : [{ intent: 'save', label: 'Save changes', variant: 'primary' }];
}
