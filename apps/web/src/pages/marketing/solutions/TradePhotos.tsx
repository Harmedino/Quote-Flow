import { Photo } from '@/components/marketing/Photo';
import { Reveal } from '@/components/marketing/Reveal';
import { PHOTOS, type StockPhoto } from '@/components/marketing/photos';

// Each tile is 4:5, so a 3:2 photo renders about 1.9x wider than its column.
const TILE_SIZES = '(min-width: 1024px) 520px, (min-width: 640px) 48vw, 95vw';

const TILES: { photo: StockPhoto; caption: string; crop: string }[] = [
  { photo: PHOTOS.windowCleaning, caption: 'Cleaning', crop: 'object-[72%_45%]' },
  { photo: PHOTOS.wiringSurvey, caption: 'Electrical', crop: 'object-[45%_40%]' },
  { photo: PHOTOS.wallCheck, caption: 'Walls and repairs', crop: 'object-[50%_0%]' },
  { photo: PHOTOS.photographer, caption: 'Photography', crop: 'object-[50%_40%]' },
];

/** A row of the trades at work, between the page's hero and the trade cards. */
export function TradePhotos() {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
      {TILES.map((tile, index) => (
        <li key={tile.caption}>
          <Reveal delay={index * 60}>
            <figure>
              <Photo
                photo={tile.photo}
                sizes={TILE_SIZES}
                className={`aspect-[4/5] ${tile.crop}`}
              />
              <figcaption className="mt-2 text-sm font-medium text-stone-700">
                {tile.caption}
              </figcaption>
            </figure>
          </Reveal>
        </li>
      ))}
    </ul>
  );
}
