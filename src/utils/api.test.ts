import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import {
  fetchEvents,
  fetchEventsByYear,
  fetchGroupEvents,
  fetchEventDescription,
  fetchGroup,
  fetchGroups,
  fetchEventsSummary,
  fetchGroupStartYear,
  EVENTS_API_URL,
  GROUPS_API_URL,
  EVENTS_SUMMARY_API_URL,
  GROUPS_SUMMARY_API_URL,
  EVENTS_FIELDS,
  GROUPS_FIELDS,
  GROUPS_SUMMARY_FIELDS,
  GROUP_DETAIL_FIELDS,
} from './api';

vi.mock('axios');

describe('fetchEvents', () => {
  beforeEach(() => {
    vi.mocked(axios.get).mockReset();
  });

  it('requests the events endpoint with lightweight fields and returns events with last-modified', async () => {
    vi.mocked(axios.get).mockResolvedValue({
      data: [{ uid: 'a' }],
      headers: { 'last-modified': 'Wed, 01 Jan 2026 00:00:00 GMT' },
    });

    const result = await fetchEvents();

    expect(axios.get).toHaveBeenCalledWith(EVENTS_API_URL, { params: { fields: EVENTS_FIELDS } });
    expect(result).toEqual({
      events: [{ uid: 'a' }],
      lastModified: 'Wed, 01 Jan 2026 00:00:00 GMT',
    });
  });

  it('does not request description in the event list field set', () => {
    expect(EVENTS_FIELDS.split(',')).not.toContain('description');
  });

  it('returns null last-modified when the header is absent', async () => {
    vi.mocked(axios.get).mockResolvedValue({ data: [], headers: {} });

    const result = await fetchEvents();

    expect(result.lastModified).toBeNull();
  });

  it('dedupes concurrent calls into a single in-flight request', async () => {
    let resolveRequest: (value: unknown) => void;
    vi.mocked(axios.get).mockReturnValue(
      new Promise((resolve) => {
        resolveRequest = resolve;
      }) as ReturnType<typeof axios.get>,
    );

    const first = fetchEvents();
    const second = fetchEvents();

    expect(axios.get).toHaveBeenCalledTimes(1);

    resolveRequest!({ data: [{ uid: 'a' }], headers: {} });

    await expect(first).resolves.toEqual(await second);
  });

  it('issues a new request after the previous one settles', async () => {
    vi.mocked(axios.get).mockResolvedValue({ data: [], headers: {} });

    await fetchEvents();
    await fetchEvents();

    expect(axios.get).toHaveBeenCalledTimes(2);
  });

  it('requests a caller-provided field set instead of the default', async () => {
    vi.mocked(axios.get).mockResolvedValue({ data: [], headers: {} });

    await fetchEvents('uid,title');

    expect(axios.get).toHaveBeenCalledWith(EVENTS_API_URL, { params: { fields: 'uid,title' } });
  });

  it('dedupes concurrent calls only when they request the same field set', async () => {
    let resolveDefault: (value: unknown) => void;
    let resolveCustom: (value: unknown) => void;
    vi.mocked(axios.get).mockImplementation((_url, config) => {
      const fields = (config as { params: { fields: string } }).params.fields;
      return new Promise((resolve) => {
        if (fields === EVENTS_FIELDS) {
          resolveDefault = resolve;
        } else {
          resolveCustom = resolve;
        }
      }) as ReturnType<typeof axios.get>;
    });

    const defaultRequest = fetchEvents();
    const customRequest = fetchEvents('uid,title');

    expect(axios.get).toHaveBeenCalledTimes(2);

    resolveDefault!({ data: [{ uid: 'a' }], headers: {} });
    resolveCustom!({ data: [{ uid: 'b' }], headers: {} });

    await expect(defaultRequest).resolves.toEqual({ events: [{ uid: 'a' }], lastModified: null });
    await expect(customRequest).resolves.toEqual({ events: [{ uid: 'b' }], lastModified: null });
  });
});

describe('fetchEventsByYear', () => {
  beforeEach(() => {
    vi.mocked(axios.get).mockReset();
  });

  it('requests the year-scoped events endpoint and returns events with last-modified', async () => {
    vi.mocked(axios.get).mockResolvedValue({
      data: [{ uid: 'a' }],
      headers: { 'last-modified': 'Wed, 01 Jan 2026 00:00:00 GMT' },
    });

    const result = await fetchEventsByYear(2026);

    expect(axios.get).toHaveBeenCalledWith(`${EVENTS_API_URL}/year/2026`, { params: { fields: EVENTS_FIELDS } });
    expect(result).toEqual({
      events: [{ uid: 'a' }],
      lastModified: 'Wed, 01 Jan 2026 00:00:00 GMT',
    });
  });

  it('returns null last-modified when the header is absent', async () => {
    vi.mocked(axios.get).mockResolvedValue({ data: [], headers: {} });

    const result = await fetchEventsByYear(2026);

    expect(result.lastModified).toBeNull();
  });
});

