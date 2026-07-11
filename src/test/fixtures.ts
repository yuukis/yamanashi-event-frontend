import type { ApiGroup, EventWithGroup } from '../types/events';

export function makeEvent(overrides: Partial<EventWithGroup> = {}): EventWithGroup {
  return {
    uid: 'event-1',
    title: 'Sample Event',
    event_url: 'https://example.com/event/1',
    started_at: '2026-01-10T10:00:00+09:00',
    ended_at: '2026-01-10T12:00:00+09:00',
    updated_at: '2026-01-01T00:00:00+09:00',
    open_status: 'open',
    ...overrides,
  };
}

export function makeGroup(overrides: Partial<ApiGroup> = {}): ApiGroup {
  return {
    key: 'group-1',
    title: 'Sample Group',
    ...overrides,
  };
}
