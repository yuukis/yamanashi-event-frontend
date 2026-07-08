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

  it('keeps the fixed header hidden by default (the static header covers the top)', () => {
    expect(mod.getHeaderVisible()).toBe(false);
    expect(mod.getHeaderAreaOccupied()).toBe(true);
    expect(mod.getNearPageTop()).toBe(true);
  });

  it('tracks whether the viewport is near the page top', () => {
    setScrollY(0);
    const unsub = mod.subscribeHeaderVisibility(() => {});
    expect(mod.getNearPageTop()).toBe(true);

    setScrollY(20);
    window.dispatchEvent(new Event('scroll'));
    expect(mod.getNearPageTop()).toBe(false);

    setScrollY(5);
    window.dispatchEvent(new Event('scroll'));
    expect(mod.getNearPageTop()).toBe(true);

    unsub();
  });

  it('stays hidden when scrolling down', () => {
    setScrollY(40);
    const unsub = mod.subscribeHeaderVisibility(() => {});

    setScrollY(60);
    window.dispatchEvent(new Event('scroll'));

    expect(mod.getHeaderVisible()).toBe(false);
    unsub();
  });

  it('shows when scrolling up past the threshold', () => {
    setScrollY(200);
    const unsub = mod.subscribeHeaderVisibility(() => {});

    setScrollY(170);
    window.dispatchEvent(new Event('scroll'));

    expect(mod.getHeaderVisible()).toBe(true);
    unsub();
  });

  it('hides again when scrolling down past the threshold', () => {
    setScrollY(200);
    const unsub = mod.subscribeHeaderVisibility(() => {});

    setScrollY(170);
    window.dispatchEvent(new Event('scroll'));
    expect(mod.getHeaderVisible()).toBe(true);

    setScrollY(190);
    window.dispatchEvent(new Event('scroll'));
    expect(mod.getHeaderVisible()).toBe(false);

    unsub();
  });

  it('ignores small scroll deltas', () => {
    setScrollY(200);
    const unsub = mod.subscribeHeaderVisibility(() => {});

    setScrollY(170);
    window.dispatchEvent(new Event('scroll'));
    expect(mod.getHeaderVisible()).toBe(true);

    setScrollY(174);
    window.dispatchEvent(new Event('scroll'));
    expect(mod.getHeaderVisible()).toBe(true);

    unsub();
  });

  it('hides near the top even when scrolling up (the static header takes over)', () => {
    setScrollY(200);
    const unsub = mod.subscribeHeaderVisibility(() => {});

    setScrollY(170);
    window.dispatchEvent(new Event('scroll'));
    expect(mod.getHeaderVisible()).toBe(true);

    setScrollY(5);
    window.dispatchEvent(new Event('scroll'));
    expect(mod.getHeaderVisible()).toBe(false);

    unsub();
  });

  it('reports the header area occupied while the static header is on screen', () => {
    setScrollY(0);
    const unsub = mod.subscribeHeaderVisibility(() => {});

    setScrollY(40);
    window.dispatchEvent(new Event('scroll'));
    expect(mod.getHeaderVisible()).toBe(false);
    expect(mod.getHeaderAreaOccupied()).toBe(true);

    setScrollY(200);
    window.dispatchEvent(new Event('scroll'));
    expect(mod.getHeaderVisible()).toBe(false);
    expect(mod.getHeaderAreaOccupied()).toBe(false);

    unsub();
  });

  it('uses the base header height for the occupied range on narrow screens', () => {
    // setup.ts の matchMedia モックは matches: false(base ブレークポイント扱い)
    setScrollY(60);
    const unsub = mod.subscribeHeaderVisibility(() => {});

    expect(mod.getHeaderAreaOccupied()).toBe(false);
    unsub();
  });

  it('uses the taller md header height for the occupied range on wide screens', () => {
    vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: true } as MediaQueryList);
    setScrollY(60);
    const unsub = mod.subscribeHeaderVisibility(() => {});

    expect(mod.getHeaderAreaOccupied()).toBe(true);

    setScrollY(80);
    window.dispatchEvent(new Event('scroll'));
    expect(mod.getHeaderAreaOccupied()).toBe(false);

    unsub();
  });

  it('reports the header area occupied while the fixed header is visible', () => {
    setScrollY(300);
    const unsub = mod.subscribeHeaderVisibility(() => {});

    setScrollY(270);
    window.dispatchEvent(new Event('scroll'));
    expect(mod.getHeaderVisible()).toBe(true);
    expect(mod.getHeaderAreaOccupied()).toBe(true);

    unsub();
  });

  it('site-header-show forces visible and holds through the next scroll-down', () => {
    setScrollY(200);
    const unsub = mod.subscribeHeaderVisibility(() => {});

    window.dispatchEvent(new Event('site-header-show'));
    expect(mod.getHeaderVisible()).toBe(true);

    setScrollY(220);
    window.dispatchEvent(new Event('scroll'));
    expect(mod.getHeaderVisible()).toBe(true);

    advanceClock(701);
    setScrollY(240);
    window.dispatchEvent(new Event('scroll'));
    expect(mod.getHeaderVisible()).toBe(false);

    unsub();
  });

  it('site-header-hold freezes the current state against scrolling for 700ms', () => {
    setScrollY(200);
    const unsub = mod.subscribeHeaderVisibility(() => {});

    setScrollY(170);
    window.dispatchEvent(new Event('scroll'));
    expect(mod.getHeaderVisible()).toBe(true);

    window.dispatchEvent(new Event('site-header-hold'));

    setScrollY(240);
    window.dispatchEvent(new Event('scroll'));
    expect(mod.getHeaderVisible()).toBe(true);

    advanceClock(701);
    setScrollY(300);
    window.dispatchEvent(new Event('scroll'));
    expect(mod.getHeaderVisible()).toBe(false);

    unsub();
  });

  it('notifies subscribed listeners when visibility changes', () => {
    setScrollY(200);
    const listener = vi.fn();
    const unsub = mod.subscribeHeaderVisibility(listener);

    setScrollY(170);
    window.dispatchEvent(new Event('scroll'));

    expect(listener).toHaveBeenCalledTimes(1);
    unsub();
  });

  it('stops listening for scroll events once the last listener unsubscribes', () => {
    setScrollY(200);
    const unsub = mod.subscribeHeaderVisibility(() => {});

    setScrollY(170);
    window.dispatchEvent(new Event('scroll'));
    expect(mod.getHeaderVisible()).toBe(true);

    unsub();

    setScrollY(200);
    window.dispatchEvent(new Event('scroll'));
    expect(mod.getHeaderVisible()).toBe(true);
  });
});
