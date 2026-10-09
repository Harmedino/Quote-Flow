/**
 * History state on a customer page opened from the website's demo. It lives in this tab's
 * history entry, so a reload keeps the demo bar while a shared copy of the link never shows it.
 */
export const FROM_DEMO_STATE = { fromDemo: true } as const;

export function isFromDemo(state: unknown): boolean {
  return (
    typeof state === 'object' && state !== null && 'fromDemo' in state && state.fromDemo === true
  );
}
