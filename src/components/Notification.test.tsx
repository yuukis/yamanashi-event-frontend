import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithChakra } from '../test/test-utils';
import { NotificationButton } from './Notification';
import { makeEvent } from '../test/fixtures';
import { updateTrackingData } from '../utils/newEventTrackingStore';
import { mergeTrackingData, type NewEventTrackingData } from '../utils/newEventTracking';
import { fetchEvents } from '../utils/api';
import { jumpToAnchor } from '../utils/hashScroll';
import type { EventWithGroup } from '../types/events';

const FIXED_NOW = new Date('2026-01-10T12:00:00+09:00');
const EMPTY_TRACKING_DATA: NewEventTrackingData = { version: 1, records: {}, dismissedUids: [], acknowledgedDotUids: [] };

vi.mock('../utils/nowTicker', () => ({
  subscribeNow: () => () => {},
  getNow: () => FIXED_NOW,
}));

vi.mock('../utils/api', () => ({
  fetchEvents: vi.fn(),
}));

vi.mock('../utils/hashScroll', () => ({
  jumpToAnchor: vi.fn(),
}));

vi.mock('../utils/newEventTracking', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../utils/newEventTracking')>();
  return { ...actual, mergeTrackingData: vi.fn(actual.mergeTrackingData) };
});

function makeFutureEvent(overrides: Partial<EventWithGroup> = {}) {
  return makeEvent({
    started_at: '2026-01-15T10:00:00+09:00',
    ended_at: '2026-01-15T12:00:00+09:00',
    updated_at: '2026-01-09T00:00:00+09:00',
    open_status: 'open',
    ...overrides,
  });
}

function mockFetchEvents(events: EventWithGroup[]) {
  vi.mocked(fetchEvents).mockResolvedValue({ events, lastModified: null });
}

function openPopover() {
  fireEvent.click(screen.getByRole('button', { name: /Notification|新着イベントの通知があります/ }));
}

describe('NotificationButton', () => {
  beforeEach(() => {
    updateTrackingData(() => EMPTY_TRACKING_DATA);
    mockFetchEvents([]);
    vi.mocked(jumpToAnchor).mockClear();
  });

  it('shows "新着イベント" as the popover title', async () => {
    renderWithChakra(<NotificationButton />);
    openPopover();

    expect(await screen.findByText('新着イベント')).toBeInTheDocument();
  });

  it('shows the empty-state message when there are no new events', async () => {
    renderWithChakra(<NotificationButton />);
    openPopover();

    expect(await screen.findByText('新着イベントはありません')).toBeInTheDocument();
  });

  it('shows the "Webプッシュ通知" title above the notify description', async () => {
    renderWithChakra(<NotificationButton />);
    openPopover();

    expect(await screen.findByText('Webプッシュ通知')).toBeInTheDocument();
  });

  it('lists a new event with its start date/time and title, and jumps to it on click', async () => {
    mockFetchEvents([makeFutureEvent({ uid: 'e1', title: '甲府もくもく会', started_at: '2026-01-15T19:00:00+09:00' })]);
    renderWithChakra(<NotificationButton />);
    openPopover();

    expect(await screen.findByText('甲府もくもく会')).toBeInTheDocument();
    expect(screen.getByText('1/15(木) 19:00〜')).toBeInTheDocument();

    fireEvent.click(screen.getByText('甲府もくもく会'));

    expect(jumpToAnchor).toHaveBeenCalledWith('event-item-e1');
  });

  it('sorts new events by start time ascending', async () => {
    mockFetchEvents([
      makeFutureEvent({ uid: 'later', title: 'Later Event', started_at: '2026-01-20T10:00:00+09:00' }),
      makeFutureEvent({ uid: 'earlier', title: 'Earlier Event', started_at: '2026-01-12T10:00:00+09:00' }),
    ]);
    renderWithChakra(<NotificationButton />);
    openPopover();

    await screen.findByText('Earlier Event');

    const titles = screen.getAllByText(/Event$/).map((el) => el.textContent);
    expect(titles).toEqual(['Earlier Event', 'Later Event']);
  });

  it('excludes an event that has already started', async () => {
    mockFetchEvents([makeFutureEvent({ uid: 'started', title: 'Already Started', started_at: '2026-01-09T10:00:00+09:00' })]);
    renderWithChakra(<NotificationButton />);
    openPopover();

    expect(await screen.findByText('新着イベントはありません')).toBeInTheDocument();
    expect(screen.queryByText('Already Started')).not.toBeInTheDocument();
  });

  it('excludes an event whose updated_at is more than 7 days old', async () => {
    mockFetchEvents([makeFutureEvent({ uid: 'stale', title: 'Stale Event', updated_at: '2026-01-01T00:00:00+09:00' })]);
    renderWithChakra(<NotificationButton />);
    openPopover();

    expect(await screen.findByText('新着イベントはありません')).toBeInTheDocument();
    expect(screen.queryByText('Stale Event')).not.toBeInTheDocument();
  });

  it('removes the event from the list when the clear button is clicked', async () => {
    mockFetchEvents([makeFutureEvent({ uid: 'e1', title: 'Clearable Event' })]);
    renderWithChakra(<NotificationButton />);
    openPopover();

    await screen.findByText('Clearable Event');
    fireEvent.click(screen.getByRole('button', { name: '新着通知をクリア' }));

    expect(screen.queryByText('Clearable Event')).not.toBeInTheDocument();
    expect(screen.getByText('新着イベントはありません')).toBeInTheDocument();
  });

  it('shows a dot on the bell icon when there is an unacknowledged new event, and clears it once opened', async () => {
    mockFetchEvents([makeFutureEvent({ uid: 'e1', title: 'Dot Event' })]);
    renderWithChakra(<NotificationButton />);

    await screen.findByRole('button', { name: '新着イベントの通知があります' });

    fireEvent.click(screen.getByRole('button', { name: '新着イベントの通知があります' }));

    await screen.findByText('Dot Event');
    expect(screen.queryByRole('button', { name: '新着イベントの通知があります' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Notification' })).toBeInTheDocument();
  });

  it('re-runs mergeTrackingData when the popover is opened, not only on the initial fetch', async () => {
    mockFetchEvents([makeFutureEvent({ uid: 'e1', title: 'Event' })]);
    renderWithChakra(<NotificationButton />);

    await screen.findByRole('button', { name: '新着イベントの通知があります' });
    const callsAfterMount = vi.mocked(mergeTrackingData).mock.calls.length;
    expect(callsAfterMount).toBeGreaterThan(0);

    openPopover();
    await screen.findByText('Event');

    expect(vi.mocked(mergeTrackingData).mock.calls.length).toBeGreaterThan(callsAfterMount);
  });

  it('hides the new-events area when LocalStorage is unavailable, but keeps the description and notify button', async () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError');
    });

    renderWithChakra(<NotificationButton />);
    openPopover();

    await screen.findByText('新着イベント');
    expect(screen.queryByText('新着イベントはありません')).not.toBeInTheDocument();
    expect(screen.getByText(/新しくイベントが登録されたら通知します/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /通知を受け取る|通知を解除する/ })).toBeInTheDocument();

    setItemSpy.mockRestore();
  });
});
