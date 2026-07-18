export type MarkedEventRecord = {
  markedAt: string;
};

export type MarkedEventsData = {
  version: 1;
  records: Record<string, MarkedEventRecord>;
};

export const EMPTY_MARKED_EVENTS_DATA: MarkedEventsData = {
  version: 1,
  records: {},
};

function isValidRecord(value: unknown): value is MarkedEventRecord {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const markedAt = (value as Record<string, unknown>).markedAt;
  return typeof markedAt === 'string' && !Number.isNaN(new Date(markedAt).getTime());
}

export function isValidMarkedEventsData(value: unknown): value is MarkedEventsData {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return candidate.version === 1
    && typeof candidate.records === 'object' && candidate.records !== null && !Array.isArray(candidate.records)
    && Object.values(candidate.records).every(isValidRecord);
}

export function isEventMarked(data: MarkedEventsData, uid: string): boolean {
  return uid in data.records;
}

export function markEvent(data: MarkedEventsData, uid: string, now: Date): MarkedEventsData {
  return { ...data, records: { ...data.records, [uid]: { markedAt: now.toISOString() } } };
}

export function unmarkEvent(data: MarkedEventsData, uid: string): MarkedEventsData {
  const records = { ...data.records };
  delete records[uid];
  return { ...data, records };
}
