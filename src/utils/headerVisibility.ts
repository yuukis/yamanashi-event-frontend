type Listener = () => void;

// SiteHeader の実高さ(ロゴ行 + 下線3本分)。ActiveFilterBadge がヘッダー
// 直下に位置合わせする際にも同じ値を使うため、両方から参照できるように
// ここで定義する。
export const HEADER_HEIGHT = { base: 'calc(3rem + 7px)', md: 'calc(4rem + 7px)' };

// 最上部ヘッダー(通常フロー)がまだ画面内に残っているとみなすスクロール量
// (px)。HEADER_HEIGHT の最大値(md: 4rem + 7px = 71px)を丸めた値。
const STATIC_HEADER_RANGE = 72;

// 「ページ上端付近」とみなすスクロール量(px)。この範囲では最上部ヘッダーと
// 固定ヘッダーの位置ずれがこの値未満に収まる。
const NEAR_TOP_RANGE = 8;

let isFixedHeaderVisible = false;
let isHeaderAreaOccupied = true;
let isNearTop = true;
let lastScrollY = 0;
let keepVisibleUntil = 0;
let holdStateUntil = 0;
const listeners = new Set<Listener>();
let isStarted = false;

function snapshot() {
  return `${isFixedHeaderVisible},${isHeaderAreaOccupied},${isNearTop}`;
}

function notifyIfChanged(previousSnapshot: string) {
  if (snapshot() !== previousSnapshot) {
    listeners.forEach((listener) => listener());
  }
}

function updateDerivedStates() {
  isHeaderAreaOccupied = isFixedHeaderVisible || window.scrollY < STATIC_HEADER_RANGE;
  isNearTop = window.scrollY < NEAR_TOP_RANGE;
}

function handleScroll() {
  const previousSnapshot = snapshot();
  const currentScrollY = window.scrollY;
  const scrollDifference = currentScrollY - lastScrollY;
  lastScrollY = currentScrollY;

  if (performance.now() >= holdStateUntil) {
    if (currentScrollY < NEAR_TOP_RANGE) {
      // 上端付近は最上部ヘッダー(通常フロー)に役割を譲る
      isFixedHeaderVisible = false;
    } else if (performance.now() < keepVisibleUntil) {
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
