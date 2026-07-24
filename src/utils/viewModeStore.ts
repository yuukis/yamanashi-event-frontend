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

export function setViewMode(value: ViewMode): void {
  current = value;
  hasLoaded = true;
  saveToStorage(value);
  listeners.forEach((listener) => listener());
}
