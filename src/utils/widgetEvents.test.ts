import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useWidgetEvents } from './widgetEvents';
import { makeEvent } from '../test/fixtures';
import { updateTrackingData, getTrackingDataSnapshot } from '../utils/newEventTrackingStore';
import type { NewEventTrackingData } from '../utils/newEventTracking';

const FIXED_NOW = new Date('2026-01-10T12:00:00+09:00');
const EMPTY_TRACKING_DATA: NewEventTrackingData = { version: 1, records: {}, dismissedUids: [], acknowledgedDotUids: [] };

describe('useWidgetEvents', () => {
  beforeEach(() => {
    updateTrackingData(() => EMPTY_TRACKING_DATA);
  });

  it('splits fetched events into sorted future/past lists', async () => {
    const future1 = makeEvent({ uid: 'future-1', started_at: '2026-02-01T10:00:00+09:00', open_status: 'open' });
    const future2 = makeEvent({ uid: 'future-2', started_at: '2026-01-15T10:00:00+09:00', open_status: 'open' });
    const past1 = makeEvent({ uid: 'past-1', started_at: '2025-12-01T10:00:00+09:00', open_status: 'close' });
    const past2 = makeEvent({ uid: 'past-2', started_at: '2025-11-01T10:00:00+09:00', open_status: 'close' });
    const cancelled = makeEvent({ uid: 'cancelled-1', started_at: '2026-03-01T10:00:00+09:00', open_status: 'cancelled' });
    const fetcher = vi.fn().mockResolvedValue({ events: [future1, past1, cancelled, future2, past2] });

    const { result } = renderHook(() => useWidgetEvents(fetcher, []));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.futureEvents.map((e) => e.uid)).toEqual(['future-2', 'future-1']);
    expect(result.current.pastEvents.map((e) => e.uid)).toEqual(['past-1', 'past-2']);
    expect(result.current.errorMessage).toBe('');
  });

  it('surfaces the API error detail message when present', async () => {
    const fetcher = vi.fn().mockRejectedValue({
      message: 'Request failed with status code 404',
      response: { data: { detail: "Group 'unknown' not found" } },
    });

    const { result } = renderHook(() => useWidgetEvents(fetcher, []));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.errorMessage).toBe("Group 'unknown' not found");
  });

  it('falls back to the generic error message when no detail is present', async () => {
    const fetcher = vi.fn().mockRejectedValue({ message: 'Network Error' });

    const { result } = renderHook(() => useWidgetEvents(fetcher, []));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.errorMessage).toBe('Network Error');
  });

  it('does not write fetched events into the shared new-event tracking store', async () => {
    // Widgets only ever see a narrow slice of events (one community, one
    // page), so merging that into the tracking store the main site reads/
    // writes would prune away every event outside that slice.
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
    const future = makeEvent({ uid: 'future-1', started_at: '2099-01-01T00:00:00+09:00', open_status: 'open' });
    const fetcher = vi.fn().mockResolvedValue({ events: [future] });

    const { result } = renderHook(() => useWidgetEvents(fetcher, []));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(getTrackingDataSnapshot()).toEqual(EMPTY_TRACKING_DATA);
    expect(setItemSpy).not.toHaveBeenCalled();

    setItemSpy.mockRestore();
  });

  it('does not prune unrelated tracking data (e.g. from the main site) when fetching a narrow event slice', async () => {
    updateTrackingData(() => ({
      version: 1,
      records: { 'other-event': { firstSeenAt: FIXED_NOW.toISOString() } },
      dismissedUids: ['dismissed-event'],
      acknowledgedDotUids: [],
    }));

    // Spy starts after the seeding write above, so it only observes writes
    // triggered by the hook itself.
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
    const future = makeEvent({ uid: 'future-1', started_at: '2099-01-01T00:00:00+09:00', open_status: 'open' });
    const fetcher = vi.fn().mockResolvedValue({ events: [future] });

    const { result } = renderHook(() => useWidgetEvents(fetcher, []));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(getTrackingDataSnapshot().records).toEqual({ 'other-event': { firstSeenAt: FIXED_NOW.toISOString() } });
    expect(getTrackingDataSnapshot().dismissedUids).toEqual(['dismissed-event']);
    expect(setItemSpy).not.toHaveBeenCalled();

    setItemSpy.mockRestore();
  });

  it('refetches when the deps array changes', async () => {
    const eventForA = makeEvent({ uid: 'a-1', started_at: '2026-02-01T10:00:00+09:00', open_status: 'open' });
    const eventForB = makeEvent({ uid: 'b-1', started_at: '2026-02-01T10:00:00+09:00', open_status: 'open' });
    const fetcher = vi.fn()
      .mockResolvedValueOnce({ events: [eventForA] })
      .mockResolvedValueOnce({ events: [eventForB] });

    const { result, rerender } = renderHook(
      ({ key }) => useWidgetEvents(fetcher, [key]),
      { initialProps: { key: 'a' } },
    );

    await waitFor(() => expect(result.current.futureEvents.map((e) => e.uid)).toEqual(['a-1']));

    rerender({ key: 'b' });

    await waitFor(() => expect(result.current.futureEvents.map((e) => e.uid)).toEqual(['b-1']));
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('does not refetch when the deps array is unchanged across rerenders', async () => {
    const fetcher = vi.fn().mockResolvedValue({ events: [] });

    const { rerender } = renderHook(() => useWidgetEvents(fetcher, []));
    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1));

    rerender();

    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});
