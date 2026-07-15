import axios from 'axios';
import type { ApiEvent, ApiGroup, ApiEventsSummary } from '../types/events';

export const EVENTS_API_URL = 'https://api.event.yamanashi.dev/events';
export const GROUPS_API_URL = 'https://api.event.yamanashi.dev/groups';
export const EVENTS_SUMMARY_API_URL = 'https://api.event.yamanashi.dev/summary/events';

export const EVENTS_FIELDS = [
  'uid',
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

const inFlightEventsRequests = new Map<string, Promise<{ events: ApiEvent[]; lastModified: string | null }>>();

export async function fetchEvents(fields: string = EVENTS_FIELDS): Promise<{ events: ApiEvent[]; lastModified: string | null }> {
  const inFlight = inFlightEventsRequests.get(fields);
  if (inFlight) {
    return inFlight;
  }

  const request = axios.get(EVENTS_API_URL, { params: { fields } })
    .then((res) => ({
      events: res.data as ApiEvent[],
      lastModified: res.headers['last-modified'] ?? null,
    }))
    .finally(() => {
      inFlightEventsRequests.delete(fields);
    });

  inFlightEventsRequests.set(fields, request);

  return request;
}

export async function fetchEventsByYear(year: number): Promise<{ events: ApiEvent[]; lastModified: string | null }> {
  const res = await axios.get(`${EVENTS_API_URL}/year/${year}`, { params: { fields: EVENTS_FIELDS } });
  return {
    events: res.data as ApiEvent[],
    lastModified: res.headers['last-modified'] ?? null,
  };
}

export async function fetchGroupEvents(groupKey: string, fields: string = EVENTS_FIELDS): Promise<{ events: ApiEvent[]; lastModified: string | null }> {
  const res = await axios.get(`${GROUPS_API_URL}/${encodeURIComponent(groupKey)}/events`, { params: { fields } });
  return {
    events: res.data as ApiEvent[],
    lastModified: res.headers['last-modified'] ?? null,
  };
}

export async function fetchEventDescription(uid: string, options?: { year?: number }): Promise<string> {
  const url = options?.year ? `${EVENTS_API_URL}/year/${options.year}` : EVENTS_API_URL;
  const res = await axios.get(url, { params: { fields: 'description', uid } });
  const event = Array.isArray(res.data) ? res.data[0] : res.data;
  return (event?.description ?? '') as string;
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
