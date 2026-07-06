import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithChakra, mockMatchMedia } from '../test/test-utils';
import { EventBody, EmptyEventBody, ErrorEventBody } from './EventBody';
import { makeEvent } from '../test/fixtures';

const FIXED_NOW = new Date('2026-01-10T12:00:00+09:00');

vi.mock('../utils/nowTicker', () => ({
  subscribeNow: () => () => {},
  getNow: () => FIXED_NOW,
}));

describe('EventBody', () => {
  it('renders the event title, address and place', () => {
    mockMatchMedia(true); // desktop layout renders the title as a link
    renderWithChakra(
      <EventBody event={makeEvent({
                   title: '甲府もくもく会 #1',
                   address: '山梨県甲府市',
                   place: 'テックビル 3F',
                   started_at: '2026-01-05T19:00:00+09:00',
                   ended_at: '2026-01-05T21:00:00+09:00',
                 })}
                 />,
    );

    expect(screen.getByText('甲府もくもく会 #1')).toBeInTheDocument();
    expect(screen.getByText('山梨県甲府市')).toBeInTheDocument();
    expect(screen.getByText('テックビル 3F')).toBeInTheDocument();
  });

  it('shows an "ongoing" badge when the event is currently happening', () => {
    mockMatchMedia(true);
    renderWithChakra(
      <EventBody event={makeEvent({
                   started_at: '2026-01-10T11:00:00+09:00',
                   ended_at: '2026-01-10T13:00:00+09:00',
                 })}
                 />,
    );

    expect(screen.getByText('開催中')).toBeInTheDocument();
  });

  it('shows a "today" badge when the event starts later today', () => {
    mockMatchMedia(true);
    renderWithChakra(
      <EventBody event={makeEvent({
                   started_at: '2026-01-10T18:00:00+09:00',
                   ended_at: '2026-01-10T20:00:00+09:00',
                 })}
                 />,
    );

    expect(screen.getByText('本日開催')).toBeInTheDocument();
  });

  it('shows no badge for a past event', () => {
    mockMatchMedia(true);
    renderWithChakra(
      <EventBody event={makeEvent({
                   started_at: '2026-01-01T18:00:00+09:00',
                   ended_at: '2026-01-01T20:00:00+09:00',
                 })}
                 />,
    );

    expect(screen.queryByText('開催中')).not.toBeInTheDocument();
    expect(screen.queryByText('本日開催')).not.toBeInTheDocument();
  });

  it('renders the group name instead of the owner name when a group is present', () => {
    mockMatchMedia(true);
    renderWithChakra(
      <EventBody event={makeEvent({ owner_name: 'オーナー太郎', group_name: 'テストグループ' })} />,
    );

    expect(screen.getByText('テストグループ')).toBeInTheDocument();
    expect(screen.queryByText('オーナー太郎')).not.toBeInTheDocument();
  });

  it('renders the owner name when there is no group', () => {
    mockMatchMedia(true);
    renderWithChakra(
      <EventBody event={makeEvent({ owner_name: 'オーナー太郎', group_name: null })} />,
    );

    expect(screen.getByText('オーナー太郎')).toBeInTheDocument();
  });

  it('shows an archive badge when the event has an archive source', () => {
    mockMatchMedia(true);
    renderWithChakra(
      <EventBody event={makeEvent({ archive_source: 'connpass' })} />,
    );

    expect(screen.getByText('アーカイブ')).toBeInTheDocument();
  });

  it('calls onKeywordClick when a keyword tag is clicked on desktop', () => {
    mockMatchMedia(true);
    const onKeywordClick = vi.fn();
    renderWithChakra(
      <EventBody event={makeEvent({ keywords: ['React', 'TypeScript'] })}
                 selectedKeyword={null}
                 onKeywordClick={onKeywordClick}
                 />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'React' }));

    expect(onKeywordClick).toHaveBeenCalledWith('React');
  });

  it('does not make keyword tags clickable on mobile layout', () => {
    mockMatchMedia(false);
    const onKeywordClick = vi.fn();
    renderWithChakra(
      <EventBody event={makeEvent({ keywords: ['React'] })}
                 selectedKeyword={null}
                 onKeywordClick={onKeywordClick}
                 />,
    );

    expect(screen.queryByRole('button', { name: 'React' })).not.toBeInTheDocument();
    expect(screen.getByText('React')).toBeInTheDocument();
  });
});

describe('EmptyEventBody', () => {
  it('shows the empty-state message', () => {
    renderWithChakra(<EmptyEventBody />);

    expect(screen.getByText('イベントはありません')).toBeInTheDocument();
  });
});

describe('ErrorEventBody', () => {
  it('shows the error message when provided', () => {
    renderWithChakra(<ErrorEventBody message={'Network Error'} />);

    expect(screen.getByText('イベント情報の取得に失敗しました')).toBeInTheDocument();
    expect(screen.getByText('Network Error')).toBeInTheDocument();
  });

  it('omits the detail line when no message is provided', () => {
    renderWithChakra(<ErrorEventBody message={undefined} />);

    expect(screen.getByText('イベント情報の取得に失敗しました')).toBeInTheDocument();
  });
});
