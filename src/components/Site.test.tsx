import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithChakra } from '../test/test-utils';
import { ICalendarButton } from './Site';
import { makeEvent } from '../test/fixtures';
import { fetchEvents } from '../utils/api';

const FIXED_NOW = new Date('2026-01-10T12:00:00+09:00');

vi.mock('../utils/nowTicker', () => ({
  subscribeNow: () => () => {},
  getNow: () => FIXED_NOW,
}));

vi.mock('../utils/api', () => ({
  fetchEvents: vi.fn(),
}));

function mockEvents(events: ReturnType<typeof makeEvent>[]) {
  vi.mocked(fetchEvents).mockResolvedValue({ events, lastModified: null });
}

function renderButton() {
  renderWithChakra(<ICalendarButton />);
  return screen.getByRole('button');
}

async function expectAccessibleName(button: HTMLElement, name: string) {
  await waitFor(() => expect(button).toHaveAccessibleName(name));
}

describe('ICalendarButton', () => {
  beforeEach(() => {
    vi.mocked(fetchEvents).mockReset();
    vi.setSystemTime(FIXED_NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows the normal state with no border or dot when there is no event today', async () => {
    mockEvents([]);
    const button = renderButton();

    await expectAccessibleName(button, 'イベントカレンダー');
    expect(screen.queryByTestId('header-ongoing-dot')).not.toBeInTheDocument();
  });

  it('shows a highlighted border but no dot for an event happening later today', async () => {
    mockEvents([makeEvent({
      started_at: '2026-01-10T18:00:00+09:00',
      ended_at: '2026-01-10T20:00:00+09:00',
    })]);
    const button = renderButton();

    await expectAccessibleName(button, '本日開催のイベントがあります');
    expect(screen.queryByTestId('header-ongoing-dot')).not.toBeInTheDocument();
  });

  it('shows the border and a pulsing dot for an event currently in progress', async () => {
    mockEvents([makeEvent({
      started_at: '2026-01-10T11:00:00+09:00',
      ended_at: '2026-01-10T13:00:00+09:00',
    })]);
    const button = renderButton();

    await expectAccessibleName(button, '開催中のイベントがあります');
    expect(screen.getByTestId('header-ongoing-dot')).toBeInTheDocument();
  });

  it('reverts to the normal state once the event has ended', async () => {
    mockEvents([makeEvent({
      started_at: '2026-01-10T08:00:00+09:00',
      ended_at: '2026-01-10T09:00:00+09:00',
    })]);
    const button = renderButton();

    await expectAccessibleName(button, 'イベントカレンダー');
    expect(screen.queryByTestId('header-ongoing-dot')).not.toBeInTheDocument();
  });
});
