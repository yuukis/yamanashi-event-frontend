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

function isValidRecord(value: unknown): value is TrackedEventRecord {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const firstSeenAt = (value as Record<string, unknown>).firstSeenAt;
  return typeof firstSeenAt === 'string' && !Number.isNaN(new Date(firstSeenAt).getTime());
}

export function isValidTrackingData(value: unknown): value is NewEventTrackingData {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return candidate.version === 1
    && typeof candidate.records === 'object' && candidate.records !== null && !Array.isArray(candidate.records)
    && Object.values(candidate.records).every(isValidRecord)
    && Array.isArray(candidate.dismissedUids) && candidate.dismissedUids.every((uid) => typeof uid === 'string')
    && Array.isArray(candidate.acknowledgedDotUids) && candidate.acknowledgedDotUids.every((uid) => typeof uid === 'string');
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

// 開始済みのイベントはselectNewEventUidsの条件1により二度と新着に
// ならないため、open_statusの更新を待たずここでプルーニングする。
export function mergeTrackingData(
  previous: NewEventTrackingData,
  candidateEvents: NewEventCandidate[],
  now: Date,
): NewEventTrackingData {
  const keepableEvents = candidateEvents.filter((event) => isNotYetStarted(event, now));
  const candidateUids = new Set(keepableEvents.map((event) => event.uid));
  const records: Record<string, TrackedEventRecord> = {};

  for (const event of keepableEvents) {
    records[event.uid] = previous.records[event.uid] ?? { firstSeenAt: now.toISOString() };
  }

  return {
    version: 1,
    records,
    dismissedUids: previous.dismissedUids.filter((uid) => candidateUids.has(uid)),
    acknowledgedDotUids: previous.acknowledgedDotUids.filter((uid) => candidateUids.has(uid)),
  };
}

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

export function selectUnacknowledgedNewEventUids(
  data: NewEventTrackingData,
  currentNewUids: Iterable<string>,
): Set<string> {
  const acknowledged = new Set(data.acknowledgedDotUids);
  const result = new Set<string>();
  for (const uid of currentNewUids) {
    if (!acknowledged.has(uid)) {
      result.add(uid);
    }
  }
  return result;
}
