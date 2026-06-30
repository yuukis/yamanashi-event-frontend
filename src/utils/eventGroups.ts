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
