import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// This module keeps module-level singleton state (visibility, scroll
// position, timers), so each test re-imports a fresh instance via
// vi.resetModules() rather than sharing state across tests.
describe('headerVisibility', () => {
  let mod: typeof import('./headerVisibility');
  let scrollY: number;
  let clock: number;

  function setScrollY(y: number) {
    scrollY = y;
  }

  function advanceClock(ms: number) {
    clock += ms;
  }

  beforeEach(async () => {
    vi.resetModules();
    scrollY = 0;
    clock = 0;
    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      get: () => scrollY,
    });
    vi.spyOn(performance, 'now').mockImplementation(() => clock);
    mod = await import('./headerVisibility');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('is visible by default', () => {
    expect(mod.getHeaderVisible()).toBe(true);
  });

  it('hides when scrolling down past the threshold', () => {
    setScrollY(40);
    const unsub = mod.subscribeHeaderVisibility(() => {});

    setScrollY(60);
    window.dispatchEvent(new Event('scroll'));

    expect(mod.getHeaderVisible()).toBe(false);
    unsub();
  });

  it('shows again when scrolling up past the threshold', () => {
    setScrollY(40);
    const unsub = mod.subscribeHeaderVisibility(() => {});

    setScrollY(60);
    window.dispatchEvent(new Event('scroll'));
    expect(mod.getHeaderVisible()).toBe(false);

    setScrollY(30);
    window.dispatchEvent(new Event('scroll'));
    expect(mod.getHeaderVisible()).toBe(true);

    unsub();
  });

  it('ignores small scroll deltas', () => {
    setScrollY(40);
    const unsub = mod.subscribeHeaderVisibility(() => {});

    setScrollY(44);
    window.dispatchEvent(new Event('scroll'));

    expect(mod.getHeaderVisible()).toBe(true);
    unsub();
  });

  it('forces visible whenever scrollY is near the top', () => {
    setScrollY(40);
    const unsub = mod.subscribeHeaderVisibility(() => {});

    setScrollY(60);
    window.dispatchEvent(new Event('scroll'));
    expect(mod.getHeaderVisible()).toBe(false);

    setScrollY(5);
    window.dispatchEvent(new Event('scroll'));
    expect(mod.getHeaderVisible()).toBe(true);

    unsub();
  });

  it('site-header-show forces visible and holds through the next scroll-down', () => {
    setScrollY(40);
    const unsub = mod.subscribeHeaderVisibility(() => {});

    setScrollY(60);
    window.dispatchEvent(new Event('scroll'));
    expect(mod.getHeaderVisible()).toBe(false);

    window.dispatchEvent(new Event('site-header-show'));
    expect(mod.getHeaderVisible()).toBe(true);

    setScrollY(80);
    window.dispatchEvent(new Event('scroll'));
    expect(mod.getHeaderVisible()).toBe(true);

    advanceClock(701);
    setScrollY(100);
    window.dispatchEvent(new Event('scroll'));
    expect(mod.getHeaderVisible()).toBe(false);

    unsub();
  });

  it('site-header-hold freezes the current state against scrolling for 700ms', () => {
    setScrollY(40);
    const unsub = mod.subscribeHeaderVisibility(() => {});

    window.dispatchEvent(new Event('site-header-hold'));

    setScrollY(80);
    window.dispatchEvent(new Event('scroll'));
    expect(mod.getHeaderVisible()).toBe(true);

    advanceClock(701);
    setScrollY(120);
    window.dispatchEvent(new Event('scroll'));
    expect(mod.getHeaderVisible()).toBe(false);

    unsub();
  });

  it('notifies subscribed listeners when visibility changes', () => {
    setScrollY(40);
    const listener = vi.fn();
    const unsub = mod.subscribeHeaderVisibility(listener);

    setScrollY(60);
    window.dispatchEvent(new Event('scroll'));

    expect(listener).toHaveBeenCalledTimes(1);
    unsub();
  });

  it('stops listening for scroll events once the last listener unsubscribes', () => {
    setScrollY(40);
    const unsub = mod.subscribeHeaderVisibility(() => {});

    setScrollY(60);
    window.dispatchEvent(new Event('scroll'));
    expect(mod.getHeaderVisible()).toBe(false);

    unsub();

    setScrollY(0);
    window.dispatchEvent(new Event('scroll'));
    expect(mod.getHeaderVisible()).toBe(false);
  });
});
