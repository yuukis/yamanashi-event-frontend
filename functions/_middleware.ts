import { enrichEventsWithGroups, isFutureEvent, isPastEvent, isVisibleEvent } from '../src/utils/eventGroups';
import { sortByStartedAtAsc, sortByStartedAtDesc } from '../src/utils/eventSort';
import { buildEventListJsonLd, buildGroupPageJsonLd, buildYearArchiveJsonLd } from '../src/utils/structuredData';
import { htmlToText, truncateText } from '../src/utils/htmlText';
import { sanitizeDescriptionHtml } from '../src/utils/descriptionHtml';
import { buildGroupExternalLinks, buildGroupPageUrl, buildGroupFeedUrl, buildGroupFeedTitle } from '../src/utils/groupPage';
import { SITE_URL } from '../src/utils/site';
import type { ApiEvent, ApiEventsSummary, ApiGroup, ApiGroupDetail, EventWithGroup } from '../src/types/events';

const EVENTS_API_URL = 'https://api.event.yamanashi.dev/events';
const GROUPS_API_URL = 'https://api.event.yamanashi.dev/groups';
const EVENTS_SUMMARY_API_URL = 'https://api.event.yamanashi.dev/summary/events';

const EVENTS_FIELDS = [
  'uid',
  'title',
  'catch',
  'hash_tag',
  'event_url',
  'started_at',
  'ended_at',
  'updated_at',
  'open_status',
  'owner_name',
  'place',
  'address',
  'group_key',
  'group_name',
  'group_url',
  'keywords',
  'image_url',
].join(',');

const GROUPS_FIELDS = ['key', 'title', 'image_url', 'archive_source', 'archive_url'].join(',');

const GROUP_DETAIL_FIELDS = [
  'key',
  'title',
  'sub_title',
  'url',
  'description',
  'image_url',
  'website_url',
  'x_username',
  'facebook_url',
  'member_users_count',
  'archive_source',
  'archive_url',
].join(',');

const BOT_UA_PATTERN =
  /bot|spider|crawl|slurp|facebookexternalhit|whatsapp|pinterest|embedly|quora link preview|outbrain|w3c_validator|google-inspectiontool|telegram/i;

const FETCH_TIMEOUT_MS = 5000;
const MAX_LIST_ITEMS = 300;
// list_group_events の per_page 上限(APIドキュメント準拠)。bot向け
// レンダリングはクリック操作ができないため、1回のフェッチで取得できる
// 最大件数を使い、ページングなしで完結させる。
const GROUP_EVENTS_FETCH_PER_PAGE = 200;

type ResolvedPage =
  | { kind: 'root' }
  | { kind: 'events-archive' }
  | { kind: 'events-year'; year: number }
  | { kind: 'group'; key: string };

type BotPageData = {
  title: string;
  description: string;
  ogUrl: string;
  ogImage?: string;
  jsonLd: unknown;
  bodyHtml: string;
  headExtraHtml?: string;
};

export const onRequest: PagesFunction = async (context) => {
  const { request, next } = context;

  if (request.method !== 'GET') {
    return next();
  }

  const ua = request.headers.get('user-agent') ?? '';
  if (!BOT_UA_PATTERN.test(ua)) {
    return next();
  }

  const url = new URL(request.url);
  const page = resolvePage(url.pathname);
  if (!page) {
    return next();
  }

  let data: BotPageData;
  try {
    data = await buildBotPageData(page);
  } catch (err) {
    console.error('prerender: failed to fetch data', err);
    return next();
  }

  const templatePath = page.kind === 'events-archive' ? '/events/' : '/';
  const templateResponse = await next(new URL(templatePath, url).toString());

  const contentType = templateResponse.headers.get('content-type') ?? '';
  if (!templateResponse.ok || !contentType.includes('text/html')) {
    return templateResponse;
  }

  return injectBotContent(templateResponse, data);
};

function resolvePage(pathname: string): ResolvedPage | null {
  if (pathname === '/') {
    return { kind: 'root' };
  }
  if (pathname === '/events' || pathname === '/events/') {
    return { kind: 'events-archive' };
  }
  const yearMatch = pathname.match(/^\/events\/(\d{4})\/?$/);
  if (yearMatch) {
    return { kind: 'events-year', year: Number(yearMatch[1]) };
  }
  const groupMatch = pathname.match(/^\/groups\/([^/]+)\/?$/);
  if (groupMatch) {
    try {
      return { kind: 'group', key: decodeURIComponent(groupMatch[1]) };
    } catch {
      return null;
    }
  }
  return null;
}

async function buildBotPageData(page: ResolvedPage): Promise<BotPageData> {
  switch (page.kind) {
    case 'root':
      return buildRootPageData();
    case 'events-archive':
      return buildEventsArchivePageData();
    case 'events-year':
      return buildYearPageData(page.year);
    case 'group':
      return buildGroupPageData(page.key);
  }
}

