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

export type GroupEventDates = {
  started_at: string;
  ended_at: string;
};

export function countGroups(
  events: EventWithGroup[],
  groups: ApiGroup[],
): { key: string; name: string; imageUrl?: string | null; count: number; events: GroupEventDates[] }[] {
  const groupByKey = new Map(groups.map((group) => [group.key, group]));
  const counts = new Map<string, { name: string; imageUrl?: string | null; count: number; events: GroupEventDates[] }>();
  for (const event of events) {
    const group = event.group_key ? groupByKey.get(event.group_key) : undefined;
    // event.group_name が欠けているデータでも、group_key が /groups に
    // 存在するなら title をフォールバック名として扱い、集計対象から
    // 漏らさないようにする。
    const name = event.group_name || group?.title;
    if (!event.group_key || !group || !name) {
      continue;
    }
    const entry = counts.get(event.group_key);
    const eventDates = { started_at: event.started_at, ended_at: event.ended_at };
    if (entry) {
      entry.count += 1;
      entry.events.push(eventDates);
    } else {
      counts.set(event.group_key, { name, imageUrl: group.image_url, count: 1, events: [eventDates] });
    }
  }
  return [...counts.entries()]
    .map(([key, { name, imageUrl, count, events: groupEvents }]) => ({ key, name, imageUrl, count, events: groupEvents }))
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
