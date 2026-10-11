import { describe, expect, it } from 'vitest';
import {
  type ChartFrame,
  niceScale,
  placeLabels,
  runningTotalGeometry,
  runningTotals,
  slotIndex,
  textWidth,
} from './chart-geometry';

const day = (date: string, value = 0) => ({ date, value });

describe('runningTotals', () => {
  it('adds each day to the total so far and keeps the names behind it', () => {
    const days = [day('2026-10-01'), day('2026-10-02', 500), day('2026-10-03', 300)];
    const entries = [
      { date: '2026-10-02', customerName: 'Amaka' },
      { date: '2026-10-03', customerName: 'Musa' },
      { date: '2026-10-03', customerName: 'Chioma' },
    ];

    expect(runningTotals(days, entries)).toEqual([
      { date: '2026-10-01', amount: 0, total: 0, names: [] },
      { date: '2026-10-02', amount: 500, total: 500, names: ['Amaka'] },
      { date: '2026-10-03', amount: 300, total: 800, names: ['Musa', 'Chioma'] },
    ]);
  });
});

describe('niceScale', () => {
  it('rounds the top up to two round steps', () => {
    expect(niceScale(17_522_500)).toEqual({ max: 20_000_000, step: 10_000_000 });
    expect(niceScale(100_000)).toEqual({ max: 100_000, step: 50_000 });
    expect(niceScale(120_000)).toEqual({ max: 200_000, step: 100_000 });
    expect(niceScale(45)).toEqual({ max: 50, step: 25 });
  });

  it('gives an empty chart a scale of one', () => {
    expect(niceScale(0)).toEqual({ max: 1, step: 1 });
  });
});

/** The concept's desktop chart: 765 × 162, a 50px value axis, zero at y 124. */
const FRAME: ChartFrame = { width: 765, height: 162, left: 50, right: 8, top: 22, base: 124 };

function conceptDays() {
  const days = Array.from({ length: 30 }, (_, index) => day(`d${index}`));
  days[7] = day('d7', 93_525);
  days[10] = day('d10', 30_100);
  days[21] = day('d21', 51_600);
  return runningTotals(days, []);
}

describe('runningTotalGeometry', () => {
  it('steps up on each day with an amount and runs flat to today', () => {
    const geometry = runningTotalGeometry(conceptDays(), 200_000, FRAME);

    expect(geometry.xs[7]).toBe(226.8);
    expect(geometry.points[7]).toEqual({ x: 226.8, y: 76.3 });
    expect(geometry.line).toBe(
      'M50 124 L226.8 124 L226.8 76.3 L297.5 76.3 L297.5 61 L556.7 61 L556.7 34.6 L757 34.6',
    );
    expect(geometry.area).toBe(`${geometry.line} L757 124 L50 124 Z`);
    expect(geometry.segments).toHaveLength(7);
    expect(geometry.ticks).toHaveLength(31);
    expect(geometry.ticks.filter((tick) => tick.major).map((tick) => tick.x)).toEqual([
      50, 215, 379.9, 544.9, 709.9,
    ]);
  });

  it('draws a flat line along zero when nothing came in', () => {
    const days = runningTotals([day('a'), day('b')], []);
    expect(runningTotalGeometry(days, 1, FRAME).line).toBe('M50 124 L757 124');
  });
});

describe('placeLabels', () => {
  it('keeps labels inside the frame and off the line, as in the concept', () => {
    const geometry = runningTotalGeometry(conceptDays(), 200_000, FRAME);
    const points = [7, 10, 21].map((index) => geometry.points[index]!);
    const width = (name: string) => textWidth(`Sep 18 · ${name}`, 11);
    const candidates = [
      { index: 7, point: points[0]!, width: width('Amaka Nwankwo') },
      { index: 21, point: points[2]!, width: width('Adaeze Okonkwo') },
      { index: 10, point: points[1]!, width: width('Musa Ibrahim') },
    ];

    const placed = placeLabels(candidates, geometry, FRAME, points);

    expect(placed.map(({ index, anchor, y }) => [index, anchor, y])).toEqual([
      // Left and below: on the right it would cross the next step and its drop line.
      [7, 'end', 98.3],
      [21, 'start', 12.6],
      [10, 'start', 39],
    ]);
  });

  it('leaves out a label with no room', () => {
    const geometry = runningTotalGeometry(conceptDays(), 200_000, FRAME);
    const point = geometry.points[7]!;
    expect(placeLabels([{ index: 7, point, width: 900 }], geometry, FRAME, [point])).toEqual([]);
  });
});

describe('slotIndex', () => {
  it('finds the slot under a position and stays in range', () => {
    expect(slotIndex(0, 30)).toBe(0);
    expect(slotIndex(0.51, 3)).toBe(1);
    expect(slotIndex(1, 30)).toBe(29);
    expect(slotIndex(1.4, 30)).toBe(29);
    expect(slotIndex(-0.2, 30)).toBe(0);
    expect(slotIndex(0.7, 1)).toBe(0);
  });
});
