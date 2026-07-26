import type { EventWithGroup } from '../types/events';

function buildJstDayScopedSearchPrefix(startDate: Date): string {
  const jstDateFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const jstDateParts = jstDateFormatter.formatToParts(startDate);
  const jstDatePart = (type: string) => jstDateParts.find((part) => part.type === type)?.value;
  const startDateStr = `${jstDatePart('year')}-${jstDatePart('month')}-${jstDatePart('day')}`;
  const sinceTime = Math.floor(new Date(`${startDateStr}T00:00:00+09:00`).getTime() / 1000);
  const untilTime = Math.floor(new Date(`${startDateStr}T23:59:59+09:00`).getTime() / 1000);
  return `since_time:${sinceTime} until_time:${untilTime} `;
}

export function buildEventXSearchUrl(event: EventWithGroup, startDate: Date, hasEnded: boolean): string {
  const searchKeywords = [];
  if (event.hash_tag) {
    searchKeywords.push(`#${event.hash_tag}`);
  }
  searchKeywords.push(`"${event.title}"`);
  if (event.group_name) {
    searchKeywords.push(`"${event.group_name}"`);
  }
  const sinceUntilPrefix = hasEnded ? buildJstDayScopedSearchPrefix(startDate) : "";
  const searchQuery = sinceUntilPrefix + searchKeywords.join(" OR ");
  return `https://x.com/search?q=${encodeURIComponent(searchQuery)}&f=live`;
}

export function getEventXSearchLabel(hasEnded: boolean): string {
  return hasEnded
    ? "イベント当日の X(Twitter) 投稿を検索"
    : "イベントに関する X(Twitter) 投稿を検索";
}
