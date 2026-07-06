import type { ApiEvent, ApiGroup, EventWithGroup } from '../types/events';

export function enrichEventsWithGroups(
  events: ApiEvent[],
  groups: ApiGroup[],
): EventWithGroup[] {
  const groupByKey = Object.fromEntries(
    groups.map((group) => [group.key, group]),
  );

  return events.map((event) => {
    const group = event.group_key ? groupByKey[event.group_key] : undefined;
    if (!group) {
      return event;
    }

    return {
      ...event,
      group_image_url: group.image_url,
      archive_source: group.archive_source,
      archive_url: group.archive_url,
    };
  });
}

export function isVisibleEvent(event: ApiEvent) {
  return event.open_status !== 'cancelled';
}

export function isPastEvent(event: ApiEvent) {
  return event.open_status === 'close';
}

export function isFutureEvent(event: ApiEvent) {
  return isVisibleEvent(event) && !isPastEvent(event);
}

export function countGroups(events: EventWithGroup[]): { key: string; name: string; imageUrl?: string | null; count: number }[] {
  const counts = new Map<string, { name: string; imageUrl?: string | null; count: number }>();
  for (const event of events) {
    if (!event.group_key || !event.group_name) {
      continue;
    }
    const entry = counts.get(event.group_key);
    if (entry) {
      entry.count += 1;
    } else {
      counts.set(event.group_key, { name: event.group_name, imageUrl: event.group_image_url, count: 1 });
    }
  }
  return [...counts.entries()]
    .map(([key, { name, imageUrl, count }]) => ({ key, name, imageUrl, count }))
    .sort((a, b) => b.count - a.count);
}

export function filterEventsByGroup<T extends ApiEvent>(
  events: T[],
  groupKey: string | null,
): T[] {
  if (!groupKey) {
    return events;
  }
  return events.filter((event) => event.group_key === groupKey);
}
