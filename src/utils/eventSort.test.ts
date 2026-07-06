import { describe, it, expect } from 'vitest';
import { sortByStartedAtAsc, sortByStartedAtDesc } from './eventSort';
import { makeEvent } from '../test/fixtures';

describe('sortByStartedAtAsc', () => {
  it('sorts events from earliest to latest started_at', () => {
    const early = makeEvent({ uid: 'early', started_at: '2026-01-01T00:00:00+09:00' });
    const late = makeEvent({ uid: 'late', started_at: '2026-06-01T00:00:00+09:00' });

    expect([late, early].sort(sortByStartedAtAsc)).toEqual([early, late]);
  });
});

describe('sortByStartedAtDesc', () => {
  it('sorts events from latest to earliest started_at', () => {
    const early = makeEvent({ uid: 'early', started_at: '2026-01-01T00:00:00+09:00' });
    const late = makeEvent({ uid: 'late', started_at: '2026-06-01T00:00:00+09:00' });

    expect([early, late].sort(sortByStartedAtDesc)).toEqual([late, early]);
  });
});
