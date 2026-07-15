import { useEffect, useState } from 'react';
import { formatEventDateKey } from './eventAnchors';

export type CalendarDay = {
  date: Date;
  key: string;
  isCurrentMonth: boolean;
};

export function buildCalendarDays(monthStart: Date): CalendarDay[] {
  const firstCalendarDate = new Date(monthStart);
  firstCalendarDate.setDate(monthStart.getDate() - monthStart.getDay());
  const days: CalendarDay[] = [];

  for (let i = 0; i < 42; i++) {
    const date = new Date(firstCalendarDate);
    date.setDate(firstCalendarDate.getDate() + i);
    days.push({
      date,
      key: formatEventDateKey(date),
      isCurrentMonth: date.getMonth() === monthStart.getMonth(),
    });
  }

  return days;
}

export function buildEventsByDate<T extends { started_at: string }>(
  events: T[],
  calendarDays: CalendarDay[],
): Map<string, T[]> {
  const eventMap = new Map<string, T[]>();
  const visibleDateKeys = new Set(calendarDays.map((day) => day.key));

  events.forEach((event) => {
    const key = formatEventDateKey(new Date(event.started_at));

    if (!visibleDateKeys.has(key)) {
      return;
    }

    const dayEvents = eventMap.get(key);
    if (dayEvents) {
      dayEvents.push(event);
    } else {
      eventMap.set(key, [event]);
    }
  });

  eventMap.forEach((dayEvents) => {
    dayEvents.sort((a, b) => new Date(a.started_at).getTime() - new Date(b.started_at).getTime());
  });

  return eventMap;
}

function getMillisecondsUntilNextDay(): number {
  const now = new Date();
  const nextDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

  return Math.max(0, nextDay.getTime() - now.getTime());
}

export function useTodayDate(): Date {
  const [today, setToday] = useState(() => new Date());

  useEffect(() => {
    let timerId: number | undefined;

    const scheduleNextUpdate = () => {
      if (timerId !== undefined) {
        window.clearTimeout(timerId);
      }

      timerId = window.setTimeout(updateToday, getMillisecondsUntilNextDay());
    };
    const updateToday = () => {
      const nextToday = new Date();
      setToday((currentToday) => (
        formatEventDateKey(currentToday) === formatEventDateKey(nextToday)
          ? currentToday
          : nextToday
      ));
      scheduleNextUpdate();
    };
    const updateTodayAfterResume = () => {
      if (!document.hidden) {
        updateToday();
      }
    };

    scheduleNextUpdate();
    document.addEventListener('visibilitychange', updateTodayAfterResume);

    return () => {
      if (timerId !== undefined) {
        window.clearTimeout(timerId);
      }
      document.removeEventListener('visibilitychange', updateTodayAfterResume);
    };
  }, []);

  return today;
}
