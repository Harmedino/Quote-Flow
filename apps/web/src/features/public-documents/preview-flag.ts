import { PREVIEW_PARAM } from '@/app/paths';

/**
 * The business opens its own quote link with PREVIEW_PARAM, and the page then
 * moves the flag from the address bar into this tab's history entry: reloading
 * stays a preview, while a link copied from the address bar is the customer's
 * own and records their views.
 */
export const PREVIEW_STATE = { preview: true } as const;

export interface PreviewFlag {
  preview: boolean;
  /** The search to show instead, while the flag is still in the URL; otherwise null. */
  searchWithoutFlag: string | null;
}

export function readPreviewFlag(location: { search: string; state: unknown }): PreviewFlag {
  const params = new URLSearchParams(location.search);
  if (params.get(PREVIEW_PARAM) === '1') {
    params.delete(PREVIEW_PARAM);
    return { preview: true, searchWithoutFlag: params.toString() };
  }
  const { state } = location;
  const preview =
    typeof state === 'object' && state !== null && 'preview' in state && state.preview === true;
  return { preview, searchWithoutFlag: null };
}
