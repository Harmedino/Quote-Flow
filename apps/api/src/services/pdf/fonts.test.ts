import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';
import { textRuns } from './font-runs';
import {
  FONT_FILES,
  FONT_SUBSET_RANGES,
  type FontSubset,
  PDF_FACES,
  PDF_FONTS,
  isFaceSpace,
  loadPdfFonts,
  unicodeRangeIncludes,
} from './fonts';

const require = createRequire(import.meta.url);

describe('pdf fonts', () => {
  it.each(['@fontsource/ibm-plex-mono', '@fontsource/archivo'])(
    'uses the same Unicode subsets as %s',
    (pkg) => {
      const ranges = JSON.parse(
        readFileSync(require.resolve(`${pkg}/unicode.json`), 'utf8'),
      ) as Record<string, string>;
      for (const subset of Object.keys(FONT_SUBSET_RANGES) as FontSubset[]) {
        expect(FONT_SUBSET_RANGES[subset]).toBe(ranges[subset]);
      }
    },
  );

  it('loads every file the faces draw with', () => {
    const fonts = loadPdfFonts();
    const names = [
      ...Object.values(PDF_FONTS),
      ...Object.values(PDF_FACES).flatMap((face) => face.files.map((file) => file.font)),
    ];
    expect(new Set(FONT_FILES.map((file) => file.name))).toEqual(new Set(names));
    for (const name of names) expect(fonts.get(name)?.length).toBeGreaterThan(1_000);
  });

  it('reads CSS unicode ranges', () => {
    expect(unicodeRangeIncludes('U+0000-00FF,U+20A6', 0x41)).toBe(true);
    expect(unicodeRangeIncludes('U+0000-00FF,U+20A6', 0x20a6)).toBe(true);
    expect(unicodeRangeIncludes('U+0000-00FF,U+20A6', 0x20a7)).toBe(false);
  });
});

describe('textRuns', () => {
  const runs = (text: string, face = PDF_FACES.monoBold) =>
    textRuns(text, face).map((run) => `${run.font}:${run.text}`);

  it('draws a naira amount from two subset files of the same face', () => {
    expect(runs('₦25,000.00')).toEqual([
      'IBMPlexMono-SemiBold-latin-ext:₦',
      'IBMPlexMono-SemiBold-latin:25,000.00',
    ]);
  });

  it('keeps a letter and its marks together', () => {
    expect(runs('Ọkafọ̀r', PDF_FACES.heading)).toEqual([
      'Archivo-Bold-vietnamese:Ọ',
      'Archivo-Bold-latin:kaf',
      'Archivo-Bold-vietnamese:ọ̀',
      'Archivo-Bold-latin:r',
    ]);
  });

  it('falls back to Inter for what the face lacks', () => {
    expect(runs('Иван', PDF_FACES.heading)).toEqual(['Inter-SemiBold:Иван']);
  });

  it('sets mono spaces in Inter, to be advanced at the mono width', () => {
    expect(runs('per day', PDF_FACES.mono)).toEqual([
      'IBMPlexMono-Medium-latin:per',
      'Inter-Medium: ',
      'IBMPlexMono-Medium-latin:day',
    ]);
    expect(isFaceSpace(' ', PDF_FACES.mono)).toBe(true);
    expect(isFaceSpace(' ', PDF_FACES.heading)).toBe(false);
  });
});
