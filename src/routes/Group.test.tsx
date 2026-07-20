import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { renderWithChakra, mockMatchMedia } from '../test/test-utils';
import Group from './Group';
import { makeEvent, makeGroupDetail } from '../test/fixtures';
import { fetchGroup, fetchGroupEvents } from '../utils/api';

const FIXED_NOW = new Date('2026-01-10T12:00:00+09:00');

vi.mock('../utils/nowTicker', () => ({
  subscribeNow: () => () => {},
  getNow: () => FIXED_NOW,
}));

vi.mock('../utils/api', () => ({
  fetchGroup: vi.fn(),
  fetchGroupEvents: vi.fn(),
}));

vi.mock('../components/Site', () => ({
  SiteHeader: () => null,
  SiteFooter: () => null,
  FooterLastModified: () => null,
  useFixedHeaderBoundary: () => ({ current: null }),
}));

function renderGroupPage(groupKey = 'aibase') {
  return renderWithChakra(
    <MemoryRouter initialEntries={[`/groups/${groupKey}`]}>
      <Routes>
        <Route path={'/groups/:groupKey'} element={<Group />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('Group', () => {
  beforeEach(() => {
    mockMatchMedia(true);
    vi.mocked(fetchGroup).mockReset();
    vi.mocked(fetchGroupEvents).mockReset();
  });

  it('renders the community profile with description, stats and external links', async () => {
    vi.mocked(fetchGroup).mockResolvedValue(makeGroupDetail({
      key: 'aibase',
      title: 'AI BASE',
      sub_title: '山梨の生成AIコミュニティ',
      url: 'https://aibase.connpass.com/',
      description: '<h2>紹介</h2><p><strong>『AI BASE』</strong>は生成AIに興味がある山梨のコミュニティです。<a href="https://discord.gg/example">Discord</a></p>',
      member_users_count: 44,
    }));
    vi.mocked(fetchGroupEvents).mockResolvedValue({
      events: [
        makeEvent({ uid: 'future-1', title: 'AI BASE #10', group_key: 'aibase', started_at: '2026-02-01T09:00:00+09:00', ended_at: '2026-02-01T10:00:00+09:00', open_status: 'open' }),
        makeEvent({ uid: 'past-1', title: 'AI BASE #9', group_key: 'aibase', started_at: '2025-12-07T09:00:00+09:00', ended_at: '2025-12-07T10:00:00+09:00', open_status: 'close' }),
      ],
      lastModified: null,
    });

    renderGroupPage();

    expect(await screen.findByRole('heading', { name: 'AI BASE', level: 1 })).toBeInTheDocument();
    expect(screen.getByText('山梨の生成AIコミュニティ')).toBeInTheDocument();
    const description = screen.getByTestId('group-description');
    expect(description).toHaveTextContent('『AI BASE』は生成AIに興味がある山梨のコミュニティです。');
    expect(screen.getByText('『AI BASE』').tagName).toBe('STRONG');
    expect(description.querySelector('h1, h2, h3, h4, h5, h6')).toBeNull();
    expect(description.querySelector('p.desc-h2')).toHaveTextContent('紹介');
    const descriptionLink = description.querySelector('a');
    expect(descriptionLink).toHaveAttribute('href', 'https://discord.gg/example');
    expect(descriptionLink).toHaveAttribute('target', '_blank');
    expect(screen.getByTestId('group-stat-events')).toHaveTextContent('開催イベント2件');
    expect(screen.getByTestId('group-stat-since')).toHaveTextContent('活動開始2025年');
    expect(screen.getByTestId('group-stat-members')).toHaveTextContent('メンバー44人');
    expect(screen.getByRole('link', { name: /イベントページ/ })).toHaveAttribute('href', 'https://aibase.connpass.com/');
    expect(screen.getByRole('link', { name: /新着イベントをRSSで購読/ }))
      .toHaveAttribute('href', 'https://feed.event.yamanashi.dev/aibase/feed.xml');
    const feedLink = document.head.querySelector('link[rel="alternate"][type="application/rss+xml"]');
    expect(feedLink).toHaveAttribute('href', 'https://feed.event.yamanashi.dev/aibase/feed.xml');
    expect(feedLink).toHaveAttribute('title', 'AI BASE - 新着・更新イベント');
    expect(screen.getByRole('heading', { name: '今後の開催予定' })).toBeInTheDocument();
    expect(screen.getByText('AI BASE #10')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '過去のイベント' })).toBeInTheDocument();
    expect(screen.getByText('AI BASE #9')).toBeInTheDocument();
    expect(document.title).toBe('AI BASE - 山梨のITコミュニティ | Yamanashi Developer Hub');
  });

  it('shows a not-found message when the group does not exist', async () => {
    const notFoundError = Object.assign(new Error('Request failed with status code 404'), {
      response: { status: 404 },
    });
    vi.mocked(fetchGroup).mockRejectedValue(notFoundError);
    vi.mocked(fetchGroupEvents).mockRejectedValue(notFoundError);

    renderGroupPage('missing');

    expect(await screen.findByText('コミュニティが見つかりませんでした')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'トップページでイベントを見る' })).toHaveAttribute('href', '/');
  });

  it('collapses long past event lists behind an expand button', async () => {
    vi.mocked(fetchGroup).mockResolvedValue(makeGroupDetail({ key: 'aibase', title: 'AI BASE' }));
    vi.mocked(fetchGroupEvents).mockResolvedValue({
      events: Array.from({ length: 12 }).map((_, i) => makeEvent({
        uid: `past-${i}`,
        title: `AI BASE #${i}`,
        group_key: 'aibase',
        started_at: '2025-12-07T09:00:00+09:00',
        ended_at: '2025-12-07T10:00:00+09:00',
        open_status: 'close',
      })),
      lastModified: null,
    });

    renderGroupPage();

    const expandButton = await screen.findByRole('button', { name: '過去のイベントをすべて表示(12件)' });
    expect(screen.queryByText('AI BASE #11')).not.toBeInTheDocument();

    fireEvent.click(expandButton);

    expect(screen.getByText('AI BASE #11')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /過去のイベントをすべて表示/ })).not.toBeInTheDocument();
  });

  it('shows a message when the community has no upcoming events', async () => {
    vi.mocked(fetchGroup).mockResolvedValue(makeGroupDetail({ key: 'aibase', title: 'AI BASE' }));
    vi.mocked(fetchGroupEvents).mockResolvedValue({ events: [], lastModified: null });

    renderGroupPage();

    expect(await screen.findByText('現在予定されているイベントはありません。')).toBeInTheDocument();
  });
});
