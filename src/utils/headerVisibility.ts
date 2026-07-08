type Listener = () => void;

// SiteHeader の実高さ(ロゴ行 + 下線3本分)。ActiveFilterBadge がヘッダー
// 直下に位置合わせする際にも同じ値を使うため、両方から参照できるように
// ここで定義する。
const HEADER_ROW_REM = { base: 3, md: 4 };
const HEADER_UNDERLINE_PX = 7;
export const HEADER_HEIGHT = {
  base: `calc(${HEADER_ROW_REM.base}rem + ${HEADER_UNDERLINE_PX}px)`,
  md: `calc(${HEADER_ROW_REM.md}rem + ${HEADER_UNDERLINE_PX}px)`,
};

// Chakra の md ブレークポイント
let mdMediaQuery: MediaQueryList | null = null;

// 最上部ヘッダー(通常フロー)がまだ画面内に残っているとみなすスクロール量
// (px)。ブラウザの既定フォントサイズ変更にも追従できるよう、rem を実際の
// ルートフォントサイズで換算して求める(+1px は丸め余裕)。
function getStaticHeaderRange(): number {
  if (!mdMediaQuery) {
    mdMediaQuery = window.matchMedia('(min-width: 48em)');
  }
  const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
  const rows = mdMediaQuery.matches ? HEADER_ROW_REM.md : HEADER_ROW_REM.base;
  return rows * rootFontSize + HEADER_UNDERLINE_PX + 1;
}

// 「ページ上端付近」とみなすスクロール量(px)。この範囲では最上部ヘッダーと
// 固定ヘッダーの位置ずれがこの値未満に収まる。
const NEAR_TOP_RANGE = 8;

let isFixedHeaderVisible = false;
let isHeaderAreaOccupied = true;
let isNearTop = true;
let lastScrollY = 0;
let keepVisibleUntil = 0;
let holdStateUntil = 0;
let boundaryElement: HTMLElement | null = null;
const listeners = new Set<Listener>();
let isStarted = false;

// 固定ヘッダーの表示境界となる要素を登録する。登録すると、その要素が
// ビューポート上端に達するまでは上スクロールでも固定ヘッダーを表示しない
// (ページ先頭のヒーローや案内が見えている間は最上部ヘッダーだけで足りる
// ため)。未登録時は NEAR_TOP_RANGE で判定する。
export function setFixedHeaderBoundary(element: HTMLElement | null) {
  boundaryElement = element;
}

function getHideThreshold(): number {
  if (!boundaryElement || !boundaryElement.isConnected) {
    return NEAR_TOP_RANGE;
  }
  // イベントの読み込みなどで境界要素の位置は変わるため、毎回測り直す
  return boundaryElement.getBoundingClientRect().top + window.scrollY;
}

function snapshot() {
  return `${isFixedHeaderVisible},${isHeaderAreaOccupied},${isNearTop}`;
}

function notifyIfChanged(previousSnapshot: string) {
  if (snapshot() !== previousSnapshot) {
    listeners.forEach((listener) => listener());
  }
}

function updateDerivedStates() {
  isHeaderAreaOccupied = isFixedHeaderVisible || window.scrollY < getStaticHeaderRange();
  isNearTop = window.scrollY < NEAR_TOP_RANGE;
}

function handleScroll() {
  const previousSnapshot = snapshot();
  const now = performance.now();
  const currentScrollY = window.scrollY;
  const scrollDifference = currentScrollY - lastScrollY;
  lastScrollY = currentScrollY;

  if (now >= holdStateUntil) {
    if (currentScrollY < getHideThreshold()) {
      // 境界より上は最上部ヘッダー(通常フロー)に役割を譲る
      isFixedHeaderVisible = false;
    } else if (now < keepVisibleUntil) {
      isFixedHeaderVisible = true;
    } else if (scrollDifference > 6) {
      isFixedHeaderVisible = false;
    } else if (scrollDifference < -6) {
      isFixedHeaderVisible = true;
    }
  }

  updateDerivedStates();
  notifyIfChanged(previousSnapshot);
}

function handleShow() {
  const previousSnapshot = snapshot();
  keepVisibleUntil = performance.now() + 700;
  isFixedHeaderVisible = true;
  updateDerivedStates();
  notifyIfChanged(previousSnapshot);
}

function handleHold() {
  holdStateUntil = performance.now() + 700;
}

function start() {
  if (isStarted) {
    return;
  }
  isStarted = true;
  lastScrollY = window.scrollY;
  updateDerivedStates();
  window.addEventListener('scroll', handleScroll, { passive: true });
  window.addEventListener('site-header-show', handleShow);
  window.addEventListener('site-header-hold', handleHold);
}

function stop() {
  isStarted = false;
  window.removeEventListener('scroll', handleScroll);
  window.removeEventListener('site-header-show', handleShow);
  window.removeEventListener('site-header-hold', handleHold);
}

// ヘッダーとバッジ(ActiveFilterBadge)が同じ表示状態を共有して連動できるよう、
// スクロール判定を1箇所にまとめた外部ストアとして提供する。
export function subscribeHeaderVisibility(listener: Listener): () => void {
  listeners.add(listener);
  start();

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      stop();
    }
  };
}

// 固定ヘッダー(上スクロール時にスライドインする方)の表示状態。
export function getHeaderVisible(): boolean {
  return isFixedHeaderVisible;
}

// 画面上端がヘッダー(最上部 or 固定)に覆われているか。ActiveFilterBadge が
// ヘッダーと重ならない位置に退避するために使う。
export function getHeaderAreaOccupied(): boolean {
  return isHeaderAreaOccupied;
}

// ページ上端付近にいるか。SiteHeader がヘッダー入れ替え時のアニメーション
// 抑制に使う。
export function getNearPageTop(): boolean {
  return isNearTop;
}
