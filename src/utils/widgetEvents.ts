import { useEffect, useState, useSyncExternalStore } from 'react';
import type { ApiEvent } from '../types/events';
import { isFutureEvent, isPastEvent } from './eventGroups';
import { sortByStartedAtAsc, sortByStartedAtDesc } from './eventSort';
import { subscribeNow, getNow } from './nowTicker';
import { mergeTrackingData } from './newEventTracking';
import { isLocalStorageAvailable, updateTrackingData } from './newEventTrackingStore';

export type WidgetEventsState = {
  isLoading: boolean;
  pastEvents: ApiEvent[];
  futureEvents: ApiEvent[];
  errorMessage: string;
};

function extractErrorMessage(err: unknown): string {
  const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
  return detail ?? (err as { message?: string })?.message ?? '';
}

export function useWidgetEvents(fetcher: () => Promise<{ events: ApiEvent[] }>): WidgetEventsState {
  const [data, setData] = useState<WidgetEventsState>({
    isLoading: true,
    pastEvents: [],
    futureEvents: [],
    errorMessage: '',
  });
  const now = useSyncExternalStore(subscribeNow, getNow);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { events } = await fetcher();
        if (cancelled) {
          return;
        }
        setData({
          isLoading: false,
          pastEvents: events.filter(isPastEvent).sort(sortByStartedAtDesc),
          futureEvents: events.filter(isFutureEvent).sort(sortByStartedAtAsc),
          errorMessage: '',
        });
      } catch (err) {
        if (cancelled) {
          return;
        }
        setData({ isLoading: false, pastEvents: [], futureEvents: [], errorMessage: extractErrorMessage(err) });
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isLocalStorageAvailable() || data.futureEvents.length === 0) {
      return;
    }
    updateTrackingData((previous) => mergeTrackingData(previous, data.futureEvents, now));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.futureEvents]);

  return data;
}
