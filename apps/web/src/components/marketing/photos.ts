/** A stock photo from /public/photos. Sources and photographers are listed in public/photos/CREDITS.md. */
export interface StockPhoto {
  src: string;
  srcSet: string;
  width: number;
  height: number;
  alt: string;
}

/** Every photo is exported from the full-size original to webp at these widths. */
const WIDTHS = [800, 1400, 2000];

/** Photos are 3:2 (2000x1333) unless a taller height is given. */
function photo(file: string, alt: string, height = 1333): StockPhoto {
  return {
    src: `/photos/${file}-1400.webp`,
    srcSet: WIDTHS.map((width) => `/photos/${file}-${width}.webp ${width}w`).join(', '),
    width: 2000,
    height,
    alt,
  };
}

export const PHOTOS = {
  onSiteCall: photo('on-site-call', 'A tradeswoman in a hi-vis vest takes a phone call on site'),
  wiringSurvey: photo(
    'wiring-survey',
    'Two tradeswomen in hard hats check the wiring in an opened wall, one holding a clipboard',
  ),
  wallCheck: photo('wall-check', 'Two tradeswomen in hard hats kneel to inspect a damaged wall'),
  windowCleaning: photo(
    'window-cleaning',
    'A cleaner in red overalls wipes a glass wall while a colleague mops the kitchen behind her',
  ),
  customerOnPhone: photo('customer-on-phone', 'A smiling woman at home looking at her phone'),
  ownerOnCall: photo(
    'owner-on-call',
    'A business owner on a phone call at his desk, taking notes beside his laptop',
  ),
  ownerWithPhone: photo(
    'owner-with-phone',
    'A smiling business owner holding his phone in a bright workspace',
  ),
  /** Portrait, 4:5. */
  photographer: photo('photographer', 'A photographer holding his camera outdoors', 2500),
} satisfies Record<string, StockPhoto>;
