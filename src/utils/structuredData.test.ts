import { describe, it, expect } from 'vitest';
import { buildEventJsonLd, buildEventListJsonLd, buildGroupPageJsonLd, buildGroupsIndexJsonLd, buildYearArchiveJsonLd, buildBreadcrumbJsonLd } from './structuredData';
import { SITE_URL } from './site';
import { makeEvent, makeGroup, makeGroupDetail } from '../test/fixtures';

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

describe('buildGroupPageJsonLd', () => {
  it('builds a graph of an Organization and an event ItemList', () => {
    const group = makeGroupDetail({
      key: 'aibase',
      title: 'AI BASE',
      url: 'https://aibase.connpass.com/',
      description: '<p>『AI BASE』は生成AIに興味がある山梨のコミュニティです。</p>',
      image_url: 'https://example.com/logo.png',
      website_url: 'https://example.com/',
      x_username: 'aibase',
    });
    const events = [makeEvent({ uid: 'a' }), makeEvent({ uid: 'b' })];

    const jsonLd = buildGroupPageJsonLd(group, events);

    expect(jsonLd['@context']).toBe('https://schema.org');
    const [organization, itemList] = jsonLd['@graph'] as Array<Record<string, unknown>>;
    expect(organization).toEqual({
      '@type': 'Organization',
      name: 'AI BASE',
      url: 'https://aibase.connpass.com/',
      description: '『AI BASE』は生成AIに興味がある山梨のコミュニティです。',
      logo: 'https://example.com/logo.png',
      sameAs: ['https://example.com/', 'https://x.com/aibase'],
    });
    expect(itemList).toMatchObject({
      '@type': 'ItemList',
      url: `${SITE_URL}/groups/aibase`,
      numberOfItems: 2,
    });
    const itemListElement = itemList.itemListElement as Array<{ position: number; item: { '@type': string } }>;
    expect(itemListElement[0].position).toBe(1);
    expect(itemListElement[0].item['@type']).toBe('Event');
  });

  it('falls back to the community page URL and omits optional fields when data is sparse', () => {
    const group = makeGroupDetail({ key: 'g', title: 'G', url: null });

    const jsonLd = buildGroupPageJsonLd(group, []);

    const [organization] = jsonLd['@graph'] as Array<Record<string, unknown>>;
    expect(organization).toEqual({
      '@type': 'Organization',
      name: 'G',
      url: `${SITE_URL}/groups/g`,
    });
  });
});

describe('buildGroupsIndexJsonLd', () => {
  it('lists each group as a ListItem wrapping an Organization', () => {
    const groups = [makeGroup({ key: 'aibase', title: 'AI BASE' }), makeGroup({ key: 'kofurb', title: 'Kofu.rb' })];

    const jsonLd = buildGroupsIndexJsonLd(groups);

    expect(jsonLd).toMatchObject({
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      url: `${SITE_URL}/groups`,
      numberOfItems: 2,
    });
    expect(jsonLd.itemListElement).toEqual([
      { '@type': 'ListItem', position: 1, item: { '@type': 'Organization', name: 'AI BASE', url: `${SITE_URL}/groups/aibase` } },
      { '@type': 'ListItem', position: 2, item: { '@type': 'Organization', name: 'Kofu.rb', url: `${SITE_URL}/groups/kofurb` } },
    ]);
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

describe('buildBreadcrumbJsonLd', () => {
  it('lists each item as a positioned ListItem with its name and url', () => {
    const jsonLd = buildBreadcrumbJsonLd([
      { name: 'トップ', url: `${SITE_URL}/` },
      { name: 'コミュニティ一覧', url: `${SITE_URL}/groups` },
      { name: 'Kofu.rb', url: `${SITE_URL}/groups/kofurb` },
    ]);

    expect(jsonLd).toMatchObject({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
    });
    expect(jsonLd.itemListElement).toEqual([
      { '@type': 'ListItem', position: 1, name: 'トップ', item: `${SITE_URL}/` },
      { '@type': 'ListItem', position: 2, name: 'コミュニティ一覧', item: `${SITE_URL}/groups` },
      { '@type': 'ListItem', position: 3, name: 'Kofu.rb', item: `${SITE_URL}/groups/kofurb` },
    ]);
  });
});
