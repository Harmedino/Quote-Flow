import { describe, expect, it } from 'vitest';
import { areaChartGeometry, nearestIndex } from './chart-geometry';

describe('areaChartGeometry', () => {
  it('spreads points across the width and scales them to the best value', () => {
    const { points, line, area } = areaChartGeometry([0, 50, 100], 200, 100);

    expect(points.map((point) => point.x)).toEqual([0, 100, 200]);
    // 24 above the best value, 12 below zero.
    expect(points.map((point) => point.y)).toEqual([88, 56, 24]);
    expect(line).toBe('M 0 88 C 50 88, 50 56, 100 56 C 150 56, 150 24, 200 24');
    expect(area).toBe(`${line} L 200 100 L 0 100 Z`);
  });

  it('draws a flat line along the bottom when every value is zero', () => {
    const { points } = areaChartGeometry([0, 0, 0], 100, 100);
    expect(new Set(points.map((point) => point.y))).toEqual(new Set([88]));
  });

  it('handles an empty series', () => {
    expect(areaChartGeometry([], 100, 100)).toEqual({ points: [], line: '', area: '' });
  });
});

describe('nearestIndex', () => {
  it('snaps a position to the closest point and stays in range', () => {
    expect(nearestIndex(0, 30)).toBe(0);
    expect(nearestIndex(0.51, 3)).toBe(1);
    expect(nearestIndex(1, 30)).toBe(29);
    expect(nearestIndex(1.4, 30)).toBe(29);
    expect(nearestIndex(-0.2, 30)).toBe(0);
    expect(nearestIndex(0.7, 1)).toBe(0);
  });
});
