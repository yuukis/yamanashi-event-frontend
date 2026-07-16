import type { EventWithGroup } from '../types/events';

export const SITE_URL = 'https://hub.yamanashi.dev';

const CANCELLED_STATUS = 'https://schema.org/EventCancelled';
const SCHEDULED_STATUS = 'https://schema.org/EventScheduled';

const ONLINE_PLACE_LABEL = 'オンライン';

export function buildEventJsonLd(event: EventWithGroup): Record<string, unknown> {
  const place = event.place?.trim() ?? '';
  const address = event.address?.trim() ?? '';
  const isOnline = place === ONLINE_PLACE_LABEL || (!place && !address);

  const location = isOnline
    ? {
        '@type': 'VirtualLocation',
        url: event.event_url,
      }
    : {
        '@type': 'Place',
        name: place || address || undefined,
        address: address || undefined,
      };

  const jsonLd: Record<string, unknown> = {
    '@type': 'Event',
    name: event.title,
    startDate: event.started_at,
    endDate: event.ended_at,
    eventStatus: event.open_status === 'cancelled' ? CANCELLED_STATUS : SCHEDULED_STATUS,
    eventAttendanceMode: isOnline
      ? 'https://schema.org/OnlineEventAttendanceMode'
      : 'https://schema.org/OfflineEventAttendanceMode',
    location,
    url: event.event_url,
  };

  if (event.catch) {
    jsonLd.description = event.catch;
  }
  if (event.group_name) {
    jsonLd.organizer = {
      '@type': 'Organization',
      name: event.group_name,
      url: event.group_url || undefined,
    };
  }

  return jsonLd;
}

export function buildEventListJsonLd(events: EventWithGroup[], listUrl: string): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    url: listUrl,
    numberOfItems: events.length,
    itemListElement: events.map((event, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: buildEventJsonLd(event),
    })),
  };
}

export function buildYearArchiveJsonLd(years: number[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    url: `${SITE_URL}/events`,
    numberOfItems: years.length,
    itemListElement: years.map((year, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: `${SITE_URL}/events/${year}`,
      name: `${year}年 開催イベント`,
    })),
  };
}
