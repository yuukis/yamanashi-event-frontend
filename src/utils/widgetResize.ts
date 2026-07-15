import { useEffect } from 'react';
import type { RefObject } from 'react';

export const WIDGET_RESIZE_MESSAGE_TYPE = 'yamanashi-hub:widget-resize';

export function postWidgetHeight(height: number) {
  if (window.parent === window) {
    return;
  }
  window.parent.postMessage({ type: WIDGET_RESIZE_MESSAGE_TYPE, height }, '*');
}

// 埋め込み先のオリジンは事前に分からないため postMessage の対象は
// ワイルドカードにする。高さの数値のみを送るため機微情報は含まない。
// 受信側(埋め込み先ブログ)でオリジン検証を行う想定。
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
