import { useEffect, useState } from 'react';
import type { DependencyList } from 'react';
import type { ApiEvent } from '../types/events';
import { isFutureEvent, isPastEvent } from './eventGroups';
import { sortByStartedAtAsc, sortByStartedAtDesc } from './eventSort';

export type WidgetEventsState = {
  isLoading: boolean;
  pastEvents: ApiEvent[];
  futureEvents: ApiEvent[];
  errorMessage: string;
};

export function extractErrorMessage(err: unknown): string {
  const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
  return detail ?? (err as { message?: string })?.message ?? '';
}

export function useWidgetEvents(fetcher: () => Promise<{ events: ApiEvent[] }>, deps: DependencyList): WidgetEventsState {
  const [data, setData] = useState<WidgetEventsState>({
    isLoading: true,
    pastEvents: [],
    futureEvents: [],
    errorMessage: '',
  });
  useEffect(() => {
    let cancelled = false;
    setData((previous) => ({ ...previous, isLoading: true, errorMessage: '' }));
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
  }, deps);

  return data;
}
