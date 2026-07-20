import type { ApiGroup, ApiGroupDetail, EventWithGroup } from '../types/events';
import { SITE_URL } from './site';
import { htmlToText } from './htmlText';
import { buildGroupPageUrl, buildXProfileUrl } from './groupPage';

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
  const image = event.image_url || event.group_image_url;
  if (image) {
    jsonLd.image = image;
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

export function buildGroupPageJsonLd(group: ApiGroupDetail, events: EventWithGroup[]): Record<string, unknown> {
  const pageUrl = buildGroupPageUrl(group.key);

  const organization: Record<string, unknown> = {
    '@type': 'Organization',
    name: group.title,
    url: group.url || pageUrl,
  };
  const descriptionText = group.description ? htmlToText(group.description) : '';
  if (descriptionText) {
    organization.description = descriptionText;
  }
  if (group.image_url) {
    organization.logo = group.image_url;
  }
  const sameAs = [group.website_url, buildXProfileUrl(group.x_username), group.facebook_url]
    .filter((url): url is string => Boolean(url));
  if (sameAs.length > 0) {
    organization.sameAs = sameAs;
  }

  return {
    '@context': 'https://schema.org',
    '@graph': [
      organization,
      {
        '@type': 'ItemList',
        url: pageUrl,
        numberOfItems: events.length,
        itemListElement: events.map((event, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          item: buildEventJsonLd(event),
        })),
      },
    ],
  };
}

export function buildGroupsIndexJsonLd(groups: ApiGroup[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    url: `${SITE_URL}/groups`,
    numberOfItems: groups.length,
    itemListElement: groups.map((group, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Organization',
        name: group.title,
        url: buildGroupPageUrl(group.key),
      },
    })),
  };
}

export function buildBreadcrumbJsonLd(items: { name: string; url: string }[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
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
