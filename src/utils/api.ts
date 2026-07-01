import axios from 'axios';
import type { ApiEvent, ApiGroup } from '../types/events';

export const EVENTS_API_URL = 'https://api.event.yamanashi.dev/events';
export const GROUPS_API_URL = 'https://api.event.yamanashi.dev/groups';

export async function fetchEvents(): Promise<{ events: ApiEvent[]; lastModified: string | null }> {
  const res = await axios.get(EVENTS_API_URL);
  return {
    events: res.data as ApiEvent[],
    lastModified: res.headers['last-modified'] ?? null,
  };
}

export async function fetchGroups(): Promise<ApiGroup[]> {
  const res = await axios.get(GROUPS_API_URL);
  return res.data as ApiGroup[];
}
