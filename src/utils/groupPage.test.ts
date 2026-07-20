import { describe, it, expect } from 'vitest';
import { buildGroupPagePath, buildGroupPageUrl, buildGroupFeedUrl, buildGroupFeedTitle, buildXProfileUrl, buildGroupExternalLinks } from './groupPage';
import { SITE_URL } from './site';
import { makeGroupDetail } from '../test/fixtures';

describe('buildGroupPagePath / buildGroupPageUrl', () => {
  it('builds the community page path from the group key', () => {
    expect(buildGroupPagePath('aibase')).toBe('/groups/aibase');
    expect(buildGroupPageUrl('aibase')).toBe(`${SITE_URL}/groups/aibase`);
  });

  it('URL-encodes unsafe characters in the group key', () => {
    expect(buildGroupPagePath('a b/c')).toBe('/groups/a%20b%2Fc');
  });
});

describe('buildGroupFeedUrl / buildGroupFeedTitle', () => {
  it('builds the community feed URL from the group key', () => {
    expect(buildGroupFeedUrl('aibase')).toBe('https://feed.event.yamanashi.dev/aibase/feed.xml');
  });

  it('URL-encodes unsafe characters in the group key', () => {
    expect(buildGroupFeedUrl('a b')).toBe('https://feed.event.yamanashi.dev/a%20b/feed.xml');
  });

  it('builds the feed title matching the feed channel naming', () => {
    expect(buildGroupFeedTitle('AI BASE')).toBe('AI BASE - 新着・更新イベント');
  });
});

describe('buildXProfileUrl', () => {
  it('builds a profile URL from a username', () => {
    expect(buildXProfileUrl('ymns_tech_event')).toBe('https://x.com/ymns_tech_event');
  });

  it('strips a leading @ from the username', () => {
    expect(buildXProfileUrl('@ymns_tech_event')).toBe('https://x.com/ymns_tech_event');
  });

  it('returns null for empty or missing usernames', () => {
    expect(buildXProfileUrl('')).toBeNull();
    expect(buildXProfileUrl('  ')).toBeNull();
    expect(buildXProfileUrl(null)).toBeNull();
    expect(buildXProfileUrl(undefined)).toBeNull();
  });
});

describe('buildGroupExternalLinks', () => {
  it('collects every available link with labels', () => {
    const group = makeGroupDetail({
      url: 'https://example.connpass.com/',
      website_url: 'https://example.com/',
      x_username: 'example',
      facebook_url: 'https://www.facebook.com/example',
      archive_url: 'https://archive.example.com/',
    });

    expect(buildGroupExternalLinks(group)).toEqual([
      { id: 'group-url', label: 'イベントに参加する', url: 'https://example.connpass.com/', variant: 'solid', fontWeight: 'bold' },
      { id: 'website', label: '公式サイト', url: 'https://example.com/', variant: 'outline', fontWeight: 'normal' },
      { id: 'x', label: 'X(Twitter)', url: 'https://x.com/example', variant: 'outline', fontWeight: 'normal' },
      { id: 'facebook', label: 'Facebook', url: 'https://www.facebook.com/example', variant: 'outline', fontWeight: 'normal' },
      { id: 'archive', label: 'アーカイブ元', url: 'https://archive.example.com/', variant: 'outline', fontWeight: 'normal' },
    ]);
  });

  it('omits missing links and empty usernames', () => {
    const group = makeGroupDetail({ url: null, x_username: '' });

    expect(buildGroupExternalLinks(group)).toEqual([]);
  });

  it('drops links with a non-http(s) scheme, so API data can never render as an executable link', () => {
    const group = makeGroupDetail({
      url: 'javascript:alert(1)',
      website_url: 'data:text/html,<script>alert(1)</script>',
      facebook_url: 'https://www.facebook.com/example',
      archive_url: 'not a url at all',
    });

    expect(buildGroupExternalLinks(group)).toEqual([
      { id: 'facebook', label: 'Facebook', url: 'https://www.facebook.com/example', variant: 'outline', fontWeight: 'normal' },
    ]);
  });
});
