import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithChakra } from '../test/test-utils';
import { MiniEventCalendar } from './MiniEventCalendar';
import { buildCalendarDays, buildEventsByDate } from '../utils/calendar';

const MONTH_START = new Date(2026, 0, 1); // January 2026
const TODAY_KEY = '2026-01-10';

describe('MiniEventCalendar', () => {
  it('highlights the day that has an event and shows its details in a tooltip', async () => {
    const calendarDays = buildCalendarDays(MONTH_START);
    const event = { uid: 'e1', title: '甲府もくもく会', started_at: '2026-01-15T19:00:00+09:00' };
    const eventsByDate = buildEventsByDate([event], calendarDays);

    renderWithChakra(
      <MiniEventCalendar calendarDays={calendarDays}
                          todayKey={TODAY_KEY}
                          eventsByDate={eventsByDate}
                          isLoading={false}
                          errorMessage={''}
                          />,
    );

    const dayCell = screen.getByLabelText('1月15日 イベントあり');
    expect(dayCell).toBeInTheDocument();

    fireEvent.focus(dayCell);
    expect(await screen.findByText('甲府もくもく会')).toBeInTheDocument();
  });

  it('marks today with the "今日" accessible label', () => {
    const calendarDays = buildCalendarDays(MONTH_START);
    const eventsByDate = buildEventsByDate([], calendarDays);

    renderWithChakra(
      <MiniEventCalendar calendarDays={calendarDays}
                          todayKey={TODAY_KEY}
                          eventsByDate={eventsByDate}
                          isLoading={false}
                          errorMessage={''}
                          />,
    );

    expect(screen.getByLabelText('1月10日 今日')).toBeInTheDocument();
  });

  it('calls onDayActivate with the day\'s events when a day with events is clicked', () => {
    const calendarDays = buildCalendarDays(MONTH_START);
    const event = { uid: 'e1', title: '甲府もくもく会', started_at: '2026-01-15T19:00:00+09:00' };
    const eventsByDate = buildEventsByDate([event], calendarDays);
    const onDayActivate = vi.fn();

    renderWithChakra(
      <MiniEventCalendar calendarDays={calendarDays}
                          todayKey={TODAY_KEY}
                          eventsByDate={eventsByDate}
                          isLoading={false}
                          errorMessage={''}
                          onDayActivate={onDayActivate}
                          />,
    );

    fireEvent.click(screen.getByLabelText('1月15日 イベントあり'));

    expect(onDayActivate).toHaveBeenCalledWith([event], '2026-01-15');
  });

  it('is not clickable when onDayActivate is not provided', () => {
    const calendarDays = buildCalendarDays(MONTH_START);
    const event = { uid: 'e1', title: '甲府もくもく会', started_at: '2026-01-15T19:00:00+09:00' };
    const eventsByDate = buildEventsByDate([event], calendarDays);

    renderWithChakra(
      <MiniEventCalendar calendarDays={calendarDays}
                          todayKey={TODAY_KEY}
                          eventsByDate={eventsByDate}
                          isLoading={false}
                          errorMessage={''}
                          />,
    );

    expect(screen.queryByRole('link', { name: /1月15日/ })).not.toBeInTheDocument();
  });

  it('shows a loading message while isLoading is true', () => {
    const calendarDays = buildCalendarDays(MONTH_START);

    renderWithChakra(
      <MiniEventCalendar calendarDays={calendarDays}
                          todayKey={TODAY_KEY}
                          eventsByDate={new Map()}
                          isLoading={true}
                          errorMessage={''}
                          />,
    );

    expect(screen.getByText('イベント日を読み込み中です')).toBeInTheDocument();
  });

  it('shows an error message when errorMessage is set', () => {
    const calendarDays = buildCalendarDays(MONTH_START);

    renderWithChakra(
      <MiniEventCalendar calendarDays={calendarDays}
                          todayKey={TODAY_KEY}
                          eventsByDate={new Map()}
                          isLoading={false}
                          errorMessage={'Network Error'}
                          />,
    );

    expect(screen.getByText('イベント日を取得できませんでした')).toBeInTheDocument();
  });
});
