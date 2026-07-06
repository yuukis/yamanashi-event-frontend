type Listener = () => void;

let isHeaderVisible = true;
let lastScrollY = 0;
let keepVisibleUntil = 0;
let holdStateUntil = 0;
const listeners = new Set<Listener>();
let isStarted = false;

function setVisible(value: boolean) {
  if (isHeaderVisible !== value) {
    isHeaderVisible = value;
    listeners.forEach((listener) => listener());
  }
}

function handleScroll() {
  const currentScrollY = window.scrollY;
  const scrollDifference = currentScrollY - lastScrollY;
  lastScrollY = currentScrollY;

  if (performance.now() < holdStateUntil) {
    return;
  }

  if (currentScrollY < 8) {
    setVisible(true);
  } else if (performance.now() < keepVisibleUntil) {
    setVisible(true);
  } else if (scrollDifference > 6) {
    setVisible(false);
  } else if (scrollDifference < -6) {
    setVisible(true);
  }
}

function handleShow() {
  keepVisibleUntil = performance.now() + 700;
  setVisible(true);
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

export function getHeaderVisible(): boolean {
  return isHeaderVisible;
}
