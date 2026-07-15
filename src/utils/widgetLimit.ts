export const WIDGET_DEFAULT_LIMIT = 5;
export const WIDGET_MIN_LIMIT = 1;
export const WIDGET_MAX_LIMIT = 20;

export function parseWidgetLimit(raw: string | null): number {
  if (raw === null) {
    return WIDGET_DEFAULT_LIMIT;
  }
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed)) {
    return WIDGET_DEFAULT_LIMIT;
  }
  return Math.min(WIDGET_MAX_LIMIT, Math.max(WIDGET_MIN_LIMIT, parsed));
}
