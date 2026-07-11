import axios from 'axios';
import type { ApiEvent, ApiGroup, ApiEventsSummary } from '../types/events';

export const EVENTS_API_URL = 'https://api.event.yamanashi.dev/events';
export const GROUPS_API_URL = 'https://api.event.yamanashi.dev/groups';
export const EVENTS_SUMMARY_API_URL = 'https://api.event.yamanashi.dev/events/summary';

export const EVENTS_FIELDS = [
  'uid',
  'event_id',
  'title',
  'catch',
  'hash_tag',
  'event_url',
  'started_at',
  'ended_at',
  'updated_at',
  'open_status',
  'owner_name',
  'place',
  'address',
  'group_key',
  'group_name',
  'group_url',
  'keywords',
].join(',');

export const GROUPS_FIELDS = [
  'key',
  'title',
  'image_url',
  'archive_source',
  'archive_url',
].join(',');

let inFlightEventsRequest: Promise<{ events: ApiEvent[]; lastModified: string | null }> | null = null;

export async function fetchEvents(): Promise<{ events: ApiEvent[]; lastModified: string | null }> {
  if (inFlightEventsRequest) {
    return inFlightEventsRequest;
  }

  inFlightEventsRequest = axios.get(EVENTS_API_URL, { params: { fields: EVENTS_FIELDS } })
    .then((res) => ({
      events: res.data as ApiEvent[],
      lastModified: res.headers['last-modified'] ?? null,
    }))
    .finally(() => {
      inFlightEventsRequest = null;
    });

  return inFlightEventsRequest;
}

export async function fetchGroups(): Promise<ApiGroup[]> {
  const res = await axios.get(GROUPS_API_URL, { params: { fields: GROUPS_FIELDS } });
  return res.data as ApiGroup[];
}

export async function fetchEventsSummary(): Promise<{ summary: ApiEventsSummary; lastModified: string | null }> {
  const res = await axios.get(EVENTS_SUMMARY_API_URL);
  return {
    summary: res.data as ApiEventsSummary,
    lastModified: res.headers['last-modified'] ?? null,
  };
}
