import axios from 'axios';
import type { ApiEvent, ApiGroup, ApiGroupDetail, ApiEventsSummary } from '../types/events';

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
  'image_url',
].join(',');

export const GROUPS_FIELDS = [
  'key',
  'title',
  'image_url',
  'archive_source',
  'archive_url',
].join(',');

export const GROUP_DETAIL_FIELDS = [
  'key',
  'title',
  'sub_title',
  'url',
  'description',
  'image_url',
  'website_url',
  'x_username',
  'facebook_url',
  'member_users_count',
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

export type GroupEventsOrder = 'asc' | 'desc';

export type GroupEventsPageOptions = {
  fields?: string;
  page?: number;
  perPage?: number;
  order?: GroupEventsOrder;
};

export type GroupEventsPage = {
  events: ApiEvent[];
  lastModified: string | null;
  page: number | null;
  perPage: number | null;
  totalCount: number | null;
  totalPages: number | null;
};

function parseIntHeader(value: unknown): number | null {
  return value === undefined ? null : Number(value);
}

export async function fetchGroupEvents(groupKey: string, options: GroupEventsPageOptions = {}): Promise<GroupEventsPage> {
  const { fields = EVENTS_FIELDS, page, perPage, order } = options;
  const params: Record<string, string | number> = { fields };
  if (page !== undefined) {
    params.page = page;
  }
  if (perPage !== undefined) {
    params.per_page = perPage;
  }
  if (order !== undefined) {
    params.order = order;
  }

  const res = await axios.get(`${GROUPS_API_URL}/${encodeURIComponent(groupKey)}/events`, { params });
  return {
    events: res.data as ApiEvent[],
    lastModified: res.headers['last-modified'] ?? null,
    page: parseIntHeader(res.headers['x-page']),
    perPage: parseIntHeader(res.headers['x-per-page']),
    totalCount: parseIntHeader(res.headers['x-total-count']),
    totalPages: parseIntHeader(res.headers['x-total-pages']),
  };
}

export async function fetchEventDescription(uid: string, options?: { year?: number }): Promise<string> {
  const url = options?.year ? `${EVENTS_API_URL}/year/${options.year}` : EVENTS_API_URL;
  const res = await axios.get(url, { params: { fields: 'description', uid } });
  const event = Array.isArray(res.data) ? res.data[0] : res.data;
  return (event?.description ?? '') as string;
}

export async function fetchGroup(groupKey: string): Promise<ApiGroupDetail> {
  const res = await axios.get(`${GROUPS_API_URL}/${encodeURIComponent(groupKey)}`, { params: { fields: GROUP_DETAIL_FIELDS } });
  return res.data as ApiGroupDetail;
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
