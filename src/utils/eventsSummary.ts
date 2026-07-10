import type { ApiHeatmapBucket, ApiYearSummary } from '../types/events';

export function sortYearsAscending(years: ApiYearSummary[]): ApiYearSummary[] {
  return [...years].sort((a, b) => a.year - b.year);
}

export type HeatmapYearRow = {
  year: number;
  months: ApiHeatmapBucket[];
};

export function buildHeatmapGrid(heatmap: ApiHeatmapBucket[]): HeatmapYearRow[] {
  const monthsByYear = new Map<number, ApiHeatmapBucket[]>();

  for (const bucket of heatmap) {
    const year = parseInt(bucket.period.slice(0, 4), 10);
    const months = monthsByYear.get(year) ?? [];
    months.push(bucket);
    monthsByYear.set(year, months);
  }

  return [...monthsByYear.entries()]
    .map(([year, months]) => ({
      year,
      months: [...months].sort((a, b) => a.period.localeCompare(b.period)),
    }))
    .sort((a, b) => a.year - b.year);
}

export function getMaxHeatmapCount(heatmap: ApiHeatmapBucket[]): number {
  return heatmap.reduce((max, bucket) => Math.max(max, bucket.count), 0);
}

export function formatMonthCountTooltip(period: string, count: number): string {
  const month = parseInt(period.slice(5, 7), 10);
  return `${month}月: ${count}件`;
}
