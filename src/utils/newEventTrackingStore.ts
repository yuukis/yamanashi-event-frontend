import { EMPTY_TRACKING_DATA, isValidTrackingData, type NewEventTrackingData } from './newEventTracking';

export const NEW_EVENT_TRACKING_STORAGE_KEY = 'yamanashi-event-hub.new-event-tracking.v1';

let current: NewEventTrackingData = EMPTY_TRACKING_DATA;
let hasLoaded = false;
const listeners = new Set<() => void>();

export function isLocalStorageAvailable(): boolean {
  try {
    const testKey = '__yamanashi_event_hub_storage_test__';
    window.localStorage.setItem(testKey, '1');
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

function loadFromStorage(): NewEventTrackingData {
  try {
    const raw = window.localStorage.getItem(NEW_EVENT_TRACKING_STORAGE_KEY);
    if (!raw) {
      return EMPTY_TRACKING_DATA;
    }
    const parsed = JSON.parse(raw);
    return isValidTrackingData(parsed) ? parsed : EMPTY_TRACKING_DATA;
  } catch {
    return EMPTY_TRACKING_DATA;
  }
}

function saveToStorage(data: NewEventTrackingData): void {
  try {
    window.localStorage.setItem(NEW_EVENT_TRACKING_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // 容量超過・プライベートブラウジング等での書き込み失敗は無視する
    // (メモリ上のcurrentはこのセッション内では引き続き正しい値を保つ)
  }
}

export function getTrackingDataSnapshot(): NewEventTrackingData {
  if (!hasLoaded) {
    current = loadFromStorage();
    hasLoaded = true;
  }
  return current;
}

export function subscribeTrackingData(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function updateTrackingData(
  updater: (previous: NewEventTrackingData) => NewEventTrackingData,
): NewEventTrackingData {
  current = updater(getTrackingDataSnapshot());
  saveToStorage(current);
  listeners.forEach((listener) => listener());
  return current;
}
