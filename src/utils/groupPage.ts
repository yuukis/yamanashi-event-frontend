import { SITE_URL, FEED_ORIGIN } from './site';
import type { ApiGroupDetail } from '../types/events';

export function buildGroupPagePath(groupKey: string): string {
  return `/groups/${encodeURIComponent(groupKey)}`;
}

export function buildGroupPageUrl(groupKey: string): string {
  return `${SITE_URL}${buildGroupPagePath(groupKey)}`;
}

export function buildGroupFeedUrl(groupKey: string): string {
  return `${FEED_ORIGIN}/${encodeURIComponent(groupKey)}/feed.xml`;
}

export function buildGroupFeedTitle(groupTitle: string): string {
  return `${groupTitle} - 新着・更新イベント`;
}

export function buildXProfileUrl(username?: string | null): string | null {
  const trimmed = username?.trim().replace(/^@/, '');
  if (!trimmed) {
    return null;
  }
  return `https://x.com/${encodeURIComponent(trimmed)}`;
}

export type GroupExternalLink = {
  id: string;
  label: string;
  url: string;
};

export function buildGroupExternalLinks(group: ApiGroupDetail): GroupExternalLink[] {
  const links: GroupExternalLink[] = [];
  if (group.url) {
    links.push({ id: 'group-url', label: 'イベントページ', url: group.url });
  }
  if (group.website_url) {
    links.push({ id: 'website', label: 'Webサイト', url: group.website_url });
  }
  const xUrl = buildXProfileUrl(group.x_username);
  if (xUrl) {
    links.push({ id: 'x', label: 'X(Twitter)', url: xUrl });
  }
  if (group.facebook_url) {
    links.push({ id: 'facebook', label: 'Facebook', url: group.facebook_url });
  }
  if (group.archive_url) {
    links.push({ id: 'archive', label: group.archive_source ? `アーカイブ元(${group.archive_source})` : 'アーカイブ元', url: group.archive_url });
  }
  return links;
}
