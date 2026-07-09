import { describe, it, expect } from 'vitest';
import {
  EMPTY_TRACKING_DATA,
  acknowledgeNewEventDot,
  dismissNewEvents,
  hasUnacknowledgedNewEvent,
  isEventNew,
  isNotYetStarted,
  isValidTrackingData,
  mergeTrackingData,
  selectNewEventUids,
  type NewEventTrackingData,
} from './newEventTracking';

const NOW = new Date('2026-01-10T12:00:00+09:00');

function makeCandidate(overrides: Partial<{ uid: string; started_at: string; updated_at: string }> = {}) {
  return {
    uid: 'e1',
    started_at: '2026-01-20T10:00:00+09:00',
    updated_at: '2026-01-10T10:00:00+09:00',
    ...overrides,
  };
}

describe('isNotYetStarted', () => {
  it('is true for an event that starts in the future', () => {
    expect(isNotYetStarted({ started_at: '2026-01-11T00:00:00+09:00' }, NOW)).toBe(true);
  });

  it('is false for an event that has already started', () => {
    expect(isNotYetStarted({ started_at: '2026-01-09T00:00:00+09:00' }, NOW)).toBe(false);
  });
});

describe('mergeTrackingData', () => {
  it('sets firstSeenAt to now for a newly observed uid', () => {
    const result = mergeTrackingData(EMPTY_TRACKING_DATA, [makeCandidate({ uid: 'e1' })], NOW);

    expect(result.records['e1'].firstSeenAt).toBe(NOW.toISOString());
  });

  it('preserves the existing firstSeenAt for an already-known uid', () => {
    const previous: NewEventTrackingData = {
      version: 1,
      records: { e1: { firstSeenAt: '2026-01-01T00:00:00+09:00' } },
      dismissedUids: [],
      acknowledgedDotUids: [],
    };

    const result = mergeTrackingData(previous, [makeCandidate({ uid: 'e1' })], NOW);

    expect(result.records['e1'].firstSeenAt).toBe('2026-01-01T00:00:00+09:00');
  });

  it('prunes records, dismissedUids and acknowledgedDotUids for uids no longer in candidateEvents', () => {
    const previous: NewEventTrackingData = {
      version: 1,
      records: { gone: { firstSeenAt: '2026-01-01T00:00:00+09:00' }, e1: { firstSeenAt: '2026-01-01T00:00:00+09:00' } },
      dismissedUids: ['gone', 'e1'],
      acknowledgedDotUids: ['gone', 'e1'],
    };

    const result = mergeTrackingData(previous, [makeCandidate({ uid: 'e1' })], NOW);

    expect(result.records).toEqual({ e1: { firstSeenAt: '2026-01-01T00:00:00+09:00' } });
    expect(result.dismissedUids).toEqual(['e1']);
    expect(result.acknowledgedDotUids).toEqual(['e1']);
  });
});

