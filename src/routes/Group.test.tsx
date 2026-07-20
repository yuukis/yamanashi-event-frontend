import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor, within } from '@testing-library/react';
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
      page: 1,
      perPage: 20,
      totalCount: 2,
      totalPages: 1,
    });

    renderGroupPage();

    expect(await screen.findByRole('heading', { name: 'AI BASE', level: 1 })).toBeInTheDocument();
    expect(fetchGroupEvents).toHaveBeenCalledWith('aibase', { perPage: 20, order: 'desc' });
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
    expect(screen.getByRole('link', { name: /イベントに参加する/ })).toHaveAttribute('href', 'https://aibase.connpass.com/');
    expect(screen.getByRole('link', { name: 'RSS' }))
      .toHaveAttribute('href', 'https://feed.event.yamanashi.dev/aibase/feed.xml');
    expect(screen.getByRole('link', { name: 'ブログパーツ' })).toHaveAttribute('href', '#blog-parts');
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

  it('shows a message when the community has no upcoming events', async () => {
    vi.mocked(fetchGroup).mockResolvedValue(makeGroupDetail({ key: 'aibase', title: 'AI BASE' }));
    vi.mocked(fetchGroupEvents).mockResolvedValue({
      events: [], lastModified: null, page: 1, perPage: 20, totalCount: 0, totalPages: 0,
    });

    renderGroupPage();

    expect(await screen.findByText('現在予定されているイベントはありません。')).toBeInTheDocument();
  });

  describe('featured keywords', () => {
    it('shows up to 5 keywords ordered by frequency across the first page of events', async () => {
      vi.mocked(fetchGroup).mockResolvedValue(makeGroupDetail({ key: 'aibase', title: 'AI BASE' }));
      vi.mocked(fetchGroupEvents).mockResolvedValue({
        events: [
          makeEvent({ uid: 'e1', group_key: 'aibase', keywords: ['AI', '初心者歓迎', 'LT会'] }),
          makeEvent({ uid: 'e2', group_key: 'aibase', keywords: ['AI', '初心者歓迎'] }),
          makeEvent({ uid: 'e3', group_key: 'aibase', keywords: ['AI', 'ハンズオン', 'Python', 'もくもく会'] }),
        ],
        lastModified: null, page: 1, perPage: 20, totalCount: 3, totalPages: 1,
      });

      renderGroupPage();

      await screen.findByRole('heading', { name: 'AI BASE', level: 1 });
      const keywordArea = within(screen.getByTestId('group-featured-keywords'));

      // AI(3), 初心者歓迎(2), 残りは頻度1のため出現順で上位5件になる
      expect(keywordArea.getByText('AI')).toBeInTheDocument();
      expect(keywordArea.getByText('初心者歓迎')).toBeInTheDocument();
      expect(keywordArea.getByText('LT会')).toBeInTheDocument();
      expect(keywordArea.getByText('ハンズオン')).toBeInTheDocument();
      expect(keywordArea.getByText('Python')).toBeInTheDocument();
      expect(keywordArea.queryByText('もくもく会')).not.toBeInTheDocument();
    });

    it('shows nothing when the first page of events has no keywords', async () => {
      vi.mocked(fetchGroup).mockResolvedValue(makeGroupDetail({ key: 'aibase', title: 'AI BASE' }));
      vi.mocked(fetchGroupEvents).mockResolvedValue({
        events: [makeEvent({ uid: 'e1', group_key: 'aibase', keywords: [] })],
        lastModified: null, page: 1, perPage: 20, totalCount: 1, totalPages: 1,
      });

      renderGroupPage();

      await screen.findByRole('heading', { name: 'AI BASE', level: 1 });

      expect(screen.queryByTestId('group-stat-events')).toBeInTheDocument();
      expect(screen.queryByTestId('group-featured-keywords')).not.toBeInTheDocument();
    });

    it('keeps the keyword set fixed to the first page after loading more past events', async () => {
      vi.mocked(fetchGroup).mockResolvedValue(makeGroupDetail({ key: 'aibase', title: 'AI BASE' }));
      vi.mocked(fetchGroupEvents).mockImplementation(async (_key, options) => {
        if (options?.page === 2) {
          return {
            events: [makeEvent({ uid: 'old-1', group_key: 'aibase', open_status: 'close', keywords: ['レガシー'] })],
            lastModified: null, page: 2, perPage: 20, totalCount: 21, totalPages: 2,
          };
        }
        return {
          events: Array.from({ length: 20 }).map((_, i) => makeEvent({
            uid: `e${i}`,
            group_key: 'aibase',
            open_status: 'close',
            keywords: ['AI'],
          })),
          lastModified: null, page: 1, perPage: 20, totalCount: 21, totalPages: 2,
        };
      });

      renderGroupPage();
      await screen.findByRole('heading', { name: 'AI BASE', level: 1 });
      const keywordArea = within(screen.getByTestId('group-featured-keywords'));
      expect(keywordArea.getByText('AI')).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: '過去のイベントをもっと見る' }));

      await waitFor(() => {
        expect(screen.queryByRole('button', { name: '過去のイベントをもっと見る' })).not.toBeInTheDocument();
      });
      expect(keywordArea.queryByText('レガシー')).not.toBeInTheDocument();
    });
  });

  it('keeps the fixed header visible when jumping to the blog parts section', async () => {
    vi.mocked(fetchGroup).mockResolvedValue(makeGroupDetail({ key: 'aibase', title: 'AI BASE' }));
    vi.mocked(fetchGroupEvents).mockResolvedValue({
      events: [], lastModified: null, page: 1, perPage: 20, totalCount: 0, totalPages: 0,
    });
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      cb(0);
      return 0;
    });
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

    renderGroupPage();
    await screen.findByRole('heading', { name: 'AI BASE', level: 1 });

    fireEvent.click(screen.getByRole('link', { name: 'ブログパーツ' }));

    expect(window.location.hash).toBe('#blog-parts');
    const dispatchedTypes = dispatchSpy.mock.calls.map(([event]) => (event as Event).type);
    // 素のアンカー遷移でスクロール位置がずれてヘッダーが消えないよう、
    // scrollToCurrentHashと同じくsite-header-showを発火させる
    expect(dispatchedTypes).toContain('site-header-show');
    expect(document.getElementById('blog-parts')?.scrollIntoView).toHaveBeenCalled();
  });

  describe('paginated past events', () => {
    function makePastEvents(count: number, offset: number) {
      return Array.from({ length: count }).map((_, i) => {
        const n = offset + i;
        return makeEvent({
          uid: `past-${n}`,
          title: `AI BASE #${n}`,
          group_key: 'aibase',
          started_at: `2020-01-${String((n % 28) + 1).padStart(2, '0')}T09:00:00+09:00`,
          ended_at: `2020-01-${String((n % 28) + 1).padStart(2, '0')}T10:00:00+09:00`,
          open_status: 'close',
        });
      });
    }

    function mockTwoPageGroup() {
      vi.mocked(fetchGroup).mockResolvedValue(makeGroupDetail({ key: 'aibase', title: 'AI BASE' }));
      vi.mocked(fetchGroupEvents).mockImplementation(async (_key, options) => {
        if (options?.page === 2) {
          return { events: makePastEvents(12, 20), lastModified: null, page: 2, perPage: 20, totalCount: 32, totalPages: 2 };
        }
        return { events: makePastEvents(20, 0), lastModified: null, page: 1, perPage: 20, totalCount: 32, totalPages: 2 };
      });
    }

    it('loads the first page and shows a "load more" button while more pages remain', async () => {
      mockTwoPageGroup();

      renderGroupPage();

      expect(await screen.findByText('AI BASE #0')).toBeInTheDocument();
      expect(screen.getByText('AI BASE #19')).toBeInTheDocument();
      expect(screen.queryByText('AI BASE #20')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: '過去のイベントをもっと見る' })).toBeInTheDocument();
      // 全ページ読み込み前は「活動開始」年が不正確になるため表示しない
      expect(screen.queryByTestId('group-stat-since')).not.toBeInTheDocument();
      expect(screen.getByTestId('group-stat-events')).toHaveTextContent('開催イベント32件');
    });

    it('appends the next page and hides the button once every page is loaded', async () => {
      mockTwoPageGroup();

      renderGroupPage();
      await screen.findByText('AI BASE #0');

      fireEvent.click(screen.getByRole('button', { name: '過去のイベントをもっと見る' }));

      expect(await screen.findByText('AI BASE #31')).toBeInTheDocument();
      expect(screen.getByText('AI BASE #0')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: '過去のイベントをもっと見る' })).not.toBeInTheDocument();
      expect(fetchGroupEvents).toHaveBeenLastCalledWith('aibase', { page: 2, perPage: 20, order: 'desc' });
      expect(screen.getByTestId('group-stat-since')).toHaveTextContent('活動開始2020年');
    });

    it('shows "N件以上" and a load-more button from page fullness alone, when pagination headers are unavailable (CORS)', async () => {
      // x-total-count 等はブラウザからは読めない(APIがAccess-Control-
      // Expose-Headersを設定していないため)。totalCount/totalPagesが
      // 一切取得できない状況でも、取得件数だけで「もっと見る」を
      // 出し分けられることを確認する。
      vi.mocked(fetchGroup).mockResolvedValue(makeGroupDetail({ key: 'aibase', title: 'AI BASE' }));
      vi.mocked(fetchGroupEvents).mockImplementation(async (_key, options) => {
        if (options?.page === 2) {
          return { events: makePastEvents(12, 20), lastModified: null, page: 2, perPage: 20, totalCount: null, totalPages: null };
        }
        return { events: makePastEvents(20, 0), lastModified: null, page: 1, perPage: 20, totalCount: null, totalPages: null };
      });

      renderGroupPage();

      await screen.findByText('AI BASE #0');
      expect(screen.getByTestId('group-stat-events')).toHaveTextContent('開催イベント20件以上');
      expect(screen.getByRole('button', { name: '過去のイベントをもっと見る' })).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: '過去のイベントをもっと見る' }));

      expect(await screen.findByText('AI BASE #31')).toBeInTheDocument();
      expect(screen.getByTestId('group-stat-events')).toHaveTextContent('開催イベント32件');
      expect(screen.queryByRole('button', { name: '過去のイベントをもっと見る' })).not.toBeInTheDocument();
    });

    it('shows an error and keeps the button clickable to retry when loading more fails', async () => {
      vi.mocked(fetchGroup).mockResolvedValue(makeGroupDetail({ key: 'aibase', title: 'AI BASE' }));
      vi.mocked(fetchGroupEvents).mockImplementation(async (_key, options) => {
        if (options?.page === 2) {
          throw new Error('Network Error');
        }
        return { events: makePastEvents(20, 0), lastModified: null, page: 1, perPage: 20, totalCount: 32, totalPages: 2 };
      });

      renderGroupPage();
      await screen.findByText('AI BASE #0');

      fireEvent.click(screen.getByRole('button', { name: '過去のイベントをもっと見る' }));

      expect(await screen.findByText('読み込みに失敗しました(Network Error)')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '過去のイベントをもっと見る' })).toBeEnabled();
      expect(screen.queryByText('AI BASE #20')).not.toBeInTheDocument();
    });
  });
});
