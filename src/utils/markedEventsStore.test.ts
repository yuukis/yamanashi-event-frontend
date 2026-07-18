import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { MarkedEventsData } from './markedEvents';

// Module-level singleton (loaded-once cache + subscriber set), so each test
// re-imports a fresh instance via vi.resetModules(), matching newEventTrackingStore.test.ts.
describe('markedEventsStore', () => {
  let mod: typeof import('./markedEventsStore');

  beforeEach(async () => {
    vi.resetModules();
    window.localStorage.clear();
    mod = await import('./markedEventsStore');
  });

  describe('getMarkedEventsSnapshot', () => {
    it('returns EMPTY_MARKED_EVENTS_DATA when nothing is stored', () => {
      expect(mod.getMarkedEventsSnapshot()).toEqual({ version: 1, records: {} });
    });

    it('falls back to EMPTY_MARKED_EVENTS_DATA when the stored JSON is malformed', () => {
      window.localStorage.setItem(mod.MARKED_EVENTS_STORAGE_KEY, '{not valid json');

      expect(mod.getMarkedEventsSnapshot()).toEqual({ version: 1, records: {} });
    });

    it('falls back to EMPTY_MARKED_EVENTS_DATA when the stored shape does not match the schema', () => {
      window.localStorage.setItem(mod.MARKED_EVENTS_STORAGE_KEY, JSON.stringify({ version: 2 }));

      expect(mod.getMarkedEventsSnapshot()).toEqual({ version: 1, records: {} });
    });

    it('returns the stored data when it matches the schema', () => {
      const stored: MarkedEventsData = { version: 1, records: { e1: { markedAt: '2026-01-01T00:00:00+09:00' } } };
      window.localStorage.setItem(mod.MARKED_EVENTS_STORAGE_KEY, JSON.stringify(stored));

      expect(mod.getMarkedEventsSnapshot()).toEqual(stored);
    });

    it('returns the same reference across repeated calls (stable snapshot)', () => {
      expect(mod.getMarkedEventsSnapshot()).toBe(mod.getMarkedEventsSnapshot());
    });
  });

  describe('updateMarkedEventsData', () => {
    it('persists the updater result to localStorage', () => {
      mod.updateMarkedEventsData((previous) => ({
        ...previous,
        records: { ...previous.records, e1: { markedAt: '2026-01-01T00:00:00+09:00' } },
      }));

      const raw = window.localStorage.getItem(mod.MARKED_EVENTS_STORAGE_KEY);
      expect(JSON.parse(raw!).records.e1).toEqual({ markedAt: '2026-01-01T00:00:00+09:00' });
    });

    it('returns the updated snapshot and updates getMarkedEventsSnapshot', () => {
      const result = mod.updateMarkedEventsData((previous) => ({
        ...previous,
        records: { ...previous.records, e1: { markedAt: '2026-01-01T00:00:00+09:00' } },
      }));

      expect(result.records.e1).toEqual({ markedAt: '2026-01-01T00:00:00+09:00' });
      expect(mod.getMarkedEventsSnapshot().records.e1).toEqual({ markedAt: '2026-01-01T00:00:00+09:00' });
    });

    it('notifies subscribers', () => {
      const listener = vi.fn();
      mod.subscribeMarkedEvents(listener);

      mod.updateMarkedEventsData((previous) => previous);

      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('does not throw when localStorage.setItem fails, and keeps the in-memory value', () => {
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new DOMException('QuotaExceededError');
      });

      expect(() => mod.updateMarkedEventsData((previous) => ({
        ...previous,
        records: { ...previous.records, e1: { markedAt: '2026-01-01T00:00:00+09:00' } },
      }))).not.toThrow();
      expect(mod.getMarkedEventsSnapshot().records.e1).toEqual({ markedAt: '2026-01-01T00:00:00+09:00' });

      setItemSpy.mockRestore();
    });
  });

  describe('subscribeMarkedEvents', () => {
    it('stops notifying after unsubscribing', () => {
      const listener = vi.fn();
      const unsubscribe = mod.subscribeMarkedEvents(listener);
      unsubscribe();

      mod.updateMarkedEventsData((previous) => previous);

      expect(listener).not.toHaveBeenCalled();
    });
  });
});
