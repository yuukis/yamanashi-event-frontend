import type { ApiHeatmapBucket, ApiYearSummary } from '../types/events';

// count=0 は「活動なし」を示す専用の色(グレー)とし、非0の件数は
// primary(青)の4段階(薄い→濃い)で相対的な多さを表す。数値そのものは
// 静的なラベルとして出さず、hover の Tooltip でのみ開示する方針。
export const HEATMAP_LEVEL_COLORS = ['gray.100', 'primary.200', 'primary.400', 'primary.600', 'primary.800'];
export const HEATMAP_LEVEL_COUNT = HEATMAP_LEVEL_COLORS.length - 1;

export const MAX_VISIBLE_GROUPS_PER_YEAR = 8;

export function sortYearsDescending(years: ApiYearSummary[]): ApiYearSummary[] {
  return [...years].sort((a, b) => b.year - a.year);
}

export function getMaxEventCount(years: ApiYearSummary[]): number {
  return years.reduce((max, year) => Math.max(max, year.event_count), 0);
}

// value を 0(件数ゼロ) 〜 levels(最大値付近) の整数段階に量子化する。
// 件数が1件でもあれば必ずレベル1以上になり、「活動なし」と区別できる。
export function getSequentialLevel(value: number, max: number, levels: number = HEATMAP_LEVEL_COUNT): number {
  if (value <= 0 || max <= 0) {
    return 0;
  }
  const ratio = value / max;
  return Math.min(levels, Math.max(1, Math.ceil(ratio * levels)));
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

export function getMaxHeatmapCount(heatmap: ApiHeatmapBucket[]): number {
  return heatmap.reduce((max, bucket) => Math.max(max, bucket.count), 0);
}

export function formatHeatmapPeriodLabel(period: string): string {
  const [year, month] = period.split('-');
  return `${year}年${parseInt(month, 10)}月`;
}

export function splitVisibleGroups<T>(
  groups: T[],
  max: number = MAX_VISIBLE_GROUPS_PER_YEAR,
): { visible: T[]; overflow: T[] } {
  return { visible: groups.slice(0, max), overflow: groups.slice(max) };
}

// コミュニティのアバターを、件数そのものではなく「並び順(rank)」に基づいて
// 目立たせる度合い(不透明度・サイズ)を求める。API が既に件数降順で返す
// ため、これだけで「上位ほど目立つ」という表現が成立する。
export function getGroupVisualWeight(rank: number, visibleCount: number): { opacity: number; scale: number } {
  if (visibleCount <= 1) {
    return { opacity: 1, scale: 1 };
  }
  const t = rank / (visibleCount - 1);
  return {
    opacity: 1 - t * 0.45,
    scale: 1 - t * 0.35,
  };
}