describe('selectNewEventUids', () => {
  it('excludes an event that has already started', () => {
    const data: NewEventTrackingData = {
      version: 1,
      records: { e1: { firstSeenAt: NOW.toISOString() } },
      dismissedUids: [],
      acknowledgedDotUids: [],
    };
    const event = makeCandidate({ uid: 'e1', started_at: '2026-01-09T00:00:00+09:00' });

    expect(selectNewEventUids(data, [event], NOW)).toEqual(new Set());
  });

  it('excludes an event first seen more than 3 days ago', () => {
    const data: NewEventTrackingData = {
      version: 1,
      records: { e1: { firstSeenAt: '2026-01-07T11:59:59+09:00' } },
      dismissedUids: [],
      acknowledgedDotUids: [],
    };

    expect(selectNewEventUids(data, [makeCandidate({ uid: 'e1' })], NOW)).toEqual(new Set());
  });

  it('includes an event first seen exactly 3 days ago', () => {
    const data: NewEventTrackingData = {
      version: 1,
      records: { e1: { firstSeenAt: '2026-01-07T12:00:00+09:00' } },
      dismissedUids: [],
      acknowledgedDotUids: [],
    };

    expect(selectNewEventUids(data, [makeCandidate({ uid: 'e1' })], NOW)).toEqual(new Set(['e1']));
  });

  it('excludes an event whose updated_at is more than 7 days old', () => {
    const data: NewEventTrackingData = {
      version: 1,
      records: { e1: { firstSeenAt: NOW.toISOString() } },
      dismissedUids: [],
      acknowledgedDotUids: [],
    };
    const event = makeCandidate({ uid: 'e1', updated_at: '2026-01-03T11:59:59+09:00' });

    expect(selectNewEventUids(data, [event], NOW)).toEqual(new Set());
  });

  it('includes an event whose updated_at is exactly 7 days old', () => {
    const data: NewEventTrackingData = {
      version: 1,
      records: { e1: { firstSeenAt: NOW.toISOString() } },
      dismissedUids: [],
      acknowledgedDotUids: [],
    };
    const event = makeCandidate({ uid: 'e1', updated_at: '2026-01-03T12:00:00+09:00' });

    expect(selectNewEventUids(data, [event], NOW)).toEqual(new Set(['e1']));
  });

  it('excludes a dismissed uid even if it otherwise qualifies', () => {
    const data: NewEventTrackingData = {
      version: 1,
      records: { e1: { firstSeenAt: NOW.toISOString() } },
      dismissedUids: ['e1'],
      acknowledgedDotUids: [],
    };

    expect(selectNewEventUids(data, [makeCandidate({ uid: 'e1' })], NOW)).toEqual(new Set());
  });

  it('excludes a uid with no tracked record', () => {
    expect(selectNewEventUids(EMPTY_TRACKING_DATA, [makeCandidate({ uid: 'e1' })], NOW)).toEqual(new Set());
  });
});

describe('isEventNew', () => {
  it('mirrors selectNewEventUids for a single event', () => {
    const data: NewEventTrackingData = {
      version: 1,
      records: { e1: { firstSeenAt: NOW.toISOString() } },
      dismissedUids: [],
      acknowledgedDotUids: [],
    };

    expect(isEventNew(data, makeCandidate({ uid: 'e1' }), NOW)).toBe(true);
    expect(isEventNew(data, makeCandidate({ uid: 'e2' }), NOW)).toBe(false);
  });
});

describe('dismissNewEvents', () => {
  it('adds uids to dismissedUids without duplicating', () => {
    const data = dismissNewEvents(EMPTY_TRACKING_DATA, ['e1']);
    const result = dismissNewEvents(data, ['e1', 'e2']);

    expect(result.dismissedUids.sort()).toEqual(['e1', 'e2']);
  });
});

describe('acknowledgeNewEventDot / hasUnacknowledgedNewEvent', () => {
  it('reports unacknowledged uids as having a pending dot', () => {
    expect(hasUnacknowledgedNewEvent(EMPTY_TRACKING_DATA, ['e1'])).toBe(true);
  });

  it('clears the dot once the uids have been acknowledged', () => {
    const data = acknowledgeNewEventDot(EMPTY_TRACKING_DATA, ['e1']);

    expect(hasUnacknowledgedNewEvent(data, ['e1'])).toBe(false);
  });

  it('shows the dot again for a uid that was never acknowledged, even if others were', () => {
    const data = acknowledgeNewEventDot(EMPTY_TRACKING_DATA, ['e1']);

    expect(hasUnacknowledgedNewEvent(data, ['e1', 'e2'])).toBe(true);
  });
});

describe('isValidTrackingData', () => {
  it('accepts a well-formed object', () => {
    expect(isValidTrackingData(EMPTY_TRACKING_DATA)).toBe(true);
  });

  it('rejects null, non-objects and mismatched versions', () => {
    expect(isValidTrackingData(null)).toBe(false);
    expect(isValidTrackingData('not an object')).toBe(false);
    expect(isValidTrackingData({ ...EMPTY_TRACKING_DATA, version: 2 })).toBe(false);
  });

  it('rejects an object missing the expected array fields', () => {
    expect(isValidTrackingData({ version: 1, records: {} })).toBe(false);
  });
});
