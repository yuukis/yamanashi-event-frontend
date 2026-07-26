import type { EventWithGroup } from '../types/events';

function buildJstDayScopedSearchPrefix(start_date: Date): string {
  const jst_date_formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const jst_date_parts = jst_date_formatter.formatToParts(start_date);
  const jst_date_part = (type: string) => jst_date_parts.find((part) => part.type === type)?.value;
  const start_date_str = `${jst_date_part('year')}-${jst_date_part('month')}-${jst_date_part('day')}`;
  const since_time = Math.floor(new Date(start_date_str + "T00:00:00+09:00").getTime() / 1000);
  const until_time = Math.floor(new Date(start_date_str + "T23:59:59+09:00").getTime() / 1000);
  return "since_time:" + since_time + " until_time:" + until_time + " ";
}

export function buildEventXSearchUrl(event: EventWithGroup, start_date: Date, has_ended: boolean): string {
  const x_search_keywords_array = [];
  if (event.hash_tag) {
    x_search_keywords_array.push("#" + event.hash_tag);
  }
  x_search_keywords_array.push("\"" + event.title + "\"");
  if (event.group_name) {
    x_search_keywords_array.push("\"" + event.group_name + "\"");
  }
  const x_search_since_until = has_ended ? buildJstDayScopedSearchPrefix(start_date) : "";
  const x_search_query = x_search_since_until + x_search_keywords_array.join(" OR ");
  return "https://x.com/search?q=" + encodeURIComponent(x_search_query) + "&f=live";
}

export function getEventXSearchLabel(has_ended: boolean): string {
  return has_ended
    ? "イベント当日の X(Twitter) 投稿を検索"
    : "イベントに関する X(Twitter) 投稿を検索";
}
