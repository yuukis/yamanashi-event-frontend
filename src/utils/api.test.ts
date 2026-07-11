import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { fetchEvents, fetchGroups, fetchEventsSummary, EVENTS_API_URL, GROUPS_API_URL, EVENTS_SUMMARY_API_URL, EVENTS_FIELDS, GROUPS_FIELDS } from './api';

vi.mock('axios');

describe('fetchEvents', () => {
  beforeEach(() => {
    vi.mocked(axios.get).mockReset();
  });

  it('requests the events endpoint and returns events with last-modified', async () => {
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
});

describe('fetchGroups', () => {
  it('requests the groups endpoint and returns the parsed data', async () => {
    vi.mocked(axios.get).mockResolvedValue({ data: [{ key: 'g1' }] });

    const result = await fetchGroups();

    expect(axios.get).toHaveBeenCalledWith(GROUPS_API_URL, { params: { fields: GROUPS_FIELDS } });
    expect(result).toEqual([{ key: 'g1' }]);
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
