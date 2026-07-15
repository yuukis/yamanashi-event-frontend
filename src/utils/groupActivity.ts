import type { ApiEvent, ApiGroup } from '../types/events';

export function collectActiveGroupKeys(events: Pick<ApiEvent, 'group_key'>[]): Set<string> {
  const keys = new Set<string>();
  events.forEach((event) => {
    if (event.group_key) {
      keys.add(event.group_key);
    }
  });
  return keys;
}

export function splitGroupsByActivity(
  groups: ApiGroup[],
  activeGroupKeys: Set<string>,
): { activeGroups: ApiGroup[]; inactiveGroups: ApiGroup[] } {
  const sorted = [...groups].sort((a, b) => a.title.localeCompare(b.title, 'ja'));
  return {
    activeGroups: sorted.filter((group) => activeGroupKeys.has(group.key)),
    inactiveGroups: sorted.filter((group) => !activeGroupKeys.has(group.key)),
  };
}
