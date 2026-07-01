import type { ApiEvent } from '../types/events';

export function formatEventDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function getEventAnchorId(event: ApiEvent): string {
  return `event-${event.uid.replace(/[^a-zA-Z0-9_-]/g, '-')}`;
}
