import type { ApiEvent } from '../types/events';

export function countKeywords(events: ApiEvent[]): [string, number][] {
  const counts = new Map<string, number>();
  for (const event of events) {
    for (const keyword of event.keywords ?? []) {
      counts.set(keyword, (counts.get(keyword) ?? 0) + 1);
    }
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

export function filterEventsByKeyword<T extends ApiEvent>(
  events: T[],
  keyword: string | null,
): T[] {
  if (!keyword) {
    return events;
  }
  return events.filter((event) => (event.keywords ?? []).includes(keyword));
}
