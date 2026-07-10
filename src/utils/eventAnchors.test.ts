import { describe, it, expect } from 'vitest';
import { formatEventDateKey, getEventAnchorId, getEventDateAnchorId } from './eventAnchors';

describe('formatEventDateKey', () => {
  it('formats a date as YYYY-MM-DD with zero-padding', () => {
    expect(formatEventDateKey(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  it('pads double-digit months and days correctly without truncation', () => {
    expect(formatEventDateKey(new Date(2026, 10, 25))).toBe('2026-11-25');
  });
});

describe('getEventDateAnchorId', () => {
  it('strips dashes and prefixes with "event-"', () => {
    expect(getEventDateAnchorId('2026-01-05')).toBe('event-20260105');
  });
});

describe('getEventAnchorId', () => {
  it('prefixes a short, id-safe hash of the uid with "event-item-"', () => {
    expect(getEventAnchorId('abc123')).toMatch(/^event-item-[0-9a-z]+$/);
  });

  it('is deterministic for the same uid', () => {
    expect(getEventAnchorId('event_395466@connpass.com')).toBe(getEventAnchorId('event_395466@connpass.com'));
  });

  it('produces different ids for different uids', () => {
    expect(getEventAnchorId('event-a')).not.toBe(getEventAnchorId('event-b'));
  });

  it('stays short even for long, special-character uids', () => {
    const id = getEventAnchorId('scratch-day-yamanashi-2026-05-17-001@yamanashi-event-archive');

    expect(id.length).toBeLessThan(20);
  });
});