async function buildRootPageData(): Promise<BotPageData> {
  const [rawEvents, groups] = await Promise.all([
    fetchJson<ApiEvent[]>(withFields(EVENTS_API_URL, EVENTS_FIELDS)),
    fetchJson<ApiGroup[]>(withFields(GROUPS_API_URL, GROUPS_FIELDS)),
  ]);
  const events = enrichEventsWithGroups(rawEvents, groups);
  const futureEvents = limitEvents(events.filter(isFutureEvent).sort(sortByStartedAtAsc));
  const pastEvents = limitEvents(events.filter(isPastEvent).sort(sortByStartedAtDesc));

  const bodyHtml = [
    '<h1>Yamanashi Developer Hub</h1>',
    '<p>Yamanashi Developer Hub は、山梨県内で開催されるIT勉強会の情報をまとめたサイトです。' +
      'イベント情報は connpass、コミュニティが提供するイベントカレンダー、過去イベントアーカイブから取得しています。</p>',
    '<h2>直近開催イベント</h2>',
    buildEventListHtml(futureEvents),
    '<h2>終了したイベント</h2>',
    buildEventListHtml(pastEvents),
  ].join('');

  return {
    title: 'Yamanashi Developer Hub - 山梨のIT勉強会イベント情報ポータルサイト',
    description:
      'Yamanashi Developer Hubは、山梨県内で開催されるIT勉強会・イベント情報をまとめたポータルサイトです。' +
      'connpassやコミュニティのイベントカレンダー、過去の開催アーカイブから情報を集約し、直近の開催予定と過去イベントを一覧できます。',
    ogUrl: SITE_URL,
    jsonLd: buildEventListJsonLd([...futureEvents, ...pastEvents], `${SITE_URL}/`),
    bodyHtml,
  };
}

async function buildEventsArchivePageData(): Promise<BotPageData> {
  const summary = await fetchJson<ApiEventsSummary>(EVENTS_SUMMARY_API_URL);
  const yearsDesc = [...summary.years].sort((a, b) => b.year - a.year);

  const items = yearsDesc
    .map((y) => `<li><a href="${SITE_URL}/events/${y.year}">${y.year}年</a>(${y.event_count}件)</li>`)
    .join('');

  const bodyHtml = [
    '<h1>イベントアーカイブ</h1>',
    '<p>2010年から現在まで、山梨県内で開催されたIT勉強会の記録を振り返れるイベントアーカイブです。</p>',
    `<ul>${items}</ul>`,
  ].join('');

  return {
    title: 'イベントアーカイブ - Yamanashi Developer Hub',
    description: '2010年から現在まで、山梨県内で開催されたIT勉強会の記録を振り返れるイベントアーカイブです。',
    ogUrl: `${SITE_URL}/events`,
    ogImage: `${SITE_URL}/ogp-events.png`,
    jsonLd: buildYearArchiveJsonLd(yearsDesc.map((y) => y.year).sort((a, b) => a - b)),
    bodyHtml,
  };
}

async function buildYearPageData(year: number): Promise<BotPageData> {
  const [rawEvents, groups] = await Promise.all([
    fetchJson<ApiEvent[]>(withFields(`${EVENTS_API_URL}/year/${year}`, EVENTS_FIELDS)),
    fetchJson<ApiGroup[]>(withFields(GROUPS_API_URL, GROUPS_FIELDS)),
  ]);
  const events = enrichEventsWithGroups(rawEvents, groups)
    .filter(isVisibleEvent)
    .sort(sortByStartedAtAsc);
  const renderedEvents = limitEvents(events);

  const bodyHtml = [`<h1>${year}年 開催イベント</h1>`, buildEventListHtml(renderedEvents)].join('');

  return {
    title: `${year}年 開催イベント - Yamanashi Developer Hub`,
    description: `${year}年に山梨県内で開催されたIT勉強会・イベントの一覧です。全${events.length}件。`,
    ogUrl: `${SITE_URL}/events/${year}`,
    jsonLd: buildEventListJsonLd(renderedEvents, `${SITE_URL}/events/${year}`),
    bodyHtml,
  };
}

