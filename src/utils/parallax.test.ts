import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getParallaxOffset, startParallax } from './parallax';

describe('getParallaxOffset', () => {
  it('scales scrollY by the rate', () => {
    expect(getParallaxOffset(100, 0.5)).toBe(50);
    expect(getParallaxOffset(0, 0.5)).toBe(0);
  });

  it('clamps negative scrollY (overscroll) to 0', () => {
    expect(getParallaxOffset(-30, 0.5)).toBe(0);
  });

  it('stays 0 until scrollY reaches the anchor top', () => {
    expect(getParallaxOffset(0, 0.5, 70)).toBe(0);
    expect(getParallaxOffset(70, 0.5, 70)).toBe(0);
  });

  it('scales only the distance scrolled past the anchor top', () => {
    expect(getParallaxOffset(170, 0.5, 70)).toBe(50);
  });
});

describe('startParallax', () => {
  let element: HTMLElement;

  const setScrollY = (value: number) => {
    Object.defineProperty(window, 'scrollY', { value, configurable: true });
  };

  beforeEach(() => {
    element = document.createElement('div');
    setScrollY(0);
    // コールバックを同期実行するモック。実際の rAF と違い update() が
    // frame を 0 に戻した後にハンドル値が代入されるため、0 を返して
    // 「実行待ちなし」の状態を保つ。
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      cb(0);
      return 0;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('applies the initial offset immediately', () => {
    setScrollY(200);
    const stop = startParallax(element, 0.5);

    expect(element.style.transform).toBe('translateY(100px)');

    stop();
  });

  it('offsets by the anchor top when an anchor is given', () => {
    const anchor = document.createElement('div');
    Object.defineProperty(anchor, 'offsetTop', { value: 70, configurable: true });

    const stop = startParallax(element, 0.5, anchor);

    setScrollY(50);
    window.dispatchEvent(new Event('scroll'));
    expect(element.style.transform).toBe('translateY(0px)');

    setScrollY(170);
    window.dispatchEvent(new Event('scroll'));
    expect(element.style.transform).toBe('translateY(50px)');

    stop();
  });

  it('follows scroll events', () => {
    const stop = startParallax(element, 0.5);

    setScrollY(80);
    window.dispatchEvent(new Event('scroll'));

    expect(element.style.transform).toBe('translateY(40px)');

    stop();
  });

  it('stops following and resets the transform after cleanup', () => {
    const stop = startParallax(element, 0.5);
    stop();

    expect(element.style.transform).toBe('');

    setScrollY(80);
    window.dispatchEvent(new Event('scroll'));

    expect(element.style.transform).toBe('');
  });

  it('does nothing when prefers-reduced-motion is set', () => {
    const matchMediaSpy = vi.spyOn(window, 'matchMedia').mockReturnValue({
      matches: true,
    } as MediaQueryList);

    setScrollY(200);
    const stop = startParallax(element, 0.5);

    expect(element.style.transform).toBe('');
    expect(matchMediaSpy).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');

    stop();
  });
});
