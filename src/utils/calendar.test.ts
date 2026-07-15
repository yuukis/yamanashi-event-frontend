import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { buildCalendarDays, buildEventsByDate, useTodayDate } from './calendar';

describe('buildCalendarDays', () => {
  it('builds a 42-day grid starting on the Sunday on/before the 1st, covering the whole month', () => {
    const days = buildCalendarDays(new Date(2026, 0, 1));

    expect(days).toHaveLength(42);
    expect(days[0].date.getDay()).toBe(0);
    expect(days[0].key).toBe('2025-12-28');
    expect(days.some((day) => day.key === '2026-01-01' && day.isCurrentMonth)).toBe(true);
    expect(days.filter((day) => day.isCurrentMonth)).toHaveLength(31);
  });
});

describe('buildEventsByDate', () => {
  it('groups events by their started_at date, limited to the visible calendar days', () => {
    const calendarDays = buildCalendarDays(new Date(2026, 0, 1));
    const inMonth = { uid: 'a', started_at: '2026-01-15T10:00:00+09:00' };
    const outOfGrid = { uid: 'b', started_at: '2099-01-15T10:00:00+09:00' };

    const eventsByDate = buildEventsByDate([inMonth, outOfGrid], calendarDays);

    expect(eventsByDate.get('2026-01-15')).toEqual([inMonth]);
    expect(eventsByDate.size).toBe(1);
  });

  it('sorts same-day events by started_at ascending', () => {
    const calendarDays = buildCalendarDays(new Date(2026, 0, 1));
    const later = { uid: 'later', started_at: '2026-01-15T18:00:00+09:00' };
    const earlier = { uid: 'earlier', started_at: '2026-01-15T09:00:00+09:00' };

    const eventsByDate = buildEventsByDate([later, earlier], calendarDays);

    expect(eventsByDate.get('2026-01-15')?.map((e) => e.uid)).toEqual(['earlier', 'later']);
  });
});

describe('useTodayDate', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns the current date on mount', () => {
    vi.setSystemTime(new Date('2026-01-10T12:00:00+09:00'));

    const { result } = renderHook(() => useTodayDate());

    expect(result.current.getFullYear()).toBe(2026);
    expect(result.current.getMonth()).toBe(0);
    expect(result.current.getDate()).toBe(10);
  });

  it('updates once the date rolls over past midnight', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-10T23:59:59+09:00'));

    const { result } = renderHook(() => useTodayDate());
    expect(result.current.getDate()).toBe(10);

    act(() => {
      vi.setSystemTime(new Date('2026-01-11T00:00:01+09:00'));
      vi.advanceTimersByTime(2000);
    });

    expect(result.current.getDate()).toBe(11);
  });
});
