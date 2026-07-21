import { describe, it, expect } from 'vitest';
import {
  enrichEventsWithGroups,
  isVisibleEvent,
  isPastEvent,
  isFutureEvent,
  isArchiveEvent,
  countGroups,
  filterEventsByGroup,
} from './eventGroups';
import { makeEvent, makeGroup } from '../test/fixtures';

describe('enrichEventsWithGroups', () => {
  it('merges group image/archive info onto events with a matching group_key', () => {
    const group = makeGroup({
      key: 'g1',
      image_url: 'https://example.com/g1.png',
      archive_source: 'connpass',
      archive_url: 'https://example.com/archive',
    });
    const event = makeEvent({ group_key: 'g1' });

    const [result] = enrichEventsWithGroups([event], [group]);

    expect(result.group_image_url).toBe('https://example.com/g1.png');
    expect(result.archive_source).toBe('connpass');
    expect(result.archive_url).toBe('https://example.com/archive');
    expect(result.is_registered_group).toBe(true);
  });

  it('marks the event as an unregistered group when there is no group_key', () => {
    const event = makeEvent({ group_key: null });

    const [result] = enrichEventsWithGroups([event], [makeGroup()]);

    expect(result).toEqual({ ...event, is_registered_group: false });
  });

  it('marks the event as an unregistered group when group_key does not match any group', () => {
    const event = makeEvent({ group_key: 'missing' });

    const [result] = enrichEventsWithGroups([event], [makeGroup({ key: 'g1' })]);

    expect(result).toEqual({ ...event, is_registered_group: false });
  });
});

describe('isVisibleEvent / isPastEvent / isFutureEvent', () => {
  it('treats cancelled events as not visible and not future', () => {
    const event = makeEvent({ open_status: 'cancelled' });

    expect(isVisibleEvent(event)).toBe(false);
    expect(isFutureEvent(event)).toBe(false);
  });

  it('treats close events as past and not future', () => {
    const event = makeEvent({ open_status: 'close' });

    expect(isVisibleEvent(event)).toBe(true);
    expect(isPastEvent(event)).toBe(true);
    expect(isFutureEvent(event)).toBe(false);
  });

  it('treats other statuses as future and visible', () => {
    const event = makeEvent({ open_status: 'open' });

    expect(isVisibleEvent(event)).toBe(true);
    expect(isPastEvent(event)).toBe(false);
    expect(isFutureEvent(event)).toBe(true);
  });
});

describe('isArchiveEvent', () => {
  it('treats an event with source "archive" as archived', () => {
    expect(isArchiveEvent(makeEvent({ source: 'archive' }))).toBe(true);
  });

  it('treats connpass/icalendar-sourced events as not archived', () => {
    expect(isArchiveEvent(makeEvent({ source: 'connpass' }))).toBe(false);
    expect(isArchiveEvent(makeEvent({ source: 'icalendar' }))).toBe(false);
  });

  it('treats an event without a source as not archived (backward compatibility)', () => {
    expect(isArchiveEvent(makeEvent())).toBe(false);
  });
});

describe('countGroups', () => {
  it('counts events per group and collects their dates', () => {
    const groups = [makeGroup({ key: 'g1', title: 'Group 1' })];
    const events = [
      makeEvent({ uid: 'a', group_key: 'g1', group_name: 'Group 1', started_at: '2026-01-01T00:00:00+09:00', ended_at: '2026-01-01T01:00:00+09:00', updated_at: '2025-12-31T00:00:00+09:00' }),
      makeEvent({ uid: 'b', group_key: 'g1', group_name: 'Group 1', started_at: '2026-02-01T00:00:00+09:00', ended_at: '2026-02-01T01:00:00+09:00', updated_at: '2026-01-31T00:00:00+09:00' }),
    ];

    const result = countGroups(events, groups);

    expect(result).toEqual([
      {
        key: 'g1',
        name: 'Group 1',
        imageUrl: undefined,
        count: 2,
        events: [
          { uid: 'a', started_at: '2026-01-01T00:00:00+09:00', ended_at: '2026-01-01T01:00:00+09:00', updated_at: '2025-12-31T00:00:00+09:00' },
          { uid: 'b', started_at: '2026-02-01T00:00:00+09:00', ended_at: '2026-02-01T01:00:00+09:00', updated_at: '2026-01-31T00:00:00+09:00' },
        ],
      },
    ]);
  });

  it('falls back to the group title when group_name is missing', () => {
    const groups = [makeGroup({ key: 'g1', title: 'Fallback Title' })];
    const events = [makeEvent({ group_key: 'g1', group_name: null })];

    const result = countGroups(events, groups);

    expect(result[0].name).toBe('Fallback Title');
  });

  it('skips events without a resolvable group name', () => {
    const events = [makeEvent({ group_key: 'unknown', group_name: null })];

    expect(countGroups(events, [])).toEqual([]);
  });

  it('sorts groups by descending event count', () => {
    const groups = [
      makeGroup({ key: 'small', title: 'Small' }),
      makeGroup({ key: 'big', title: 'Big' }),
    ];
    const events = [
      makeEvent({ uid: '1', group_key: 'small', group_name: 'Small' }),
      makeEvent({ uid: '2', group_key: 'big', group_name: 'Big' }),
      makeEvent({ uid: '3', group_key: 'big', group_name: 'Big' }),
    ];

    const result = countGroups(events, groups);

    expect(result.map((g) => g.key)).toEqual(['big', 'small']);
  });
});

describe('filterEventsByGroup', () => {
  it('returns all events when groupKey is null', () => {
    const events = [makeEvent({ group_key: 'g1' }), makeEvent({ group_key: 'g2' })];

    expect(filterEventsByGroup(events, null)).toEqual(events);
  });

  it('returns only events matching the given group key', () => {
    const match = makeEvent({ uid: 'match', group_key: 'g1' });
    const other = makeEvent({ uid: 'other', group_key: 'g2' });

    expect(filterEventsByGroup([match, other], 'g1')).toEqual([match]);
  });
});
