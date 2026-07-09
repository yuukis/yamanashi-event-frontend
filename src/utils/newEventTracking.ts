export type TrackedEventRecord = {
  firstSeenAt: string;
};

export type NewEventTrackingData = {
  version: 1;
  records: Record<string, TrackedEventRecord>;
  dismissedUids: string[];
  acknowledgedDotUids: string[];
};

export const EMPTY_TRACKING_DATA: NewEventTrackingData = {
  version: 1,
  records: {},
  dismissedUids: [],
  acknowledgedDotUids: [],
};

export function isValidTrackingData(value: unknown): value is NewEventTrackingData {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return candidate.version === 1
    && typeof candidate.records === 'object' && candidate.records !== null
    && Array.isArray(candidate.dismissedUids)
    && Array.isArray(candidate.acknowledgedDotUids);
}

export type NewEventCandidate = {
  uid: string;
  started_at: string;
  updated_at: string;
};

const NEW_EVENT_FIRST_SEEN_WINDOW_MS = 3 * 24 * 60 * 60 * 1000;
const NEW_EVENT_UPDATED_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export function isNotYetStarted(event: { started_at: string }, now: Date): boolean {
  return new Date(event.started_at).getTime() > now.getTime();
}

// candidateEvents に存在するuidのみを残す(存在しないuidのrecord/dismissed/
// acknowledgedDotは破棄する)ことでストアの肥大化を防ぐ。既存recordの
// firstSeenAtは保持し、新規に観測したuidにはnowをセットする。
export function mergeTrackingData(
  previous: NewEventTrackingData,
  candidateEvents: NewEventCandidate[],
  now: Date,
): NewEventTrackingData {
  const candidateUids = new Set(candidateEvents.map((event) => event.uid));
  const records: Record<string, TrackedEventRecord> = {};

  for (const event of candidateEvents) {
    records[event.uid] = previous.records[event.uid] ?? { firstSeenAt: now.toISOString() };
  }

  return {
    version: 1,
    records,
    dismissedUids: previous.dismissedUids.filter((uid) => candidateUids.has(uid)),
    acknowledgedDotUids: previous.acknowledgedDotUids.filter((uid) => candidateUids.has(uid)),
  };
}

// 新着の3条件(未開始/初観測から3日以内/updated_atが7日以内)をすべて
// 満たし、かつクリアされていないuidの集合を返す。
export function selectNewEventUids(
  data: NewEventTrackingData,
  events: NewEventCandidate[],
  now: Date,
): Set<string> {
  const dismissed = new Set(data.dismissedUids);
  const result = new Set<string>();

  for (const event of events) {
    if (dismissed.has(event.uid)) {
      continue;
    }
    if (!isNotYetStarted(event, now)) {
      continue;
    }
    const record = data.records[event.uid];
    if (!record) {
      continue;
    }
    const sinceFirstSeenMs = now.getTime() - new Date(record.firstSeenAt).getTime();
    if (sinceFirstSeenMs > NEW_EVENT_FIRST_SEEN_WINDOW_MS) {
      continue;
    }
    const sinceUpdatedMs = now.getTime() - new Date(event.updated_at).getTime();
    if (sinceUpdatedMs > NEW_EVENT_UPDATED_WINDOW_MS) {
      continue;
    }
    result.add(event.uid);
  }

  return result;
}

export function isEventNew(data: NewEventTrackingData, event: NewEventCandidate, now: Date): boolean {
  return selectNewEventUids(data, [event], now).has(event.uid);
}

export function dismissNewEvents(data: NewEventTrackingData, uids: string[]): NewEventTrackingData {
  return { ...data, dismissedUids: [...new Set([...data.dismissedUids, ...uids])] };
}

export function acknowledgeNewEventDot(data: NewEventTrackingData, currentNewUids: string[]): NewEventTrackingData {
  return { ...data, acknowledgedDotUids: [...new Set([...data.acknowledgedDotUids, ...currentNewUids])] };
}

export function hasUnacknowledgedNewEvent(data: NewEventTrackingData, currentNewUids: Iterable<string>): boolean {
  const acknowledged = new Set(data.acknowledgedDotUids);
  for (const uid of currentNewUids) {
    if (!acknowledged.has(uid)) {
      return true;
    }
  }
  return false;
}
