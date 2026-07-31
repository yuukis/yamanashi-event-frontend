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
  it('shows a skeleton while loading, without any links or the empty-state message', () => {
    renderWithChakra(
      <NextEventBanner isLoading errorMessage={''} group={null} nextEvent={null} />,
    );

    expect(screen.queryAllByRole('link')).toHaveLength(0);
    expect(screen.queryByText('現在予定されているイベントはありません。')).not.toBeInTheDocument();
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

    expect(screen.getByText('現在予定されているイベントはありません。')).toBeInTheDocument();
    expect(screen.queryAllByRole('link')).toHaveLength(0);
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

  it('shows the event date and title, with the whole banner as a single link to the event', () => {
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

    expect(screen.getByText('(木) 19:00-', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('甲府もくもく会 #1')).toBeInTheDocument();
    const links = screen.getAllByRole('link', { name: '甲府もくもく会 #1' });
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAttribute('href', 'https://example.com/event/1');
    expect(links[0]).toHaveAttribute('target', '_blank');
    expect(screen.queryByText('本日開催')).not.toBeInTheDocument();
    expect(screen.queryByText('開催中')).not.toBeInTheDocument();
  });

  it('shows the year as a bare number (no 年 suffix) when the event is in a different year', () => {
    renderWithChakra(
      <NextEventBanner isLoading={false}
                        errorMessage={''}
                        group={makeGroupDetail({ title: 'テック無尽' })}
                        nextEvent={makeEvent({
                          title: '甲府もくもく会 #2',
                          started_at: '2027-03-05T19:00:00+09:00',
                          ended_at: '2027-03-05T21:00:00+09:00',
                        })}
                        />,
    );

    expect(screen.getByText('2027')).toBeInTheDocument();
    expect(screen.queryByText('2027年')).not.toBeInTheDocument();
  });

  it('omits the year when the event is in the current year', () => {
    renderWithChakra(
      <NextEventBanner isLoading={false}
                        errorMessage={''}
                        group={makeGroupDetail({ title: 'テック無尽' })}
                        nextEvent={makeEvent({
                          title: '甲府もくもく会 #1',
                          started_at: '2026-01-15T19:00:00+09:00',
                          ended_at: '2026-01-15T21:00:00+09:00',
                        })}
                        />,
    );

    expect(screen.queryByText('2026')).not.toBeInTheDocument();
  });

  it('falls back to the decorative background pattern when the event has no image', () => {
    const { container } = renderWithChakra(
      <NextEventBanner isLoading={false}
                        errorMessage={''}
                        group={makeGroupDetail()}
                        nextEvent={makeEvent({ image_url: null })}
                        />,
    );

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(container.querySelector('.scroll-row-bg-pattern')).toBeInTheDocument();
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
