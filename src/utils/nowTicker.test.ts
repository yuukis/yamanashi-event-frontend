import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Module-level singleton (current time + interval), so each test re-imports
// a fresh instance via vi.resetModules().
describe('nowTicker', () => {
  let mod: typeof import('./nowTicker');

  beforeEach(async () => {
    vi.resetModules();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00+09:00'));
    mod = await import('./nowTicker');
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('ticks immediately on the first subscription', () => {
    vi.setSystemTime(new Date('2026-01-01T00:00:05+09:00'));
    mod.subscribeNow(() => {});

    expect(mod.getNow().toISOString()).toBe(new Date('2026-01-01T00:00:05+09:00').toISOString());
  });

  it('updates now every 60 seconds while subscribed', () => {
    const unsub = mod.subscribeNow(() => {});

    vi.advanceTimersByTime(60000);

    expect(mod.getNow().toISOString()).toBe(new Date('2026-01-01T00:01:00+09:00').toISOString());
    unsub();
  });

  it('notifies all subscribed listeners on each tick', () => {
    const listenerA = vi.fn();
    const listenerB = vi.fn();
    const unsubA = mod.subscribeNow(listenerA);
    const unsubB = mod.subscribeNow(listenerB);

    listenerA.mockClear();
    listenerB.mockClear();

    vi.advanceTimersByTime(60000);

    expect(listenerA).toHaveBeenCalledTimes(1);
    expect(listenerB).toHaveBeenCalledTimes(1);

    unsubA();
    unsubB();
  });

  it('stops ticking once the last listener unsubscribes', () => {
    const listener = vi.fn();
    const unsub = mod.subscribeNow(listener);
    listener.mockClear();

    unsub();
    vi.setSystemTime(new Date('2026-01-01T01:00:00+09:00'));
    vi.advanceTimersByTime(60000);

    expect(listener).not.toHaveBeenCalled();
  });

  it('keeps the interval alive for remaining listeners after one unsubscribes', () => {
    const listenerA = vi.fn();
    const listenerB = vi.fn();
    const unsubA = mod.subscribeNow(listenerA);
    const unsubB = mod.subscribeNow(listenerB);
    unsubA();
    listenerB.mockClear();

    vi.advanceTimersByTime(60000);

    expect(listenerB).toHaveBeenCalledTimes(1);
    unsubB();
  });

  it('ticks immediately when the page becomes visible again while subscribed', () => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
    const unsub = mod.subscribeNow(() => {});

    vi.setSystemTime(new Date('2026-01-01T00:05:00+09:00'));
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
    document.dispatchEvent(new Event('visibilitychange'));

    expect(mod.getNow().toISOString()).toBe(new Date('2026-01-01T00:05:00+09:00').toISOString());
    unsub();
  });
});
