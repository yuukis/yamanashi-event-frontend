const WIDGET_LIST_LIMIT = 5;

export function buildListWidgetPath(groupKey: string): string {
  const path = groupKey ? `/widget/groups/${groupKey}/events` : '/widget/events';
  return `${path}?limit=${WIDGET_LIST_LIMIT}`;
}
