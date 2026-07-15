import { useEffect } from 'react';
import type { RefObject } from 'react';

export const WIDGET_RESIZE_MESSAGE_TYPE = 'yamanashi-hub:widget-resize';

export function postWidgetHeight(height: number) {
  if (window.parent === window) {
    return;
  }
  window.parent.postMessage({ type: WIDGET_RESIZE_MESSAGE_TYPE, height }, '*');
}

export function useReportWidgetHeight(ref: RefObject<HTMLElement>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) {
      return;
    }

    const report = () => postWidgetHeight(Math.ceil(el.getBoundingClientRect().height));
    report();

    if (typeof ResizeObserver === 'undefined') {
      return;
    }

    const observer = new ResizeObserver(report);
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);
}

export function useWidgetIframeAutoHeight(iframeRef: RefObject<HTMLIFrameElement>) {
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const iframe = iframeRef.current;
      if (!iframe || event.source !== iframe.contentWindow) {
        return;
      }
      if (!event.data || event.data.type !== WIDGET_RESIZE_MESSAGE_TYPE) {
        return;
      }
      const height = event.data.height;
      if (typeof height !== 'number' || !Number.isFinite(height) || height < 0) {
        return;
      }
      iframe.style.height = `${height}px`;
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [iframeRef]);
}
