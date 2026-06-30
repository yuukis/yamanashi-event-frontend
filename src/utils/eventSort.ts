import type { ApiEvent } from '../types/events';

export function sortByStartedAtAsc(a: ApiEvent, b: ApiEvent) {
  return new Date(a.started_at).getTime() - new Date(b.started_at).getTime();
}

export function sortByStartedAtDesc(a: ApiEvent, b: ApiEvent) {
  return new Date(b.started_at).getTime() - new Date(a.started_at).getTime();
}
