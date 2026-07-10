export function jumpToAnchor(anchorId: string): void {
  const encodedAnchorId = encodeURIComponent(anchorId);

  if (window.location.pathname === '/') {
    // location.hash への代入は履歴を積んでしまうためreplaceStateを使う。
    // 第1引数にnullを渡すとReact Routerがhistory.stateに持たせている
    // idx/key等が消えPOPナビゲーションが壊れるため、既存stateを引き継ぐ。
    window.history.replaceState(window.history.state, '', `#${encodedAnchorId}`);
    window.requestAnimationFrame(scrollToCurrentHash);
    return;
  }

  window.open(`/#${encodedAnchorId}`, '_self');
}

// イベントカード側(EventBody)がReactのstateとしてハイライト表示を
// 制御できるよう、DOMを直接書き換えるのではなくカスタムイベントで通知する。
// (classList/styleを直接触ると、Chakraの再レンダリングですぐ上書きされて消える)
export const EVENT_CARD_HIGHLIGHT_EVENT = 'event-card-highlight';

const EVENT_ANCHOR_PREFIX = 'event-';
const DATE_ANCHOR_PREFIX = 'date-';

export function scrollToCurrentHash() {
  const hash = window.location.hash;

  if (!hash) {
    return;
  }

  const id = decodeURIComponent(hash.slice(1));
  const target = document.getElementById(id);

  if (target) {
    window.dispatchEvent(new Event('site-header-show'));
    target.scrollIntoView();
    window.requestAnimationFrame(() => {
      window.dispatchEvent(new Event('site-header-show'));
    });
    window.setTimeout(() => {
      window.dispatchEvent(new Event('site-header-show'));
    }, 120);

    if (id.startsWith(EVENT_ANCHOR_PREFIX)) {
      const card = target.closest<HTMLElement>('[data-event-card]') ?? target;
      highlightCard(card);
    } else if (id.startsWith(DATE_ANCHOR_PREFIX)) {
      // その日のイベントは複数あり得るため、対象の1件だけでなく
      // 同じ日付のカードすべてをハイライトする。
      const dateKey = id.slice(DATE_ANCHOR_PREFIX.length);
      document.querySelectorAll<HTMLElement>(`[data-event-date="${dateKey}"]`).forEach(highlightCard);
    }
  }
}

function highlightCard(card: HTMLElement): void {
  card.dispatchEvent(new CustomEvent(EVENT_CARD_HIGHLIGHT_EVENT));
}
