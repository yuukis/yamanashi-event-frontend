import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithChakra } from '../test/test-utils';
import { GroupSelector, type GroupSelectorItem } from './GroupSelector';

const FIXED_NOW = new Date('2026-01-10T12:00:00+09:00');

vi.mock('../utils/nowTicker', () => ({
  subscribeNow: () => () => {},
  getNow: () => FIXED_NOW,
}));

function makeGroup(overrides: Partial<GroupSelectorItem> = {}): GroupSelectorItem {
  return {
    key: 'group-1',
    name: 'Group 1',
    events: [],
    ...overrides,
  };
}

describe('GroupSelector', () => {
  beforeEach(() => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
  });

  it('renders nothing when there are no groups and it is not loading', () => {
    const { container } = renderWithChakra(
      <GroupSelector groups={[]} selected={null} onSelect={() => {}} isLoading={false} />,
    );

    expect(container.querySelector('.group-selector')).toBeNull();
  });

  it('renders skeleton placeholders while loading', () => {
    const { container } = renderWithChakra(
      <GroupSelector groups={[]} selected={null} onSelect={() => {}} isLoading={true} />,
    );

    expect(container.querySelector('.group-selector')).not.toBeNull();
    expect(screen.queryByText('Group 1')).not.toBeInTheDocument();
  });

  it('renders a tooltip-labelled button for each group', () => {
    renderWithChakra(
      <GroupSelector groups={[makeGroup({ key: 'g1', name: 'Group A' }), makeGroup({ key: 'g2', name: 'Group B' })]}
                     selected={null}
                     onSelect={() => {}}
                     isLoading={false}
                     />,
    );

    expect(screen.getByText('Group A')).toBeInTheDocument();
    expect(screen.getByText('Group B')).toBeInTheDocument();
  });

  it('calls onSelect with the group key when an unselected group is clicked', () => {
    const onSelect = vi.fn();
    renderWithChakra(
      <GroupSelector groups={[makeGroup({ key: 'g1', name: 'Group A' })]}
                     selected={null}
                     onSelect={onSelect}
                     isLoading={false}
                     />,
    );

    fireEvent.click(screen.getByText('Group A'));

    expect(onSelect).toHaveBeenCalledWith('g1');
  });

  it('calls onSelect with null when the selected group is clicked again', () => {
    const onSelect = vi.fn();
    renderWithChakra(
      <GroupSelector groups={[makeGroup({ key: 'g1', name: 'Group A' })]}
                     selected={'g1'}
                     onSelect={onSelect}
                     isLoading={false}
                     />,
    );

    fireEvent.click(screen.getByText('Group A'));

    expect(onSelect).toHaveBeenCalledWith(null);
  });

  it('shows an "ongoing" badge for a group with an event currently in progress', () => {
    renderWithChakra(
      <GroupSelector groups={[makeGroup({
                       key: 'g1',
                       name: 'Group A',
                       events: [{ started_at: '2026-01-10T11:00:00+09:00', ended_at: '2026-01-10T13:00:00+09:00' }],
                     })]}
                     selected={null}
                     onSelect={() => {}}
                     isLoading={false}
                     />,
    );

    expect(screen.getByText('開催中')).toBeInTheDocument();
  });

  it('shows a "today" badge for a group with an upcoming event later today', () => {
    renderWithChakra(
      <GroupSelector groups={[makeGroup({
                       key: 'g1',
                       name: 'Group A',
                       events: [{ started_at: '2026-01-10T18:00:00+09:00', ended_at: '2026-01-10T20:00:00+09:00' }],
                     })]}
                     selected={null}
                     onSelect={() => {}}
                     isLoading={false}
                     />,
    );

    expect(screen.getByText('本日開催')).toBeInTheDocument();
  });

  it('shows no badge for a group whose events are in the past or on another day', () => {
    renderWithChakra(
      <GroupSelector groups={[makeGroup({
                       key: 'g1',
                       name: 'Group A',
                       events: [{ started_at: '2026-01-01T10:00:00+09:00', ended_at: '2026-01-01T12:00:00+09:00' }],
                     })]}
                     selected={null}
                     onSelect={() => {}}
                     isLoading={false}
                     />,
    );

    expect(screen.queryByText('開催中')).not.toBeInTheDocument();
    expect(screen.queryByText('本日開催')).not.toBeInTheDocument();
  });
});
