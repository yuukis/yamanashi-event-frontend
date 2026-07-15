import { describe, it, expect } from 'vitest';
import { collectActiveGroupKeys, splitGroupsByActivity } from './groupActivity';
import { makeGroup } from '../test/fixtures';

describe('collectActiveGroupKeys', () => {
  it('collects the distinct group_key values from the given events', () => {
    const keys = collectActiveGroupKeys([
      { group_key: 'techmujin' },
      { group_key: 'aibase' },
      { group_key: 'techmujin' },
    ]);

    expect(keys).toEqual(new Set(['techmujin', 'aibase']));
  });

  it('ignores events with no group_key', () => {
    const keys = collectActiveGroupKeys([
      { group_key: null },
      { group_key: undefined },
      { group_key: 'aibase' },
    ]);

    expect(keys).toEqual(new Set(['aibase']));
  });

  it('returns an empty set for no events', () => {
    expect(collectActiveGroupKeys([])).toEqual(new Set());
  });
});

describe('splitGroupsByActivity', () => {
  it('lists groups with an active key before groups without one', () => {
    const groups = [
      makeGroup({ key: 'inactive-b', title: 'ぶよぶよ勉強会' }),
      makeGroup({ key: 'active-a', title: 'あいうえお会' }),
      makeGroup({ key: 'inactive-a', title: 'あかさたな会' }),
      makeGroup({ key: 'active-b', title: 'かきくけこ会' }),
    ];
    const activeGroupKeys = new Set(['active-a', 'active-b']);

    const { activeGroups, inactiveGroups } = splitGroupsByActivity(groups, activeGroupKeys);

    expect(activeGroups.map((g) => g.key)).toEqual(['active-a', 'active-b']);
    expect(inactiveGroups.map((g) => g.key)).toEqual(['inactive-a', 'inactive-b']);
  });

  it('sorts each bucket by title', () => {
    const groups = [
      makeGroup({ key: 'b', title: 'びーぐるーぷ' }),
      makeGroup({ key: 'a', title: 'あーぐるーぷ' }),
    ];

    const { activeGroups } = splitGroupsByActivity(groups, new Set(['a', 'b']));

    expect(activeGroups.map((g) => g.key)).toEqual(['a', 'b']);
  });

  it('returns an empty inactive list when every group is active', () => {
    const groups = [makeGroup({ key: 'a' })];

    const { activeGroups, inactiveGroups } = splitGroupsByActivity(groups, new Set(['a']));

    expect(activeGroups).toHaveLength(1);
    expect(inactiveGroups).toHaveLength(0);
  });
});
