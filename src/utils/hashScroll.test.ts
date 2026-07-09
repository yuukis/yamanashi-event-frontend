import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { jumpToAnchor, scrollToCurrentHash } from './hashScroll';

describe('scrollToCurrentHash', () => {
  beforeEach(() => {
    window.location.hash = '';
    vi.useFakeTimers();
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      cb(0);
      return 0;
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does nothing when there is no hash', () => {
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

    scrollToCurrentHash();

    expect(dispatchSpy).not.toHaveBeenCalled();
  });

  it('does nothing when no element matches the hash', () => {
    window.location.hash = '#missing';
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

    scrollToCurrentHash();

    expect(dispatchSpy).not.toHaveBeenCalled();
  });

  it('scrolls to and reveals the target element when it exists', () => {
    const target = document.createElement('div');
    target.id = 'event-20260105';
    target.scrollIntoView = vi.fn();
    document.body.appendChild(target);
    window.location.hash = '#event-20260105';

    const dispatchedTypes: string[] = [];
    vi.spyOn(window, 'dispatchEvent').mockImplementation((event) => {
      dispatchedTypes.push(event.type);
      return true;
    });

    scrollToCurrentHash();

    expect(target.scrollIntoView).toHaveBeenCalled();
    // called once synchronously, once via the (mocked, synchronous) rAF
    expect(dispatchedTypes.filter((t) => t === 'site-header-show')).toHaveLength(2);

    vi.advanceTimersByTime(120);
    expect(dispatchedTypes.filter((t) => t === 'site-header-show')).toHaveLength(3);

    document.body.removeChild(target);
  });

  it('decodes percent-encoded hashes before looking up the element', () => {
    const target = document.createElement('div');
    target.id = 'イベント';
    target.scrollIntoView = vi.fn();
    document.body.appendChild(target);
    window.location.hash = `#${encodeURIComponent('イベント')}`;

    scrollToCurrentHash();

    expect(target.scrollIntoView).toHaveBeenCalled();

    document.body.removeChild(target);
  });
});

describe('jumpToAnchor', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/');
    window.location.hash = '';
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      cb(0);
      return 0;
    });
  });

  afterEach(() => {
    window.history.pushState({}, '', '/');
  });

  it('sets the hash and scrolls when already on "/"', () => {
    const target = document.createElement('div');
    target.id = 'event-item-e1';
    target.scrollIntoView = vi.fn();
    document.body.appendChild(target);

    jumpToAnchor('event-item-e1');

    expect(window.location.hash).toBe('#event-item-e1');
    expect(target.scrollIntoView).toHaveBeenCalled();

    document.body.removeChild(target);
  });

  it('encodes the anchor id when setting the hash', () => {
    jumpToAnchor('event-item-イベント');

    expect(window.location.hash).toBe(`#${encodeURIComponent('event-item-イベント')}`);
  });

  it('does not push a new history entry when already on "/"', () => {
    const pushStateSpy = vi.spyOn(window.history, 'pushState');
    const replaceStateSpy = vi.spyOn(window.history, 'replaceState');

    jumpToAnchor('event-item-e1');

    expect(pushStateSpy).not.toHaveBeenCalled();
    expect(replaceStateSpy).toHaveBeenCalledWith(null, '', '#event-item-e1');

    pushStateSpy.mockRestore();
    replaceStateSpy.mockRestore();
  });

  it('navigates to "/" with the encoded anchor when not already on "/"', () => {
    window.history.pushState({}, '', '/2026');
    const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    jumpToAnchor('event-item-e1');

    expect(windowOpenSpy).toHaveBeenCalledWith('/#event-item-e1', '_self');

    windowOpenSpy.mockRestore();
  });
});
