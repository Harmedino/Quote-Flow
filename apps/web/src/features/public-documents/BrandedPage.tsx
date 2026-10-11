import { type ReactNode, useEffect } from 'react';
import { setPageToolbarColor } from '@/lib/theme';
import { brandFill, brandPageVars } from './fills';

/**
 * A customer's page in the business's colour: the brand variables for everything inside, and
 * the phone browser's toolbar in the band's colour above it.
 */
export function BrandedPage({
  brandColor,
  children,
}: {
  brandColor: string | null | undefined;
  children: ReactNode;
}) {
  const { fill } = brandFill(brandColor);
  useEffect(() => {
    setPageToolbarColor(fill);
    return () => setPageToolbarColor(null);
  }, [fill]);

  return <div style={brandPageVars(brandColor)}>{children}</div>;
}