describe('fetchGroupEvents', () => {
  beforeEach(() => {
    vi.mocked(axios.get).mockReset();
  });

  it('requests the group-scoped events endpoint with only the fields param by default', async () => {
    vi.mocked(axios.get).mockResolvedValue({
      data: [{ uid: 'a' }],
      headers: { 'last-modified': 'Wed, 01 Jan 2026 00:00:00 GMT' },
    });

    const result = await fetchGroupEvents('techmujin');

    expect(axios.get).toHaveBeenCalledWith(`${GROUPS_API_URL}/techmujin/events`, { params: { fields: EVENTS_FIELDS } });
    expect(result).toEqual({
      events: [{ uid: 'a' }],
      lastModified: 'Wed, 01 Jan 2026 00:00:00 GMT',
      page: null,
      perPage: null,
      totalCount: null,
      totalPages: null,
    });
  });

  it('requests a caller-provided field set instead of the default', async () => {
    vi.mocked(axios.get).mockResolvedValue({ data: [], headers: {} });

    await fetchGroupEvents('techmujin', { fields: 'uid,title' });

    expect(axios.get).toHaveBeenCalledWith(`${GROUPS_API_URL}/techmujin/events`, { params: { fields: 'uid,title' } });
  });

  it('includes page, per_page and order only when explicitly provided', async () => {
    vi.mocked(axios.get).mockResolvedValue({ data: [], headers: {} });

    await fetchGroupEvents('techmujin', { page: 2, perPage: 20, order: 'desc' });

    expect(axios.get).toHaveBeenCalledWith(`${GROUPS_API_URL}/techmujin/events`, {
      params: { fields: EVENTS_FIELDS, page: 2, per_page: 20, order: 'desc' },
    });
  });

  it('encodes the group key when building the URL', async () => {
    vi.mocked(axios.get).mockResolvedValue({ data: [], headers: {} });

    await fetchGroupEvents('a/b c');

    expect(axios.get).toHaveBeenCalledWith(`${GROUPS_API_URL}/a%2Fb%20c/events`, { params: { fields: EVENTS_FIELDS } });
  });

  it('returns null last-modified when the header is absent', async () => {
    vi.mocked(axios.get).mockResolvedValue({ data: [], headers: {} });

    const result = await fetchGroupEvents('techmujin');

    expect(result.lastModified).toBeNull();
  });

  it('parses pagination headers into numbers', async () => {
    vi.mocked(axios.get).mockResolvedValue({
      data: [],
      headers: { 'x-page': '2', 'x-per-page': '20', 'x-total-count': '111', 'x-total-pages': '6' },
    });

    const result = await fetchGroupEvents('shingenpy', { page: 2, perPage: 20 });

    expect(result.page).toBe(2);
    expect(result.perPage).toBe(20);
    expect(result.totalCount).toBe(111);
    expect(result.totalPages).toBe(6);
  });

  it('returns null pagination fields when the headers are absent', async () => {
    vi.mocked(axios.get).mockResolvedValue({ data: [], headers: {} });

    const result = await fetchGroupEvents('techmujin');

    expect(result.page).toBeNull();
    expect(result.perPage).toBeNull();
    expect(result.totalCount).toBeNull();
    expect(result.totalPages).toBeNull();
  });

  it('returns null (not NaN) for a non-numeric pagination header, so callers\' ?? fallback still applies', async () => {
    vi.mocked(axios.get).mockResolvedValue({
      data: [],
      headers: { 'x-page': 'not-a-number' },
    });

    const result = await fetchGroupEvents('techmujin');

    expect(result.page).toBeNull();
    expect(result.page).not.toBeNaN();
  });
});

describe('fetchEventDescription', () => {
  beforeEach(() => {
    vi.mocked(axios.get).mockReset();
  });

  it('requests only the target event description by uid', async () => {
    vi.mocked(axios.get).mockResolvedValue({
      data: [{ description: 'イベント説明文' }],
      headers: {},
    });

    const description = await fetchEventDescription('event-1');

    expect(axios.get).toHaveBeenCalledWith(EVENTS_API_URL, {
      params: { fields: 'description', uid: 'event-1' },
    });
    expect(description).toBe('イベント説明文');
  });

  it('requests the year-scoped events endpoint when year is specified', async () => {
    vi.mocked(axios.get).mockResolvedValue({
      data: [{ description: '年別ページのイベント説明文' }],
      headers: {},
    });

    const description = await fetchEventDescription('event-1', { year: 2026 });

    expect(axios.get).toHaveBeenCalledWith(`${EVENTS_API_URL}/year/2026`, {
      params: { fields: 'description', uid: 'event-1' },
    });
    expect(description).toBe('年別ページのイベント説明文');
  });

  it('returns an empty string when the target event has no description', async () => {
    vi.mocked(axios.get).mockResolvedValue({ data: [], headers: {} });

    await expect(fetchEventDescription('event-1')).resolves.toBe('');
  });
});

