import type { ApiHeatmapBucket, ApiYearSummary } from '../types/events';

export const MAX_VISIBLE_GROUPS_PER_YEAR = 6;

export function sortYearsAscending(years: ApiYearSummary[]): ApiYearSummary[] {
  return [...years].sort((a, b) => a.year - b.year);
}

export type HeatmapYearRow = {
  year: number;
  months: ApiHeatmapBucket[];
};

// heatmap は "YYYY-MM" のフラットなバケット列で届く。年ごとの行にまとめ、
// 行内は月の昇順に揃える(API は既に昇順で返すが、ここで保証する)。
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

// カード内バーチャートの高さの基準値。全期間(2010〜現在)で共通のスケールに
// することで、どのカードでも棒の高さの意味がぶれないようにする。
export function getMaxHeatmapCount(heatmap: ApiHeatmapBucket[]): number {
  return heatmap.reduce((max, bucket) => Math.max(max, bucket.count), 0);
}

export function formatMonthCountTooltip(period: string, count: number): string {
  const month = parseInt(period.slice(5, 7), 10);
  return `${month}月: ${count}件`;
}

export function splitVisibleGroups<T>(
  groups: T[],
  max: number = MAX_VISIBLE_GROUPS_PER_YEAR,
): { visible: T[]; overflow: T[] } {
  return { visible: groups.slice(0, max), overflow: groups.slice(max) };
}

// コミュニティのアバターを、件数そのものではなく「並び順(rank)」に基づいて
// 目立たせる度合い(不透明度)を求める。アイコンのサイズは統一するため、
// 差はこの不透明度のみで表現する。API が既に件数降順で返すため、これだけで
// 「上位ほど目立つ」という表現が成立する。
export function getGroupVisualWeight(rank: number, visibleCount: number): { opacity: number } {
  if (visibleCount <= 1) {
    return { opacity: 1 };
  }
  const t = rank / (visibleCount - 1);
  return {
    opacity: 1 - t * 0.45,
  };
}
