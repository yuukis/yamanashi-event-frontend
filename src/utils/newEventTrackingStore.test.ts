import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { NewEventTrackingData } from './newEventTracking';

// Module-level singleton (loaded-once cache + subscriber set), so each test
// re-imports a fresh instance via vi.resetModules(), matching nowTicker.test.ts.
describe('newEventTrackingStore', () => {
  let mod: typeof import('./newEventTrackingStore');

  beforeEach(async () => {
    vi.resetModules();
    window.localStorage.clear();
    mod = await import('./newEventTrackingStore');
  });

  describe('isLocalStorageAvailable', () => {
    it('returns true when localStorage read/write succeeds', () => {
      expect(mod.isLocalStorageAvailable()).toBe(true);
    });

    it('returns false when localStorage.setItem throws', () => {
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new DOMException('QuotaExceededError');
      });

      expect(mod.isLocalStorageAvailable()).toBe(false);

      setItemSpy.mockRestore();
    });
  });

  describe('getTrackingDataSnapshot', () => {
    it('returns EMPTY_TRACKING_DATA when nothing is stored', () => {
      const snapshot = mod.getTrackingDataSnapshot();

      expect(snapshot).toEqual({ version: 1, records: {}, dismissedUids: [], acknowledgedDotUids: [] });
    });

    it('falls back to EMPTY_TRACKING_DATA when the stored JSON is malformed', () => {
      window.localStorage.setItem(mod.NEW_EVENT_TRACKING_STORAGE_KEY, '{not valid json');

      const snapshot = mod.getTrackingDataSnapshot();

      expect(snapshot).toEqual({ version: 1, records: {}, dismissedUids: [], acknowledgedDotUids: [] });
    });

    it('falls back to EMPTY_TRACKING_DATA when the stored shape does not match the schema', () => {
      window.localStorage.setItem(mod.NEW_EVENT_TRACKING_STORAGE_KEY, JSON.stringify({ version: 2 }));

      const snapshot = mod.getTrackingDataSnapshot();

      expect(snapshot).toEqual({ version: 1, records: {}, dismissedUids: [], acknowledgedDotUids: [] });
    });

    it('returns the stored data when it matches the schema', () => {
      const stored: NewEventTrackingData = {
        version: 1,
        records: { e1: { firstSeenAt: '2026-01-01T00:00:00+09:00' } },
        dismissedUids: [],
        acknowledgedDotUids: [],
      };
      window.localStorage.setItem(mod.NEW_EVENT_TRACKING_STORAGE_KEY, JSON.stringify(stored));

      expect(mod.getTrackingDataSnapshot()).toEqual(stored);
    });

    it('returns the same reference across repeated calls (stable snapshot)', () => {
      expect(mod.getTrackingDataSnapshot()).toBe(mod.getTrackingDataSnapshot());
    });
  });

  describe('updateTrackingData', () => {
    it('persists the updater result to localStorage', () => {
      mod.updateTrackingData((previous) => ({ ...previous, dismissedUids: ['e1'] }));

      const raw = window.localStorage.getItem(mod.NEW_EVENT_TRACKING_STORAGE_KEY);
      expect(JSON.parse(raw!).dismissedUids).toEqual(['e1']);
    });

    it('returns the updated snapshot and updates getTrackingDataSnapshot', () => {
      const result = mod.updateTrackingData((previous) => ({ ...previous, dismissedUids: ['e1'] }));

      expect(result.dismissedUids).toEqual(['e1']);
      expect(mod.getTrackingDataSnapshot().dismissedUids).toEqual(['e1']);
    });

    it('notifies subscribers', () => {
      const listener = vi.fn();
      mod.subscribeTrackingData(listener);

      mod.updateTrackingData((previous) => previous);

      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('does not throw when localStorage.setItem fails, and keeps the in-memory value', () => {
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new DOMException('QuotaExceededError');
      });

      expect(() => mod.updateTrackingData((previous) => ({ ...previous, dismissedUids: ['e1'] }))).not.toThrow();
      expect(mod.getTrackingDataSnapshot().dismissedUids).toEqual(['e1']);

      setItemSpy.mockRestore();
    });
  });

  describe('subscribeTrackingData', () => {
    it('stops notifying after unsubscribing', () => {
      const listener = vi.fn();
      const unsubscribe = mod.subscribeTrackingData(listener);
      unsubscribe();

      mod.updateTrackingData((previous) => previous);

      expect(listener).not.toHaveBeenCalled();
    });
  });
});
