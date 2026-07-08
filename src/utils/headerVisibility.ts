type Listener = () => void;

// SiteHeader の実高さ(ロゴ行 + 下線3本分)。ActiveFilterBadge がヘッダー
// 直下に位置合わせする際にも同じ値を使うため、両方から参照できるように
// ここで定義する。
export const HEADER_HEIGHT = { base: 'calc(3rem + 7px)', md: 'calc(4rem + 7px)' };

// 最上部ヘッダー(通常フロー)がまだ画面内に残っているとみなすスクロール量
// (px)。HEADER_HEIGHT の最大値(md: 4rem + 7px = 71px)を丸めた値。
const STATIC_HEADER_RANGE = 72;

// ヘッダーは2枚構成: ページ最上部の通常フローのヘッダー(ページと一緒に
// スクロールして消える)と、上スクロール時にスライドインする固定ヘッダー。
// isFixedHeaderVisible は後者の表示状態。ページ上端付近では最上部ヘッダーに
// 役割を譲るため、固定ヘッダーは表示しない。
let isFixedHeaderVisible = false;
// 画面上端がヘッダー(最上部 or 固定)に覆われているか。ActiveFilterBadge が
// ヘッダーと重ならない位置に退避するための状態。
let isHeaderAreaOccupied = true;
let lastScrollY = 0;
let keepVisibleUntil = 0;
let holdStateUntil = 0;
const listeners = new Set<Listener>();
let isStarted = false;

function notifyIfChanged(previousVisible: boolean, previousOccupied: boolean) {
  if (isFixedHeaderVisible !== previousVisible || isHeaderAreaOccupied !== previousOccupied) {
    listeners.forEach((listener) => listener());
  }
}

function updateOccupied() {
  isHeaderAreaOccupied = isFixedHeaderVisible || window.scrollY < STATIC_HEADER_RANGE;
}

function handleScroll() {
  const previousVisible = isFixedHeaderVisible;
  const previousOccupied = isHeaderAreaOccupied;
  const currentScrollY = window.scrollY;
  const scrollDifference = currentScrollY - lastScrollY;
  lastScrollY = currentScrollY;

  if (performance.now() >= holdStateUntil) {
    if (currentScrollY < 8) {
      // 上端付近では最上部ヘッダーがほぼ同じ位置にあるため、固定ヘッダーは
      // 隠して役割を引き継ぐ。
      isFixedHeaderVisible = false;
    } else if (performance.now() < keepVisibleUntil) {
      isFixedHeaderVisible = true;
    } else if (scrollDifference > 6) {
      isFixedHeaderVisible = false;
    } else if (scrollDifference < -6) {
      isFixedHeaderVisible = true;
    }
  }

  updateOccupied();
  notifyIfChanged(previousVisible, previousOccupied);
}

function handleShow() {
  const previousVisible = isFixedHeaderVisible;
  const previousOccupied = isHeaderAreaOccupied;
  keepVisibleUntil = performance.now() + 700;
  isFixedHeaderVisible = true;
  updateOccupied();
  notifyIfChanged(previousVisible, previousOccupied);
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
  updateOccupied();
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

// 画面上端がヘッダーに覆われているか。固定ヘッダー表示中に加え、ページ上端
// 付近で最上部ヘッダーが画面内に残っている間も true になる。
export function getHeaderAreaOccupied(): boolean {
  return isHeaderAreaOccupied;
}
