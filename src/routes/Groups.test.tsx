import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { renderWithChakra, mockMatchMedia } from '../test/test-utils';
import Groups from './Groups';
import { makeGroup, makeEvent } from '../test/fixtures';
import { fetchGroups, fetchEvents } from '../utils/api';

vi.mock('../utils/api', () => ({
  fetchGroups: vi.fn(),
  fetchEvents: vi.fn(),
  GROUPS_SUMMARY_FIELDS: 'key,title,sub_title,image_url,member_users_count,archive_source,archive_url',
}));

vi.mock('../components/Site', () => ({
  SiteHeader: () => null,
  SiteFooter: () => null,
  FooterLastModified: () => null,
  useFixedHeaderBoundary: () => ({ current: null }),
}));

function renderGroupsPage() {
  return renderWithChakra(
    <MemoryRouter initialEntries={['/groups']}>
      <Routes>
        <Route path={'/groups'} element={<Groups />} />
      </Routes>
    </MemoryRouter>,
  );
}

const AIBASE = makeGroup({ key: 'aibase', title: 'AI BASE', sub_title: '山梨の生成AIコミュニティ', member_users_count: 44 });
const KOFURB = makeGroup({ key: 'kofurb', title: 'Kofu.rb', sub_title: '甲府のRubyコミュニティ' });

describe('Groups', () => {
  beforeEach(() => {
    mockMatchMedia(true);
    vi.mocked(fetchGroups).mockReset();
    vi.mocked(fetchEvents).mockReset();
  });

  it('splits communities into an active section (has events in the main feed) and an other section', async () => {
    vi.mocked(fetchGroups).mockResolvedValue([AIBASE, KOFURB]);
    vi.mocked(fetchEvents).mockResolvedValue({
      events: [makeEvent({ group_key: 'aibase' })],
      lastModified: null,
    });

    renderGroupsPage();

    expect(await screen.findByRole('heading', { name: 'イベント情報のあるコミュニティ' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'その他のコミュニティ' })).toBeInTheDocument();

    const aibaseLink = screen.getByRole('link', { name: /AI BASE/ });
    expect(aibaseLink).toHaveAttribute('href', '/groups/aibase');
    expect(screen.getByText('山梨の生成AIコミュニティ')).toBeInTheDocument();
    expect(screen.getByText('メンバー44人')).toBeInTheDocument();

    const kofurbLink = screen.getByRole('link', { name: /Kofu\.rb/ });
    expect(kofurbLink).toHaveAttribute('href', '/groups/kofurb');

    expect(document.title).toBe('コミュニティ一覧 - Yamanashi Developer Hub');
  });

  it('orders the structured data to match the displayed active-then-other order, unaffected by the search query', async () => {
    // 五十音順ではAI BASEより先に来るKofu.rbを後ろにして、
    // 「アクティブ→その他」の分類順が反映されているかを確認する。
    vi.mocked(fetchGroups).mockResolvedValue([KOFURB, AIBASE]);
    vi.mocked(fetchEvents).mockResolvedValue({
      events: [makeEvent({ group_key: 'aibase' })],
      lastModified: null,
    });

    renderGroupsPage();
    await screen.findByText('AI BASE');

    fireEvent.change(screen.getByLabelText('コミュニティ名で検索'), { target: { value: 'AI BASE' } });
    expect(screen.queryByText('Kofu.rb')).not.toBeInTheDocument();

    const script = document.getElementById('structured-data-groups');
    const jsonLd = JSON.parse(script!.textContent!);
    expect(jsonLd.itemListElement.map((item: any) => item.item.name)).toEqual(['AI BASE', 'Kofu.rb']);
  });

  it('filters the visible communities as the user types a search query', async () => {
    vi.mocked(fetchGroups).mockResolvedValue([AIBASE, KOFURB]);
    vi.mocked(fetchEvents).mockResolvedValue({ events: [], lastModified: null });

    renderGroupsPage();

    await screen.findByText('AI BASE');
    expect(screen.getByText('Kofu.rb')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('コミュニティ名で検索'), { target: { value: 'Ruby' } });

    expect(screen.queryByText('AI BASE')).not.toBeInTheDocument();
    expect(screen.getByText('Kofu.rb')).toBeInTheDocument();
  });

  it('shows an empty-state message when no community matches the search query', async () => {
    vi.mocked(fetchGroups).mockResolvedValue([AIBASE]);
    vi.mocked(fetchEvents).mockResolvedValue({ events: [], lastModified: null });

    renderGroupsPage();
    await screen.findByText('AI BASE');

    fireEvent.change(screen.getByLabelText('コミュニティ名で検索'), { target: { value: '存在しない名前' } });

    expect(await screen.findByText('該当するコミュニティが見つかりませんでした。')).toBeInTheDocument();
  });

  it('shows an error message when the initial fetch fails', async () => {
    vi.mocked(fetchGroups).mockRejectedValue(new Error('network error'));
    vi.mocked(fetchEvents).mockRejectedValue(new Error('network error'));

    renderGroupsPage();

    expect(await screen.findByText(/network error/)).toBeInTheDocument();
  });
});