async function buildGroupPageData(key: string): Promise<BotPageData> {
  const encodedKey = encodeURIComponent(key);
  const [group, rawEvents] = await Promise.all([
    fetchJson<ApiGroupDetail>(withFields(`${GROUPS_API_URL}/${encodedKey}`, GROUP_DETAIL_FIELDS)),
    fetchJson<ApiEvent[]>(withGroupEventsParams(`${GROUPS_API_URL}/${encodedKey}/events`, EVENTS_FIELDS)),
  ]);
  const events = enrichEventsWithGroups(rawEvents, [group]).filter(isVisibleEvent);
  const upcomingEvents = limitEvents(events.filter(isFutureEvent).sort(sortByStartedAtAsc));
  const pastEvents = limitEvents(events.filter(isPastEvent).sort(sortByStartedAtDesc));

  const links = buildGroupExternalLinks(group)
    .map((link) => `<li><a href="${escapeHtml(link.url)}" rel="nofollow">${escapeHtml(link.label)}</a></li>`)
    .join('');

  const bodyHtml = [
    `<h1>${escapeHtml(group.title)}</h1>`,
    group.sub_title ? `<p>${escapeHtml(group.sub_title)}</p>` : '',
    group.description ? sanitizeDescriptionHtml(group.description) : '',
    links ? `<ul>${links}</ul>` : '',
    '<h2>今後の開催予定</h2>',
    buildEventListHtml(upcomingEvents),
    '<h2>過去のイベント</h2>',
    buildEventListHtml(pastEvents),
  ].filter(Boolean).join('');

  const descriptionText = group.description ? htmlToText(group.description) : '';
  const description = truncateText(
    `${group.title}のイベント情報と開催履歴。${descriptionText || '山梨県内で開催されるIT勉強会・イベント情報をまとめています。'}`,
    160,
  );

  return {
    title: `${group.title} - 山梨のITコミュニティ | Yamanashi Developer Hub`,
    description,
    ogUrl: buildGroupPageUrl(group.key),
    jsonLd: buildGroupPageJsonLd(group, [...upcomingEvents, ...pastEvents]),
    bodyHtml,
    headExtraHtml:
      `<link rel="alternate" type="application/rss+xml" ` +
      `title="${escapeHtml(buildGroupFeedTitle(group.title))}" ` +
      `href="${escapeHtml(buildGroupFeedUrl(group.key))}">`,
  };
}

function withFields(base: string, fields: string): string {
  const u = new URL(base);
  u.searchParams.set('fields', fields);
  return u.toString();
}

function withGroupEventsParams(base: string, fields: string): string {
  const u = new URL(withFields(base, fields));
  u.searchParams.set('per_page', String(GROUP_EVENTS_FETCH_PER_PAGE));
  return u.toString();
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  if (!res.ok) {
    throw new Error(`fetch failed: ${url} (${res.status})`);
  }
  return res.json() as Promise<T>;
}

function limitEvents(events: EventWithGroup[]): EventWithGroup[] {
  return events.slice(0, MAX_LIST_ITEMS);
}

function buildEventListHtml(events: EventWithGroup[]): string {
  if (events.length === 0) {
    return '<p>該当するイベントはありません。</p>';
  }
  const items = events
    .map((event) => {
      const date = formatEventDate(event.started_at);
      const groupName = event.group_name ? escapeHtml(event.group_name) : '';
      const group = groupName
        ? event.group_key
          ? `<span><a href="${escapeHtml(buildGroupPageUrl(event.group_key))}">${groupName}</a></span>`
          : `<span>${groupName}</span>`
        : '';
      const place = event.place ? `<span>${escapeHtml(event.place)}</span>` : '';
      return (
        `<li><a href="${escapeHtml(event.event_url)}">${escapeHtml(event.title)}</a>` +
        `<time datetime="${escapeHtml(event.started_at)}">${escapeHtml(date)}</time>${group}${place}</li>`
      );
    })
    .join('');
  return `<ul>${items}</ul>`;
}

function formatEventDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

class TextContentHandler implements HTMLRewriterElementContentHandlers {
  constructor(private readonly innerText: string) {}
  element(element: Element) {
    element.setInnerContent(this.innerText);
  }
}

class AttrContentHandler implements HTMLRewriterElementContentHandlers {
  constructor(private readonly name: string, private readonly value: string) {}
  element(element: Element) {
    element.setAttribute(this.name, this.value);
  }
}

class AppendHtmlHandler implements HTMLRewriterElementContentHandlers {
  constructor(private readonly html: string) {}
  element(element: Element) {
    element.append(this.html, { html: true });
  }
}

class SetInnerHtmlHandler implements HTMLRewriterElementContentHandlers {
  constructor(private readonly html: string) {}
  element(element: Element) {
    element.setInnerContent(this.html, { html: true });
  }
}

function injectBotContent(response: Response, data: BotPageData): Response {
  const jsonLdText = JSON.stringify(data.jsonLd).replace(/</g, '\\u003c');
  const jsonLdScript = `<script type="application/ld+json">${jsonLdText}</script>`;

  const rewriter = new HTMLRewriter()
    .on('title', new TextContentHandler(data.title))
    .on('meta[name="description"]', new AttrContentHandler('content', data.description))
    .on('meta[property="og:title"]', new AttrContentHandler('content', data.title))
    .on('meta[property="og:description"]', new AttrContentHandler('content', data.description))
    .on('meta[property="og:url"]', new AttrContentHandler('content', data.ogUrl))
    .on('head', new AppendHtmlHandler(jsonLdScript + (data.headExtraHtml ?? '')))
    .on('#root', new SetInnerHtmlHandler(data.bodyHtml));

  if (data.ogImage) {
    rewriter.on('meta[property="og:image"]', new AttrContentHandler('content', data.ogImage));
  }

  const transformed = rewriter.transform(response);
  const headers = new Headers(transformed.headers);
  headers.delete('content-length');
  headers.set('cache-control', 'public, max-age=120');
  headers.set('x-prerender', 'bot');
  const existingVary = headers.get('vary');
  headers.set('vary', existingVary ? `${existingVary}, User-Agent` : 'User-Agent');

  return new Response(transformed.body, {
    status: transformed.status,
    statusText: transformed.statusText,
    headers,
  });
}
