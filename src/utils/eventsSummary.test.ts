import { describe, it, expect } from 'vitest';
import {
  sortYearsDescending,
  getMaxEventCount,
  getSequentialLevel,
  buildHeatmapGrid,
  getMaxHeatmapCount,
  formatHeatmapPeriodLabel,
  splitVisibleGroups,
  getGroupVisualWeight,
  HEATMAP_LEVEL_COUNT,
} from './eventsSummary';
import type { ApiYearSummary } from '../types/events';

function makeYear(overrides: Partial<ApiYearSummary> = {}): ApiYearSummary {
  return { year: 2020, event_count: 0, groups: [], ...overrides };
}

describe('sortYearsDescending', () => {
  it('orders years from newest to oldest without mutating the input', () => {
    const years = [makeYear({ year: 2010 }), makeYear({ year: 2026 }), makeYear({ year: 2018 })];

    const result = sortYearsDescending(years);

    expect(result.map((y) => y.year)).toEqual([2026, 2018, 2010]);
    expect(years.map((y) => y.year)).toEqual([2010, 2026, 2018]);
  });
});

describe('getMaxEventCount', () => {
  it('returns the largest event_count across years', () => {
    const years = [makeYear({ event_count: 3 }), makeYear({ event_count: 50 }), makeYear({ event_count: 12 })];

    expect(getMaxEventCount(years)).toBe(50);
  });

  it('returns 0 for an empty list', () => {
    expect(getMaxEventCount([])).toBe(0);
  });
});

describe('getSequentialLevel', () => {
  it('returns 0 when value is zero', () => {
    expect(getSequentialLevel(0, 10)).toBe(0);
  });

  it('returns 0 when max is zero', () => {
    expect(getSequentialLevel(5, 0)).toBe(0);
  });

  it('returns at least 1 for any positive value', () => {
    expect(getSequentialLevel(1, 100)).toBe(1);
  });

  it('returns the top level for the max value', () => {
    expect(getSequentialLevel(50, 50)).toBe(HEATMAP_LEVEL_COUNT);
  });

  it('never exceeds the top level even if value exceeds max', () => {
    expect(getSequentialLevel(999, 50)).toBe(HEATMAP_LEVEL_COUNT);
  });

  it('quantizes proportionally between the extremes', () => {
    expect(getSequentialLevel(25, 100, 4)).toBe(1);
    expect(getSequentialLevel(50, 100, 4)).toBe(2);
    expect(getSequentialLevel(75, 100, 4)).toBe(3);
    expect(getSequentialLevel(100, 100, 4)).toBe(4);
  });
});

describe('buildHeatmapGrid', () => {
  it('groups buckets by year and sorts months ascending within each row', () => {
    const heatmap = [
      { period: '2021-03', count: 2 },
      { period: '2020-01', count: 1 },
      { period: '2021-01', count: 5 },
      { period: '2020-12', count: 0 },
    ];

    const result = buildHeatmapGrid(heatmap);

    expect(result).toEqual([
      { year: 2020, months: [{ period: '2020-01', count: 1 }, { period: '2020-12', count: 0 }] },
      { year: 2021, months: [{ period: '2021-01', count: 5 }, { period: '2021-03', count: 2 }] },
    ]);
  });

  it('returns an empty list for empty input', () => {
    expect(buildHeatmapGrid([])).toEqual([]);
  });
});

describe('getMaxHeatmapCount', () => {
  it('returns the largest bucket count', () => {
    const heatmap = [{ period: '2020-01', count: 3 }, { period: '2020-02', count: 9 }];

    expect(getMaxHeatmapCount(heatmap)).toBe(9);
  });

  it('returns 0 for an empty list', () => {
    expect(getMaxHeatmapCount([])).toBe(0);
  });
});

describe('formatHeatmapPeriodLabel', () => {
  it('formats a YYYY-MM period as a Japanese year/month label', () => {
    expect(formatHeatmapPeriodLabel('2026-03')).toBe('2026年3月');
  });

  it('does not zero-pad the month', () => {
    expect(formatHeatmapPeriodLabel('2026-09')).toBe('2026年9月');
  });
});

describe('splitVisibleGroups', () => {
  it('splits at the given max, keeping order', () => {
    const groups = [1, 2, 3, 4, 5];

    expect(splitVisibleGroups(groups, 3)).toEqual({ visible: [1, 2, 3], overflow: [4, 5] });
  });

  it('returns an empty overflow when under the max', () => {
    expect(splitVisibleGroups([1, 2], 8)).toEqual({ visible: [1, 2], overflow: [] });
  });
});

describe('getGroupVisualWeight', () => {
  it('gives full weight to a single visible group', () => {
    expect(getGroupVisualWeight(0, 1)).toEqual({ opacity: 1, scale: 1 });
  });

  it('gives the first rank full weight and the last rank the minimum weight', () => {
    expect(getGroupVisualWeight(0, 4)).toEqual({ opacity: 1, scale: 1 });
    expect(getGroupVisualWeight(3, 4)).toEqual({ opacity: 0.55, scale: 0.65 });
  });

  it('interpolates weight for middle ranks', () => {
    const result = getGroupVisualWeight(1, 4);

    expect(result.opacity).toBeCloseTo(0.85, 5);
    expect(result.scale).toBeCloseTo(0.8833333, 5);
  });
});
