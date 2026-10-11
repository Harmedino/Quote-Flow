import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import FONT_FILES from './font-files.json';

export { FONT_FILES };

/**
 * PDF documents embed their fonts because the standard PDF fonts only cover Latin-1: currency
 * symbols such as ₦ ₹ ₵ ₱ and many customer names would not render.
 *
 * - Inter (SIL OFL) sets running text: addresses, item descriptions, notes. It covers every
 *   script the documents are likely to hold, so it is also the fallback for the faces below.
 * - The Signal faces (SIL OFL) set the ticket: IBM Plex Mono for labels, numbers and amounts,
 *   Archivo for names and big figures. Fontsource ships them split by Unicode subset, so text in
 *   them is drawn in runs, one file per run (see font-runs.ts).
 *
 * The production build copies the files to dist/fonts next to the bundle (serverless platforms
 * only ship files they can see); from source they are resolved through their packages. WOFF (not
 * WOFF2) because fontkit cannot subset composite glyphs from WOFF2 files.
 */
export const PDF_FONTS = {
  regular: 'Inter-Regular',
  medium: 'Inter-Medium',
  semibold: 'Inter-SemiBold',
} as const;

/**
 * Fontsource's Unicode subsets, the same for both families (fonts.test.ts checks them against
 * each package's unicode.json). Code points or ranges, as in CSS `unicode-range`.
 */
export const FONT_SUBSET_RANGES = {
  latin:
    'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD',
  'latin-ext':
    'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF',
  vietnamese:
    'U+0102-0103,U+0110-0111,U+0128-0129,U+0168-0169,U+01A0-01A1,U+01AF-01B0,U+0300-0301,U+0303-0304,U+0308-0309,U+0323,U+0329,U+1EA0-1EF9,U+20AB',
} as const;

export type FontSubset = keyof typeof FONT_SUBSET_RANGES;

/** Whether a code point is in a CSS `unicode-range` list such as "U+0000-00FF,U+0131". */
export function unicodeRangeIncludes(ranges: string, codePoint: number): boolean {
  return ranges.split(',').some((range) => {
    const [start = '', end = start] = range.trim().replace(/^U\+/i, '').split('-');
    return codePoint >= Number.parseInt(start, 16) && codePoint <= Number.parseInt(end, 16);
  });
}

/** One file of a face: the font registered under `font`, which has the glyphs `covers` accepts. */
export interface FaceFile {
  font: string;
  covers: (codePoint: number) => boolean;
}

/** A Signal face: its subset files in order of preference, then Inter for anything else. */
export interface PdfFace {
  files: readonly FaceFile[];
  fallback: PdfFontName;
  /**
   * For a face whose files can't draw spaces: they are set in the fallback and advanced by this
   * much (in em) instead of the fallback's own width.
   */
  spaceWidth?: number;
}

const SPACES = new Set([0x20, 0xa0]);

/**
 * Plex Mono's WOFF subsets end with their empty glyphs (space, no-break space), and fontkit
 * reads past the end of the glyph table for them. Its spaces are therefore set in Inter, at the
 * mono advance of 600 units.
 */
const MONO_SPACE_WIDTH = 0.6;

function face(
  name: string,
  subsets: readonly FontSubset[],
  fallback: PdfFontName,
  spaceWidth?: number,
): PdfFace {
  return {
    files: subsets.map((subset) => ({
      font: `${name}-${subset}`,
      covers: (codePoint) =>
        !(spaceWidth && SPACES.has(codePoint)) &&
        unicodeRangeIncludes(FONT_SUBSET_RANGES[subset], codePoint),
    })),
    fallback,
    spaceWidth,
  };
}

export const PDF_FACES = {
  /** Labels, dates and quantities. */
  mono: face('IBMPlexMono-Medium', ['latin', 'latin-ext'], PDF_FONTS.medium, MONO_SPACE_WIDTH),
  /** Amounts. */
  monoBold: face(
    'IBMPlexMono-SemiBold',
    ['latin', 'latin-ext'],
    PDF_FONTS.semibold,
    MONO_SPACE_WIDTH,
  ),
  /** Business and customer names. */
  heading: face('Archivo-Bold', ['latin', 'latin-ext', 'vietnamese'], PDF_FONTS.semibold),
  /** The document number and the total to pay. */
  display: face('Archivo-ExtraBold', ['latin', 'latin-ext', 'vietnamese'], PDF_FONTS.semibold),
} as const;

/** Whether `text` is only spaces that `face` sets in its fallback (see PdfFace.spaceWidth). */
export function isFaceSpace(text: string, face: PdfFace): boolean {
  return (
    face.spaceWidth !== undefined && [...text].every((char) => SPACES.has(char.codePointAt(0) ?? 0))
  );
}

export type PdfFontName = (typeof PDF_FONTS)[keyof typeof PDF_FONTS];

let cache: ReadonlyMap<string, Buffer> | null = null;

function fontPath(name: string, source: string): string {
  const bundled = fileURLToPath(new URL(`./fonts/${name}.woff`, import.meta.url));
  if (existsSync(bundled)) return bundled;
  return createRequire(import.meta.url).resolve(source);
}

/** Every font file by its registered name, read once per process. */
export function loadPdfFonts(): ReadonlyMap<string, Buffer> {
  if (!cache) {
    cache = new Map(
      FONT_FILES.map(({ name, source }) => [name, readFileSync(fontPath(name, source))]),
    );
  }
  return cache;
}
