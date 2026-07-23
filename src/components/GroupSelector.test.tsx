import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithChakra } from '../test/test-utils';
import { GroupSelector, type GroupSelectorItem } from './GroupSelector';
import { updateTrackingData } from '../utils/newEventTrackingStore';
import type { NewEventTrackingData } from '../utils/newEventTracking';

const FIXED_NOW = new Date('2026-01-10T12:00:00+09:00');
const EMPTY_TRACKING_DATA: NewEventTrackingData = { version: 1, records: {}, dismissedUids: [], acknowledgedDotUids: [] };

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
    updateTrackingData(() => EMPTY_TRACKING_DATA);
  });

  it('renders nothing when there are no groups and it is not loading', () => {
    const { container } = renderWithChakra(
      <GroupSelector groups={[]} selected={null} onSelect={() => {}} isLoading={false} showBadges={false} />,
    );

    expect(container.querySelector('.group-selector')).toBeNull();
  });

  it('renders skeleton placeholders while loading', () => {
    const { container } = renderWithChakra(
      <GroupSelector groups={[]} selected={null} onSelect={() => {}} isLoading={true} showBadges={false} />,
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
                     showBadges={false}
                     />,
    );

    expect(screen.getByText('Group A')).toBeInTheDocument();
    expect(screen.getByText('Group B')).toBeInTheDocument();
  });

  it('keeps the given order as-is when showBadges is false, even for a group that would otherwise get a badge', () => {
    const ongoingEvent = { uid: 'e1', started_at: '2026-01-10T11:00:00+09:00', ended_at: '2026-01-10T13:00:00+09:00', updated_at: '2026-01-01T00:00:00+09:00' };
    renderWithChakra(
      <GroupSelector groups={[
                       makeGroup({ key: 'g1', name: 'No Badge Group' }),
                       makeGroup({ key: 'g2', name: 'Ongoing Badge Group', events: [ongoingEvent] }),
                     ]}
                     selected={null}
                     onSelect={() => {}}
                     isLoading={false}
                     showBadges={false}
                     />,
    );

    const buttonTexts = screen.getAllByRole('button').map((button) => button.textContent ?? '');
    expect(buttonTexts.findIndex((text) => text.includes('No Badge Group')))
      .toBeLessThan(buttonTexts.findIndex((text) => text.includes('Ongoing Badge Group')));
    expect(screen.queryByText('開催中')).not.toBeInTheDocument();
  });

  it('moves badged groups to the front when showBadges is true, keeping each side\'s relative order', () => {
    const ongoingEvent = { uid: 'e1', started_at: '2026-01-10T11:00:00+09:00', ended_at: '2026-01-10T13:00:00+09:00', updated_at: '2026-01-01T00:00:00+09:00' };
    renderWithChakra(
      <GroupSelector groups={[
                       makeGroup({ key: 'g1', name: 'No Badge Group' }),
                       makeGroup({ key: 'g2', name: 'Ongoing Badge Group', events: [ongoingEvent] }),
                     ]}
                     selected={null}
                     onSelect={() => {}}
                     isLoading={false}
                     showBadges={true}
                     />,
    );

    const buttonTexts = screen.getAllByRole('button').map((button) => button.textContent ?? '');
    expect(buttonTexts.findIndex((text) => text.includes('Ongoing Badge Group')))
      .toBeLessThan(buttonTexts.findIndex((text) => text.includes('No Badge Group')));
  });

  it('calls onSelect with the group key when an unselected group is clicked', () => {
    const onSelect = vi.fn();
    renderWithChakra(
      <GroupSelector groups={[makeGroup({ key: 'g1', name: 'Group A' })]}
                     selected={null}
                     onSelect={onSelect}
                     isLoading={false}
                     showBadges={false}
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
                     showBadges={false}
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
                       events: [{ uid: 'e1', started_at: '2026-01-10T11:00:00+09:00', ended_at: '2026-01-10T13:00:00+09:00', updated_at: '2026-01-01T00:00:00+09:00' }],
                     })]}
                     selected={null}
                     onSelect={() => {}}
                     isLoading={false}
                     showBadges={true}
                     />,
    );

    expect(screen.getByText('開催中')).toBeInTheDocument();
  });

  it('shows a "today" badge for a group with an upcoming event later today', () => {
    renderWithChakra(
      <GroupSelector groups={[makeGroup({
                       key: 'g1',
                       name: 'Group A',
                       events: [{ uid: 'e1', started_at: '2026-01-10T18:00:00+09:00', ended_at: '2026-01-10T20:00:00+09:00', updated_at: '2026-01-01T00:00:00+09:00' }],
                     })]}
                     selected={null}
                     onSelect={() => {}}
                     isLoading={false}
                     showBadges={true}
                     />,
    );

    expect(screen.getByText('本日開催')).toBeInTheDocument();
  });

  it('shows no badge for a group whose events are in the past or on another day', () => {
    renderWithChakra(
      <GroupSelector groups={[makeGroup({
                       key: 'g1',
                       name: 'Group A',
                       events: [{ uid: 'e1', started_at: '2026-01-01T10:00:00+09:00', ended_at: '2026-01-01T12:00:00+09:00', updated_at: '2026-01-01T00:00:00+09:00' }],
                     })]}
                     selected={null}
                     onSelect={() => {}}
                     isLoading={false}
                     showBadges={true}
                     />,
    );

    expect(screen.queryByText('開催中')).not.toBeInTheDocument();
    expect(screen.queryByText('本日開催')).not.toBeInTheDocument();
  });

  it('shows a "新着あり" badge for a group with a new not-yet-started event', () => {
    updateTrackingData(() => ({
      ...EMPTY_TRACKING_DATA,
      records: { e1: { firstSeenAt: FIXED_NOW.toISOString() } },
    }));

    renderWithChakra(
      <GroupSelector groups={[makeGroup({
                       key: 'g1',
                       name: 'Group A',
                       events: [{ uid: 'e1', started_at: '2026-01-15T10:00:00+09:00', ended_at: '2026-01-15T12:00:00+09:00', updated_at: '2026-01-10T00:00:00+09:00' }],
                     })]}
                     selected={null}
                     onSelect={() => {}}
                     isLoading={false}
                     showBadges={true}
                     />,
    );

    expect(screen.getByText('新着あり')).toBeInTheDocument();
  });

  it('does not show any badge when showBadges is false, even for a group with an ongoing event', () => {
    renderWithChakra(
      <GroupSelector groups={[makeGroup({
                       key: 'g1',
                       name: 'Group A',
                       events: [{ uid: 'e1', started_at: '2026-01-10T11:00:00+09:00', ended_at: '2026-01-10T13:00:00+09:00', updated_at: '2026-01-01T00:00:00+09:00' }],
                     })]}
                     selected={null}
                     onSelect={() => {}}
                     isLoading={false}
                     showBadges={false}
                     />,
    );

    expect(screen.queryByText('開催中')).not.toBeInTheDocument();
  });

  it('prioritizes "ongoing" over "新着あり" when a group has both', () => {
    updateTrackingData(() => ({
      ...EMPTY_TRACKING_DATA,
      records: { e2: { firstSeenAt: FIXED_NOW.toISOString() } },
    }));

    renderWithChakra(
      <GroupSelector groups={[makeGroup({
                       key: 'g1',
                       name: 'Group A',
                       events: [
                         { uid: 'e1', started_at: '2026-01-10T11:00:00+09:00', ended_at: '2026-01-10T13:00:00+09:00', updated_at: '2026-01-01T00:00:00+09:00' },
                         { uid: 'e2', started_at: '2026-01-15T10:00:00+09:00', ended_at: '2026-01-15T12:00:00+09:00', updated_at: '2026-01-10T00:00:00+09:00' },
                       ],
                     })]}
                     selected={null}
                     onSelect={() => {}}
                     isLoading={false}
                     showBadges={true}
                     />,
    );

    expect(screen.getByText('開催中')).toBeInTheDocument();
    expect(screen.queryByText('新着あり')).not.toBeInTheDocument();
  });
});
