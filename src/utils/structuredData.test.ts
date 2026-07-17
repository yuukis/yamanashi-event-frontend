import { describe, it, expect } from 'vitest';
import { buildEventJsonLd, buildEventListJsonLd, buildYearArchiveJsonLd } from './structuredData';
import { SITE_URL } from './site';
import { makeEvent } from '../test/fixtures';

describe('buildEventJsonLd', () => {
  it('builds an offline Event with a Place location when address is present', () => {
    const event = makeEvent({
      title: 'テスト勉強会',
      place: '甲府商工会議所',
      address: '山梨県甲府市丸の内1-1-1',
      group_name: 'テストコミュニティ',
      group_url: 'https://example.connpass.com/',
    });

    const jsonLd = buildEventJsonLd(event);

    expect(jsonLd).toMatchObject({
      '@type': 'Event',
      name: 'テスト勉強会',
      startDate: event.started_at,
      endDate: event.ended_at,
      eventStatus: 'https://schema.org/EventScheduled',
      eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
      location: {
        '@type': 'Place',
        name: '甲府商工会議所',
        address: '山梨県甲府市丸の内1-1-1',
      },
      url: event.event_url,
      organizer: {
        '@type': 'Organization',
        name: 'テストコミュニティ',
        url: 'https://example.connpass.com/',
      },
    });
  });

  it('builds an online Event with a VirtualLocation when neither place nor address is present', () => {
    const event = makeEvent({ place: '', address: '' });

    const jsonLd = buildEventJsonLd(event);

    expect(jsonLd.eventAttendanceMode).toBe('https://schema.org/OnlineEventAttendanceMode');
    expect(jsonLd.location).toEqual({ '@type': 'VirtualLocation', url: event.event_url });
  });

  it('treats connpass\'s "オンライン" place label as an online event, not a physical Place', () => {
    const event = makeEvent({ place: 'オンライン', address: '' });

    const jsonLd = buildEventJsonLd(event);

    expect(jsonLd.eventAttendanceMode).toBe('https://schema.org/OnlineEventAttendanceMode');
    expect(jsonLd.location).toEqual({ '@type': 'VirtualLocation', url: event.event_url });
  });

  it('marks cancelled events with EventCancelled status', () => {
    const event = makeEvent({ open_status: 'cancelled' });

    expect(buildEventJsonLd(event).eventStatus).toBe('https://schema.org/EventCancelled');
  });

  it('omits organizer when group_name is absent', () => {
    const event = makeEvent({ group_name: undefined });

    expect(buildEventJsonLd(event).organizer).toBeUndefined();
  });

  it('prefers the event image over the group image', () => {
    const event = makeEvent({
      image_url: 'https://media.connpass.com/thumbs/aa/bb/event.png',
      group_image_url: 'https://example.com/group.png',
    });

    expect(buildEventJsonLd(event).image).toBe('https://media.connpass.com/thumbs/aa/bb/event.png');
  });

  it('falls back to the group image when the event has no image', () => {
    const event = makeEvent({ image_url: undefined, group_image_url: 'https://example.com/group.png' });

    expect(buildEventJsonLd(event).image).toBe('https://example.com/group.png');
  });

  it('omits image when neither the event nor the group has one', () => {
    const event = makeEvent({ image_url: undefined, group_image_url: undefined });

    expect(buildEventJsonLd(event).image).toBeUndefined();
  });
});

describe('buildEventListJsonLd', () => {
  it('wraps events into a positioned ItemList referencing the given URL', () => {
    const events = [makeEvent({ uid: 'a' }), makeEvent({ uid: 'b' })];

    const jsonLd = buildEventListJsonLd(events, `${SITE_URL}/events/2026`);

    expect(jsonLd).toMatchObject({
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      url: `${SITE_URL}/events/2026`,
      numberOfItems: 2,
    });
    const itemListElement = jsonLd.itemListElement as Array<{ position: number; item: { '@type': string } }>;
    expect(itemListElement[0].position).toBe(1);
    expect(itemListElement[1].position).toBe(2);
    expect(itemListElement[0].item['@type']).toBe('Event');
  });
});

describe('buildYearArchiveJsonLd', () => {
  it('lists each year as a ListItem pointing to its /events/:year page', () => {
    const jsonLd = buildYearArchiveJsonLd([2024, 2025]);

    expect(jsonLd.itemListElement).toEqual([
      { '@type': 'ListItem', position: 1, url: `${SITE_URL}/events/2024`, name: '2024年 開催イベント' },
      { '@type': 'ListItem', position: 2, url: `${SITE_URL}/events/2025`, name: '2025年 開催イベント' },
    ]);
  });
});
