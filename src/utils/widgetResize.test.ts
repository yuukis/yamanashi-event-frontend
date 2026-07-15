import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useReportWidgetHeight, useWidgetIframeAutoHeight, WIDGET_RESIZE_MESSAGE_TYPE, postWidgetHeight } from './widgetResize';

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

describe('useWidgetIframeAutoHeight', () => {
  it('sets the iframe height when a resize message from that iframe arrives', () => {
    const iframe = document.createElement('iframe');
    document.body.appendChild(iframe);
    const ref = { current: iframe };

    try {
      renderHook(() => useWidgetIframeAutoHeight(ref));

      window.dispatchEvent(new MessageEvent('message', {
        data: { type: WIDGET_RESIZE_MESSAGE_TYPE, height: 321 },
        source: iframe.contentWindow,
      }));

      expect(iframe.style.height).toBe('321px');
    } finally {
      document.body.removeChild(iframe);
    }
  });

  it('ignores a resize message whose source is not the tracked iframe', () => {
    const iframe = document.createElement('iframe');
    document.body.appendChild(iframe);
    const ref = { current: iframe };

    try {
      renderHook(() => useWidgetIframeAutoHeight(ref));

      window.dispatchEvent(new MessageEvent('message', {
        data: { type: WIDGET_RESIZE_MESSAGE_TYPE, height: 999 },
        source: window,
      }));

      expect(iframe.style.height).toBe('');
    } finally {
      document.body.removeChild(iframe);
    }
  });

  it('ignores a message with a different type', () => {
    const iframe = document.createElement('iframe');
    document.body.appendChild(iframe);
    const ref = { current: iframe };

    try {
      renderHook(() => useWidgetIframeAutoHeight(ref));

      window.dispatchEvent(new MessageEvent('message', {
        data: { type: 'something-else', height: 999 },
        source: iframe.contentWindow,
      }));

      expect(iframe.style.height).toBe('');
    } finally {
      document.body.removeChild(iframe);
    }
  });
});
