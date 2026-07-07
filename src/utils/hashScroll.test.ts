import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { scrollToCurrentHash } from './hashScroll';

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
