import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithChakra } from '../test/test-utils';
import { NextEventBanner } from './NextEventBanner';
import { makeEvent, makeGroupDetail } from '../test/fixtures';

const FIXED_NOW = new Date('2026-01-10T08:00:00+09:00');

vi.mock('../utils/nowTicker', () => ({
  subscribeNow: () => () => {},
  getNow: () => FIXED_NOW,
}));

describe('NextEventBanner', () => {
  it('shows a skeleton while loading, without any content text', () => {
    renderWithChakra(
      <NextEventBanner isLoading errorMessage={''} group={null} nextEvent={null} />,
    );

    expect(screen.queryByText('次回のイベント予定')).not.toBeInTheDocument();
  });

  it('shows the error state when errorMessage is set', () => {
    renderWithChakra(
      <NextEventBanner isLoading={false} errorMessage={'Network Error'} group={null} nextEvent={null} />,
    );

    expect(screen.getByText('イベント情報の取得に失敗しました')).toBeInTheDocument();
    expect(screen.getByText('Network Error')).toBeInTheDocument();
  });

  it('shows the empty-state message when the community has no upcoming event', () => {
    renderWithChakra(
      <NextEventBanner isLoading={false}
                        errorMessage={''}
                        group={makeGroupDetail({ title: 'テック無尽' })}
                        nextEvent={null}
                        />,
    );

    expect(screen.getByText('次回のイベント予定')).toBeInTheDocument();
    expect(screen.getByText('現在予定されているイベントはありません。')).toBeInTheDocument();
  });

  it('renders the community logo image when the group has one', () => {
    renderWithChakra(
      <NextEventBanner isLoading={false}
                        errorMessage={''}
                        group={makeGroupDetail({ title: 'テック無尽', image_url: 'https://example.com/logo.png' })}
                        nextEvent={null}
                        />,
    );

    expect(screen.getByRole('img', { name: 'テック無尽' })).toHaveAttribute('src', 'https://example.com/logo.png');
  });

  it('shows the event date and a linked title for the next event', () => {
    renderWithChakra(
      <NextEventBanner isLoading={false}
                        errorMessage={''}
                        group={makeGroupDetail({ title: 'テック無尽' })}
                        nextEvent={makeEvent({
                          title: '甲府もくもく会 #1',
                          event_url: 'https://example.com/event/1',
                          started_at: '2026-01-15T19:00:00+09:00',
                          ended_at: '2026-01-15T21:00:00+09:00',
                        })}
                        />,
    );

    expect(screen.getByText('(木) 19:00〜', { exact: false })).toBeInTheDocument();
    const link = screen.getByRole('link', { name: '甲府もくもく会 #1' });
    expect(link).toHaveAttribute('href', 'https://example.com/event/1');
    expect(link).toHaveAttribute('target', '_blank');
    expect(screen.queryByText('本日開催')).not.toBeInTheDocument();
    expect(screen.queryByText('開催中')).not.toBeInTheDocument();
  });

  it('shows a "本日開催" badge for an event later today that has not started yet', () => {
    renderWithChakra(
      <NextEventBanner isLoading={false}
                        errorMessage={''}
                        group={makeGroupDetail()}
                        nextEvent={makeEvent({
                          started_at: '2026-01-10T19:00:00+09:00',
                          ended_at: '2026-01-10T21:00:00+09:00',
                        })}
                        />,
    );

    expect(screen.getByText('本日開催')).toBeInTheDocument();
  });

  it('shows an "開催中" badge while the event is currently happening', () => {
    renderWithChakra(
      <NextEventBanner isLoading={false}
                        errorMessage={''}
                        group={makeGroupDetail()}
                        nextEvent={makeEvent({
                          started_at: '2026-01-10T07:00:00+09:00',
                          ended_at: '2026-01-10T09:00:00+09:00',
                        })}
                        />,
    );

    expect(screen.getByText('開催中')).toBeInTheDocument();
  });
});
