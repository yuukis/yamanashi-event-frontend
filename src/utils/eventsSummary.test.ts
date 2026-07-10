import { describe, it, expect } from 'vitest';
import {
  sortYearsAscending,
  buildHeatmapGrid,
  getMaxHeatmapCount,
  formatMonthCountTooltip,
} from './eventsSummary';
import type { ApiYearSummary } from '../types/events';

function makeYear(overrides: Partial<ApiYearSummary> = {}): ApiYearSummary {
  return { year: 2020, event_count: 0, groups: [], ...overrides };
}

describe('sortYearsAscending', () => {
  it('orders years from oldest to newest without mutating the input', () => {
    const years = [makeYear({ year: 2010 }), makeYear({ year: 2026 }), makeYear({ year: 2018 })];

    const result = sortYearsAscending(years);

    expect(result.map((y) => y.year)).toEqual([2010, 2018, 2026]);
    expect(years.map((y) => y.year)).toEqual([2010, 2026, 2018]);
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

describe('formatMonthCountTooltip', () => {
  it('formats a period and count as a Japanese month/count label', () => {
    expect(formatMonthCountTooltip('2026-03', 5)).toBe('3月: 5件');
  });

  it('does not zero-pad the month', () => {
    expect(formatMonthCountTooltip('2026-09', 0)).toBe('9月: 0件');
  });
});
