import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithChakra } from '../test/test-utils';
import { EventFilterTabs } from './EventFilterTabs';
import type { GroupSelectorItem } from './GroupSelector';

const GROUPS: GroupSelectorItem[] = [
  { key: 'aibase', name: 'AI BASE', events: [] },
];

function renderTabs(overrides: Partial<Parameters<typeof EventFilterTabs>[0]> = {}) {
  return renderWithChakra(
    <EventFilterTabs selectedGroup={null}
                      selectedKeyword={null}
                      selectedArea={null}
                      onGroupSelect={() => {}}
                      onKeywordSelect={() => {}}
                      onAreaSelect={() => {}}
                      groupSelectorItems={GROUPS}
                      keywordCounts={[['React', 3]]}
                      areaCounts={[['kofu', 2], ['online', 0]]}
                      isLoading={false}
                      errorMessage={''}
                      showGroupBadges={false}
                      {...overrides}
                      />,
  );
}

describe('EventFilterTabs', () => {
  it('renders the three filter tab labels', () => {
    renderTabs();

    expect(screen.getByRole('tab', { name: /コミュニティで絞る/ })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /キーワードで絞る/ })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /エリアで絞る/ })).toBeInTheDocument();
  });

  it('defaults to the community tab, showing the given groups', () => {
    renderTabs();

    expect(screen.getByText('AI BASE')).toBeInTheDocument();
  });

  it('defaults to the keyword tab when a keyword is selected', () => {
    renderTabs({ selectedKeyword: 'React' });

    expect(screen.getByRole('tab', { name: /キーワードで絞る/ })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('button', { name: 'React' })).toBeInTheDocument();
  });

  it('defaults to the area tab when an area is selected, with counts in the label', () => {
    renderTabs({ selectedArea: 'kofu' });

    expect(screen.getByRole('tab', { name: /エリアで絞る/ })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('button', { name: '甲府・峡中・峡東 (2)' })).toBeInTheDocument();
  });

  it('disables an area chip with zero count unless it is the selected one', () => {
    renderTabs({ selectedArea: 'kofu' });

    expect(screen.getByRole('button', { name: 'オンライン (0)' })).toBeDisabled();
  });

  it('calls onKeywordSelect when a keyword chip is clicked', () => {
    const onKeywordSelect = vi.fn();
    renderTabs({ selectedKeyword: 'React', onKeywordSelect });

    fireEvent.click(screen.getByRole('button', { name: 'React' }));

    expect(onKeywordSelect).toHaveBeenCalledWith(null);
  });

  it('does not render chips while loading', () => {
    renderTabs({ selectedKeyword: 'React', isLoading: true });

    expect(screen.queryByRole('button', { name: 'React' })).toBeNull();
  });
});
