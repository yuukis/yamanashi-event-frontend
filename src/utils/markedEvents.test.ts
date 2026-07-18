import { describe, it, expect } from 'vitest';
import {
  EMPTY_MARKED_EVENTS_DATA,
  isEventMarked,
  isValidMarkedEventsData,
  markEvent,
  mergeMarkedEvents,
  unmarkEvent,
  type MarkedEventsData,
} from './markedEvents';

const NOW = new Date('2026-01-10T12:00:00+09:00');

describe('markEvent', () => {
  it('adds a record with markedAt set to now', () => {
    const result = markEvent(EMPTY_MARKED_EVENTS_DATA, 'e1', NOW);

    expect(result.records['e1']).toEqual({ markedAt: NOW.toISOString() });
  });

  it('overwrites markedAt when marking an already-marked event again', () => {
    const previous = markEvent(EMPTY_MARKED_EVENTS_DATA, 'e1', new Date('2026-01-01T00:00:00+09:00'));

    const result = markEvent(previous, 'e1', NOW);

    expect(result.records['e1'].markedAt).toBe(NOW.toISOString());
  });

  it('does not mutate unrelated records', () => {
    const previous = markEvent(EMPTY_MARKED_EVENTS_DATA, 'e1', NOW);

    const result = markEvent(previous, 'e2', NOW);

    expect(result.records['e1']).toBeDefined();
    expect(result.records['e2']).toBeDefined();
  });
});

describe('unmarkEvent', () => {
  it('removes the record for the given uid', () => {
    const previous = markEvent(EMPTY_MARKED_EVENTS_DATA, 'e1', NOW);

    const result = unmarkEvent(previous, 'e1');

    expect(result.records['e1']).toBeUndefined();
  });

  it('is a no-op when the uid is not marked', () => {
    const result = unmarkEvent(EMPTY_MARKED_EVENTS_DATA, 'e1');

    expect(result.records).toEqual({});
  });

  it('does not remove unrelated records', () => {
    const previous = markEvent(markEvent(EMPTY_MARKED_EVENTS_DATA, 'e1', NOW), 'e2', NOW);

    const result = unmarkEvent(previous, 'e1');

    expect(result.records['e2']).toBeDefined();
  });
});

describe('mergeMarkedEvents', () => {
  it('adds records for uids not already marked, using now as markedAt', () => {
    const result = mergeMarkedEvents(EMPTY_MARKED_EVENTS_DATA, ['e1', 'e2'], NOW);

    expect(result.records['e1']).toEqual({ markedAt: NOW.toISOString() });
    expect(result.records['e2']).toEqual({ markedAt: NOW.toISOString() });
  });

  it('does not overwrite markedAt for uids already marked', () => {
    const earlier = new Date('2026-01-01T00:00:00+09:00');
    const previous = markEvent(EMPTY_MARKED_EVENTS_DATA, 'e1', earlier);

    const result = mergeMarkedEvents(previous, ['e1'], NOW);

    expect(result.records['e1']).toEqual({ markedAt: earlier.toISOString() });
  });

  it('is a no-op when given no uids', () => {
    const previous = markEvent(EMPTY_MARKED_EVENTS_DATA, 'e1', NOW);

    const result = mergeMarkedEvents(previous, [], NOW);

    expect(result.records).toEqual(previous.records);
  });
});

describe('isEventMarked', () => {
  it('is true when a record exists for the uid', () => {
    const data = markEvent(EMPTY_MARKED_EVENTS_DATA, 'e1', NOW);

    expect(isEventMarked(data, 'e1')).toBe(true);
  });

  it('is false when no record exists for the uid', () => {
    expect(isEventMarked(EMPTY_MARKED_EVENTS_DATA, 'e1')).toBe(false);
  });
});

describe('isValidMarkedEventsData', () => {
  it('accepts EMPTY_MARKED_EVENTS_DATA', () => {
    expect(isValidMarkedEventsData(EMPTY_MARKED_EVENTS_DATA)).toBe(true);
  });

  it('accepts data with valid records', () => {
    const data: MarkedEventsData = { version: 1, records: { e1: { markedAt: NOW.toISOString() } } };

    expect(isValidMarkedEventsData(data)).toBe(true);
  });

  it('rejects null', () => {
    expect(isValidMarkedEventsData(null)).toBe(false);
  });

  it('rejects a mismatched version', () => {
    expect(isValidMarkedEventsData({ version: 2, records: {} })).toBe(false);
  });

  it('rejects when records is an array', () => {
    expect(isValidMarkedEventsData({ version: 1, records: [] })).toBe(false);
  });

  it('rejects a record with a non-string markedAt', () => {
    expect(isValidMarkedEventsData({ version: 1, records: { e1: { markedAt: 123 } } })).toBe(false);
  });

  it('rejects a record with an invalid date string', () => {
    expect(isValidMarkedEventsData({ version: 1, records: { e1: { markedAt: 'not-a-date' } } })).toBe(false);
  });
});
