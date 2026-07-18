import { EMPTY_MARKED_EVENTS_DATA, isValidMarkedEventsData, type MarkedEventsData } from './markedEvents';
import { isLocalStorageAvailable } from './newEventTrackingStore';

export const MARKED_EVENTS_STORAGE_KEY = 'yamanashi-event-hub.marked-events.v1';

export { isLocalStorageAvailable };

let current: MarkedEventsData = EMPTY_MARKED_EVENTS_DATA;
let hasLoaded = false;
const listeners = new Set<() => void>();

function loadFromStorage(): MarkedEventsData {
  try {
    const raw = window.localStorage.getItem(MARKED_EVENTS_STORAGE_KEY);
    if (!raw) {
      return EMPTY_MARKED_EVENTS_DATA;
    }
    const parsed = JSON.parse(raw);
    return isValidMarkedEventsData(parsed) ? parsed : EMPTY_MARKED_EVENTS_DATA;
  } catch {
    return EMPTY_MARKED_EVENTS_DATA;
  }
}

function saveToStorage(data: MarkedEventsData): void {
  try {
    window.localStorage.setItem(MARKED_EVENTS_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // 容量超過・プライベートブラウジング等での書き込み失敗は無視する
    // (メモリ上のcurrentはこのセッション内では引き続き正しい値を保つ)
  }
}

export function getMarkedEventsSnapshot(): MarkedEventsData {
  if (!hasLoaded) {
    current = loadFromStorage();
    hasLoaded = true;
  }
  return current;
}

export function subscribeMarkedEvents(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function updateMarkedEventsData(
  updater: (previous: MarkedEventsData) => MarkedEventsData,
): MarkedEventsData {
  current = updater(getMarkedEventsSnapshot());
  saveToStorage(current);
  listeners.forEach((listener) => listener());
  return current;
}
