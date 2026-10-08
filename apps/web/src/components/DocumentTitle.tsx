import { APP_NAME } from '@/app/constants';

/** Sets the browser tab title, e.g. "Quotes · QuoteFlow". React hoists <title> into <head>. */
export function DocumentTitle({ title }: { title?: string }) {
  return <title>{title ? `${title} · ${APP_NAME}` : APP_NAME}</title>;
}
