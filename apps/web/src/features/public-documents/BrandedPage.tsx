import { DEFAULT_BRAND_COLOR } from '@quoteflow/shared';
import type { ReactNode } from 'react';
import { brandColorVars, normalizeBrandColor } from '@/components/documents/brand-color';
import { DocumentBand } from './DocumentBand';
import './fills.css';

/**
 * A customer's page in the business's colour: the band across the top and the brand variables
 * for everything below (see fills.css), with the content stacked over the band.
 */
export function BrandedPage({
  brandColor,
  children,
}: {
  brandColor: string | null | undefined;
  children: ReactNode;
}) {
  const defaultBrand = normalizeBrandColor(brandColor) === DEFAULT_BRAND_COLOR;
  return (
    <div
      style={brandColorVars(brandColor)}
      className="doc-fills"
      data-default-brand={defaultBrand || undefined}
    >
      <DocumentBand branded />
      <div className="space-y-5">{children}</div>
    </div>
  );
}
