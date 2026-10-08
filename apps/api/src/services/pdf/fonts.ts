import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

/**
 * PDF documents embed Inter (SIL OFL) because the standard PDF fonts only
 * cover Latin-1: currency symbols such as ₦ ₹ ₵ ₱ and many customer names
 * would not render. The files are resolved through the `inter-ui` package
 * rather than a path into src/, so the esbuild bundle and the `pnpm deploy`
 * artefact find them in node_modules. WOFF (not WOFF2) because fontkit cannot
 * subset composite glyphs from WOFF2 files.
 */
export const PDF_FONTS = {
  regular: 'Inter-Regular',
  medium: 'Inter-Medium',
  semibold: 'Inter-SemiBold',
} as const;

export type PdfFontName = (typeof PDF_FONTS)[keyof typeof PDF_FONTS];

let cache: ReadonlyMap<PdfFontName, Buffer> | null = null;

function fontDirectory(): string {
  const require = createRequire(import.meta.url);
  return join(dirname(require.resolve('inter-ui/package.json')), 'Inter (web)');
}

/** The font files, read once per process. */
export function loadPdfFonts(): ReadonlyMap<PdfFontName, Buffer> {
  if (!cache) {
    const directory = fontDirectory();
    cache = new Map(
      Object.values(PDF_FONTS).map((name) => [name, readFileSync(join(directory, `${name}.woff`))]),
    );
  }
  return cache;
}
