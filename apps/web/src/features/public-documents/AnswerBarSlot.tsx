import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useOutletContext } from 'react-router';
import { brandPageVars } from './fills';

/** What PublicDocumentLayout hands its pages. */
export interface PublicPageOutletContext {
  /** The element after the page's footer that keeps the answer bar pinned to the bottom. */
  answerBarSlot: HTMLElement | null;
}

/**
 * Renders the quote's answer bar after the "Sent with" footer, so the bar stays on the bottom
 * edge all the way down instead of lifting off above the footer at the end of the page. Out
 * there it is outside the BrandedPage, so it brings the brand's variables along.
 */
export function AnswerBarSlot({
  brandColor,
  children,
}: {
  brandColor: string | null | undefined;
  children: ReactNode;
}) {
  const { answerBarSlot } = useOutletContext<PublicPageOutletContext>();
  return (
    answerBarSlot &&
    createPortal(<div style={brandPageVars(brandColor)}>{children}</div>, answerBarSlot)
  );
}
