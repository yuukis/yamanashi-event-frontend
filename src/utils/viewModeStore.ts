import { DEFAULT_VIEW_MODE, isValidViewMode, type ViewMode } from './viewMode';

export const VIEW_MODE_STORAGE_KEY = 'yamanashi-event-hub.view-mode.v1';

let current: ViewMode = DEFAULT_VIEW_MODE;
let hasLoaded = false;
const listeners = new Set<() => void>();

function loadFromStorage(): ViewMode {
  try {
    const raw = window.localStorage.getItem(VIEW_MODE_STORAGE_KEY);
    return isValidViewMode(raw) ? raw : DEFAULT_VIEW_MODE;
  } catch {
    return DEFAULT_VIEW_MODE;
  }
}

function saveToStorage(value: ViewMode): void {
  try {
    window.localStorage.setItem(VIEW_MODE_STORAGE_KEY, value);
  } catch {
    // 容量超過・プライベートブラウジング等での書き込み失敗は無視する
    // (メモリ上のcurrentはこのセッション内では引き続き正しい値を保つ)
  }
}

export function getViewModeSnapshot(): ViewMode {
  if (!hasLoaded) {
    current = loadFromStorage();
    hasLoaded = true;
  }
  return current;
}

export function subscribeViewMode(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

// 表示形式の切り替えでレイアウト高さが変わり、それまで見ていたイベントが
// 画面外に流れてしまう問題への対処。切り替え直前に画面内で最も上にある
// イベントカードを記録し、DOM更新が落ち着いた頃合いで同じイベントへ
// スクロールし直す。
function getHeaderOffset(): number {
  if (typeof window === 'undefined') {
    return 0;
  }
  return window.matchMedia('(min-width: 48em)').matches ? 88 : 72;
}

// Root/Group にある「直近開催イベント」等のセクション見出し(sticky)を、
// 対象カードの祖先を遡って直前の兄弟要素から探す。
function findPrecedingSticky(card: HTMLElement): HTMLElement | null {
  if (typeof window === 'undefined') {
    return null;
  }
  let node: Element | null = card;
  while (node) {
    let sibling = node.previousElementSibling;
    while (sibling) {
      if (sibling instanceof HTMLElement && window.getComputedStyle(sibling).position === 'sticky') {
        return sibling;
      }
      sibling = sibling.previousElementSibling;
    }
    node = node.parentElement;
  }
  return null;
}

type ScrollAnchor = {
  eventAnchorId: string;
  // 見出しがstickyとして固定されているかどうかに関わらず、切り替え前の
  // 「見出し自身の画面上のY座標」をそのまま維持する方針にする。固定済みか
  // どうかを毎フレーム判定して切り替え後の位置を計算し直すと、判定が
  // 行ったり来たりして画面が振動することがあったため。
  headingScreenYBefore: number | null;
};

function captureScrollAnchor(): ScrollAnchor | null {
  if (typeof document === 'undefined') {
    return null;
  }
  const offset = getHeaderOffset();
  const cards = document.querySelectorAll<HTMLElement>('[data-event-card]');
  for (const card of cards) {
    const rect = card.getBoundingClientRect();
    if (rect.bottom > offset) {
      const anchor = card.querySelector<HTMLElement>('[id^="event-"]');
      if (!anchor?.id) {
        return null;
      }
      const sticky = findPrecedingSticky(card);
      return {
        eventAnchorId: anchor.id,
        headingScreenYBefore: sticky ? sticky.getBoundingClientRect().top : null,
      };
    }
  }
  return null;
}

// 切り替え直後は画像の読み込み等で対象カードの位置がもう一度ずれることが
// あるため、一定時間は毎フレーム位置を確認し、ずれていたら補正し続ける。
// ユーザーが自分でスクロールしたら即座に補正をやめる。
function keepAnchorInView(anchor: ScrollAnchor): void {
  if (typeof window === 'undefined') {
    return;
  }
  const start = performance.now();
  const DURATION_MS = 800;
  const TOLERANCE_PX = 2;
  let aborted = false;

  const abort = () => {
    aborted = true;
  };
  const listenerOptions = { passive: true } as const;
  window.addEventListener('wheel', abort, listenerOptions);
  window.addEventListener('touchstart', abort, listenerOptions);
  window.addEventListener('keydown', abort, listenerOptions);

  const cleanup = () => {
    window.removeEventListener('wheel', abort);
    window.removeEventListener('touchstart', abort);
    window.removeEventListener('keydown', abort);
  };

  // どちらの方針でスクロール量を計算するかは最初の1回だけ判定し、以後は
  // 固定する。毎フレーム判定し直すと、2つの方針の計算結果が僅差で
  // 拮抗している場合にフレームごとに行ったり来たりして画面が振動する
  // ことがあるため。
  let useHeadingBased: boolean | null = null;

  const tick = () => {
    if (aborted) {
      cleanup();
      return;
    }

    const el = document.getElementById(anchor.eventAnchorId);
    if (el) {
      const card = el.closest<HTMLElement>('[data-event-card]') ?? el;
      const sticky = anchor.headingScreenYBefore !== null ? findPrecedingSticky(card) : null;
      let neededScroll: number;

      if (sticky && anchor.headingScreenYBefore !== null) {
        if (useHeadingBased === null) {
          // 見出し(固定されていてもいなくても)自体の画面上の位置を切り替え前と
          // 同じに保つ方針にすると、肝心のイベント自体が画面外に出てしまう
          // 場合(モードによる行の高さの差が大きいとき)がある。その場合は
          // 本来の目的(見ていたイベントを画面外に逃さない)を優先し、
          // カードを固定ヘッダー分の位置に揃える方針に切り替える。
          const headingBasedScroll = sticky.getBoundingClientRect().top - anchor.headingScreenYBefore;
          const projectedCardTop = el.getBoundingClientRect().top - headingBasedScroll;
          const viewportH = window.innerHeight;
          useHeadingBased = projectedCardTop >= -100 && projectedCardTop <= viewportH + 100;
        }
        neededScroll = useHeadingBased
          ? sticky.getBoundingClientRect().top - anchor.headingScreenYBefore
          : el.getBoundingClientRect().top - getHeaderOffset();
      } else {
        // 見出しが見つからない場合はカード自体を固定ヘッダー分の位置に揃える。
        neededScroll = el.getBoundingClientRect().top - getHeaderOffset();
      }

      if (Math.abs(neededScroll) > TOLERANCE_PX) {
        window.scrollBy(0, neededScroll);
      }
    }

    if (performance.now() - start < DURATION_MS) {
      window.requestAnimationFrame(tick);
    } else {
      cleanup();
    }
  };

  window.requestAnimationFrame(tick);
}

export function setViewMode(value: ViewMode): void {
  if (value === current) {
    return;
  }

  // ページ上端付近(ヒーローや絞り込みタブがまだ見えている状態)では、
  // そもそも「見ていたイベントが画面外に流れる」問題は起こらないため、
  // 補正自体を行わない。
  const nearTop = typeof window !== 'undefined' && window.scrollY < getHeaderOffset() + 200;
  const anchor = nearTop ? null : captureScrollAnchor();

  // スクロール補正で固定ヘッダーの表示切り替えロジックが誤反応しないよう
  // 抑止する(handleKeywordSelect等、他のレイアウト変更時と同じパターン)。
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('site-header-hold'));
  }

  current = value;
  hasLoaded = true;
  saveToStorage(value);
  listeners.forEach((listener) => listener());

  if (anchor) {
    keepAnchorInView(anchor);
  }
}
