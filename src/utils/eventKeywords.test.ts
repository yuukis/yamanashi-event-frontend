import { describe, it, expect } from 'vitest';
import { countKeywords, filterEventsByKeyword } from './eventKeywords';
import { makeEvent } from '../test/fixtures';

describe('countKeywords', () => {
  it('counts keyword occurrences across events', () => {
    const events = [
      makeEvent({ keywords: ['React', 'TypeScript'] }),
      makeEvent({ keywords: ['React'] }),
      makeEvent({ keywords: [] }),
      makeEvent({ keywords: null }),
    ];

    expect(countKeywords(events)).toEqual([
      ['React', 2],
      ['TypeScript', 1],
    ]);
  });

  it('returns an empty array when no events have keywords', () => {
    expect(countKeywords([makeEvent({ keywords: null })])).toEqual([]);
  });
});

describe('filterEventsByKeyword', () => {
  it('returns all events when keyword is null', () => {
    const events = [makeEvent({ keywords: ['A'] }), makeEvent({ keywords: ['B'] })];

    expect(filterEventsByKeyword(events, null)).toEqual(events);
  });

  it('returns only events containing the given keyword', () => {
    const match = makeEvent({ uid: 'match', keywords: ['React'] });
    const other = makeEvent({ uid: 'other', keywords: ['Vue'] });

    expect(filterEventsByKeyword([match, other], 'React')).toEqual([match]);
  });

  it('treats events without keywords as non-matching', () => {
    const event = makeEvent({ keywords: null });

    expect(filterEventsByKeyword([event], 'React')).toEqual([]);
  });
});
