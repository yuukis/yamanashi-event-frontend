import { describe, it, expect } from 'vitest';
import { formatEventDateKey, getEventDateAnchorId } from './eventAnchors';

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
