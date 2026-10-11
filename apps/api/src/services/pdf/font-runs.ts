import type { PdfFace } from './fonts';

export interface TextRun {
  /** The registered font to draw `text` in. */
  font: string;
  text: string;
}

/** A base character with the marks that sit on it, e.g. "ọ̀". */
const CLUSTER = /\P{M}\p{M}*|\p{M}+/gu;

/**
 * Splits `text` into runs a single font file can draw. A face comes split by Unicode subset, so
 * "₦25,000.00" spans two files (₦ is in latin-ext). Each character keeps its marks, in the first
 * file that has all of them; anything the face lacks is set in its Inter fallback.
 */
export function textRuns(text: string, face: PdfFace): TextRun[] {
  const runs: TextRun[] = [];
  for (const [cluster] of text.matchAll(CLUSTER)) {
    const codePoints = [...cluster].map((char) => char.codePointAt(0) ?? 0);
    const font = face.files.find((file) => codePoints.every(file.covers))?.font ?? face.fallback;
    const last = runs.at(-1);
    if (last?.font === font) last.text += cluster;
    else runs.push({ font, text: cluster });
  }
  return runs;
}
