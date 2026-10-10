import { cn } from '@/lib/cn';
import type { StockPhoto } from './photos';

export interface PhotoProps {
  photo: StockPhoto;
  /** Describes the cropped render, which can be wider than the box (a 3:2 photo in a 4:5 box). */
  sizes: string;
  /** Sets the box: an aspect ratio, and an object position when the crop must keep a subject. */
  className?: string;
  /** Only for the photo at the top of a page; every other photo loads as it nears the screen. */
  eager?: boolean;
}

/** A real photo, cropped to `className`'s aspect ratio. */
export function Photo({ photo, sizes, className = 'aspect-[4/3]', eager = false }: PhotoProps) {
  return (
    <img
      src={photo.src}
      srcSet={photo.srcSet}
      sizes={sizes}
      alt={photo.alt}
      width={photo.width}
      height={photo.height}
      loading={eager ? 'eager' : 'lazy'}
      fetchPriority={eager ? 'high' : undefined}
      decoding="async"
      className={cn('block w-full rounded-2xl bg-stone-200 object-cover sm:rounded-3xl', className)}
    />
  );
}
