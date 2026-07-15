import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useReportWidgetHeight, WIDGET_RESIZE_MESSAGE_TYPE, postWidgetHeight } from './widgetResize';

class FakeResizeObserver {
  callback: ResizeObserverCallback;
  observed: Element[] = [];

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
  }
  observe(el: Element) {
    this.observed.push(el);
  }
  unobserve() {}
  disconnect() {}
}

describe('postWidgetHeight', () => {
  it('does nothing when the window is not embedded in an iframe', () => {
    const postMessageSpy = vi.spyOn(window, 'postMessage');

    postWidgetHeight(100);

    expect(postMessageSpy).not.toHaveBeenCalled();
    postMessageSpy.mockRestore();
  });
});

describe('useReportWidgetHeight', () => {
  const originalResizeObserver = window.ResizeObserver;
  const originalParent = window.parent;

  beforeEach(() => {
    (window as unknown as { ResizeObserver: typeof ResizeObserver }).ResizeObserver =
      FakeResizeObserver as unknown as typeof ResizeObserver;
  });

  afterEach(() => {
    (window as unknown as { ResizeObserver: typeof ResizeObserver }).ResizeObserver = originalResizeObserver;
    Object.defineProperty(window, 'parent', { value: originalParent, configurable: true });
  });

  it('reports the element height to the parent window on mount', () => {
    const parentPostMessageSpy = vi.fn();
    Object.defineProperty(window, 'parent', {
      value: { postMessage: parentPostMessageSpy },
      configurable: true,
    });

    const div = document.createElement('div');
    document.body.appendChild(div);
    const ref = { current: div };

    try {
      renderHook(() => useReportWidgetHeight(ref));

      expect(parentPostMessageSpy).toHaveBeenCalledWith(
        expect.objectContaining({ type: WIDGET_RESIZE_MESSAGE_TYPE }),
        '*',
      );
    } finally {
      document.body.removeChild(div);
    }
  });
});
