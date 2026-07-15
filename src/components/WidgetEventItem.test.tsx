import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithChakra } from '../test/test-utils';
import { WidgetEventItem, WidgetEventEmpty, WidgetEventError } from './WidgetEventItem';
import { makeEvent } from '../test/fixtures';
import { updateTrackingData } from '../utils/newEventTrackingStore';
import type { NewEventTrackingData } from '../utils/newEventTracking';

const FIXED_NOW = new Date('2026-01-10T12:00:00+09:00');
const EMPTY_TRACKING_DATA: NewEventTrackingData = { version: 1, records: {}, dismissedUids: [], acknowledgedDotUids: [] };

vi.mock('../utils/nowTicker', () => ({
  subscribeNow: () => () => {},
  getNow: () => FIXED_NOW,
}));

describe('WidgetEventItem', () => {
  beforeEach(() => {
    updateTrackingData(() => EMPTY_TRACKING_DATA);
  });

  it('renders the event title as an external link, address and group name', () => {
    renderWithChakra(
      <WidgetEventItem event={makeEvent({
                          title: '甲府もくもく会 #1',
                          event_url: 'https://example.com/event/1',
                          address: '山梨県甲府市',
                          place: 'テックビル 3F',
                          group_name: 'テストグループ',
                          started_at: '2026-01-15T19:00:00+09:00',
                          ended_at: '2026-01-15T21:00:00+09:00',
                        })}
                        />,
    );

    const link = screen.getByRole('link', { name: '甲府もくもく会 #1' });
    expect(link).toHaveAttribute('href', 'https://example.com/event/1');
    expect(link).toHaveAttribute('target', '_blank');
    expect(screen.getByText('山梨県甲府市 テックビル 3F')).toBeInTheDocument();
    expect(screen.getByText('テストグループ')).toBeInTheDocument();
  });

  it('renders the owner name when there is no group', () => {
    renderWithChakra(
      <WidgetEventItem event={makeEvent({ owner_name: 'オーナー太郎', group_name: null })} />,
    );

    expect(screen.getByText('オーナー太郎')).toBeInTheDocument();
  });

  it('shows an "ongoing" badge when the event is currently happening', () => {
    renderWithChakra(
      <WidgetEventItem event={makeEvent({
                          started_at: '2026-01-10T11:00:00+09:00',
                          ended_at: '2026-01-10T13:00:00+09:00',
                        })}
                        />,
    );

    expect(screen.getByText('開催中')).toBeInTheDocument();
  });

  it('shows a "NEW" badge for a new, not-yet-started event', () => {
    updateTrackingData(() => ({ ...EMPTY_TRACKING_DATA, records: { 'event-1': { firstSeenAt: FIXED_NOW.toISOString() } } }));
    renderWithChakra(
      <WidgetEventItem event={makeEvent({
                          uid: 'event-1',
                          started_at: '2026-01-15T10:00:00+09:00',
                          ended_at: '2026-01-15T12:00:00+09:00',
                          updated_at: '2026-01-09T00:00:00+09:00',
                        })}
                        />,
    );

    expect(screen.getByText('NEW')).toBeInTheDocument();
  });

  it('shows no interactive controls (no buttons or menus)', () => {
    renderWithChakra(<WidgetEventItem event={makeEvent()} />);

    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });
});

describe('WidgetEventEmpty', () => {
  it('shows the empty-state message', () => {
    renderWithChakra(<WidgetEventEmpty />);

    expect(screen.getByText('イベントはありません')).toBeInTheDocument();
  });
});

describe('WidgetEventError', () => {
  it('shows the error message when provided', () => {
    renderWithChakra(<WidgetEventError message={'Network Error'} />);

    expect(screen.getByText('イベント情報の取得に失敗しました')).toBeInTheDocument();
    expect(screen.getByText('Network Error')).toBeInTheDocument();
  });

  it('omits the detail line when no message is provided', () => {
    renderWithChakra(<WidgetEventError message={undefined} />);

    expect(screen.getByText('イベント情報の取得に失敗しました')).toBeInTheDocument();
  });
});
