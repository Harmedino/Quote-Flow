import { requestBlob, type RequestOptions } from './api-client';

/** Leaves the object URL alive long enough for the browser to start the download. */
const REVOKE_DELAY_MS = 30_000;

/**
 * Downloads an authenticated API file (e.g. `/quotes/:id/pdf`) and saves it as
 * `fileName`. Throws an ApiError when the request fails, like `request`.
 */
export async function downloadFile(
  path: string,
  fileName: string,
  options: Pick<RequestOptions, 'signal' | 'query'> = {},
): Promise<void> {
  const blob = await requestBlob(path, options);
  saveBlob(blob, fileName);
}

/** Saves a blob through a temporary `<a download>` link. */
export function saveBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.rel = 'noopener';
  link.style.display = 'none';
  document.body.append(link);
  try {
    link.click();
  } finally {
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), REVOKE_DELAY_MS);
  }
}
