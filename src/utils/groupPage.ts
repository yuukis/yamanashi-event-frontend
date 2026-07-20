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

// APIから来るURLをそのまま<a href target="_blank">に流すため、
// javascript: 等の危険なスキームを弾く。http/https以外は表示しない。
function isHttpUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
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
  variant: 'solid' | 'outline';
  fontWeight: 'normal' | 'bold';
};

export function buildGroupExternalLinks(group: ApiGroupDetail): GroupExternalLink[] {
  const links: GroupExternalLink[] = [];
  if (group.url) {
    links.push({ id: 'group-url', label: 'イベントに参加する', url: group.url, variant: 'solid', fontWeight: 'bold' });
  }
  if (group.website_url) {
    links.push({ id: 'website', label: '公式サイト', url: group.website_url, variant: 'outline', fontWeight: 'normal' });
  }
  const xUrl = buildXProfileUrl(group.x_username);
  if (xUrl) {
    links.push({ id: 'x', label: 'X(Twitter)', url: xUrl, variant: 'outline', fontWeight: 'normal' });
  }
  if (group.facebook_url) {
    links.push({ id: 'facebook', label: 'Facebook', url: group.facebook_url, variant: 'outline', fontWeight: 'normal' });
  }
  if (group.archive_url) {
    links.push({
      id: 'archive',
      label: 'アーカイブ元',
      url: group.archive_url,
      variant: 'outline',
      fontWeight: 'normal',
    });
  }
  return links.filter((link) => isHttpUrl(link.url));
}