describe('fetchGroups', () => {
  it('requests the groups endpoint and returns the parsed data', async () => {
    vi.mocked(axios.get).mockResolvedValue({ data: [{ key: 'g1' }] });

    const result = await fetchGroups();

    expect(axios.get).toHaveBeenCalledWith(GROUPS_API_URL, { params: { fields: GROUPS_FIELDS } });
    expect(result).toEqual([{ key: 'g1' }]);
  });

  it('requests a custom field set when given one', async () => {
    vi.mocked(axios.get).mockResolvedValue({ data: [{ key: 'g1' }] });

    await fetchGroups(GROUPS_SUMMARY_FIELDS);

    expect(axios.get).toHaveBeenCalledWith(GROUPS_API_URL, { params: { fields: GROUPS_SUMMARY_FIELDS } });
  });
});

describe('fetchGroup', () => {
  it('requests the single group endpoint with detail fields and returns the parsed data', async () => {
    vi.mocked(axios.get).mockResolvedValue({ data: { key: 'g1', title: 'Group 1' } });

    const result = await fetchGroup('g1');

    expect(axios.get).toHaveBeenCalledWith(`${GROUPS_API_URL}/g1`, { params: { fields: GROUP_DETAIL_FIELDS } });
    expect(result).toEqual({ key: 'g1', title: 'Group 1' });
  });

  it('URL-encodes the group key in the request path', async () => {
    vi.mocked(axios.get).mockResolvedValue({ data: {} });

    await fetchGroup('a b/c');

    expect(axios.get).toHaveBeenCalledWith(`${GROUPS_API_URL}/a%20b%2Fc`, { params: { fields: GROUP_DETAIL_FIELDS } });
  });

  it('requests the description field for the community profile', () => {
    expect(GROUP_DETAIL_FIELDS.split(',')).toContain('description');
  });
});

describe('fetchEventsSummary', () => {
  it('requests the summary endpoint and returns the parsed data with last-modified', async () => {
    const summary = { from_year: 2010, to_year: 2026, granularity: 'month', years: [], heatmap: [] };
    vi.mocked(axios.get).mockResolvedValue({
      data: summary,
      headers: { 'last-modified': 'Wed, 01 Jan 2026 00:00:00 GMT' },
    });

    const result = await fetchEventsSummary();

    expect(axios.get).toHaveBeenCalledWith(EVENTS_SUMMARY_API_URL);
    expect(result).toEqual({
      summary,
      lastModified: 'Wed, 01 Jan 2026 00:00:00 GMT',
    });
  });

  it('returns null last-modified when the header is absent', async () => {
    const summary = { from_year: 2010, to_year: 2026, granularity: 'month', years: [], heatmap: [] };
    vi.mocked(axios.get).mockResolvedValue({ data: summary, headers: {} });

    const result = await fetchEventsSummary();

    expect(result.lastModified).toBeNull();
  });
});

describe('fetchGroupStartYear', () => {
  it('requests the group summary endpoint for only the start_year field', async () => {
    vi.mocked(axios.get).mockResolvedValue({ data: { start_year: 2018 } });

    const result = await fetchGroupStartYear('aibase');

    expect(axios.get).toHaveBeenCalledWith(`${GROUPS_SUMMARY_API_URL}/aibase`, { params: { fields: 'start_year' } });
    expect(result).toBe(2018);
  });

  it('URL-encodes the group key in the request path', async () => {
    vi.mocked(axios.get).mockResolvedValue({ data: { start_year: 2018 } });

    await fetchGroupStartYear('a b/c');

    expect(axios.get).toHaveBeenCalledWith(`${GROUPS_SUMMARY_API_URL}/a%20b%2Fc`, { params: { fields: 'start_year' } });
  });

  it('returns null when start_year is absent from the response', async () => {
    vi.mocked(axios.get).mockResolvedValue({ data: {} });

    const result = await fetchGroupStartYear('aibase');

    expect(result).toBeNull();
  });

  it('returns null when start_year is not a finite number (e.g. a string or NaN)', async () => {
    vi.mocked(axios.get).mockResolvedValue({ data: { start_year: '2018' } });
    await expect(fetchGroupStartYear('aibase')).resolves.toBeNull();

    vi.mocked(axios.get).mockResolvedValue({ data: { start_year: Infinity } });
    await expect(fetchGroupStartYear('aibase')).resolves.toBeNull();
  });
});
