import type { ApiEvent } from '../types/events';

export type AreaKey = 'kofu-kyoto' | 'kyohoku-kyosai' | 'kyonan' | 'tobu-fujigoko' | 'online' | 'other';

export const AREA_LABELS: Record<AreaKey, string> = {
  'kofu-kyoto': '甲府・峡東',
  'kyohoku-kyosai': '峡北・峡西',
  kyonan: '峡南',
  'tobu-fujigoko': '東部・富士五湖',
  online: 'オンライン',
  other: 'その他',
};

export const AREA_ORDER: AreaKey[] = ['kofu-kyoto', 'kyohoku-kyosai', 'kyonan', 'tobu-fujigoko', 'online', 'other'];

const MUNICIPALITY_AREA: Record<string, AreaKey> = {
  甲府市: 'kofu-kyoto',
  山梨市: 'kofu-kyoto',
  笛吹市: 'kofu-kyoto',
  甲州市: 'kofu-kyoto',
  韮崎市: 'kyohoku-kyosai',
  北杜市: 'kyohoku-kyosai',
  甲斐市: 'kyohoku-kyosai',
  南アルプス市: 'kyohoku-kyosai',
  中央市: 'kyohoku-kyosai',
  昭和町: 'kyohoku-kyosai',
  市川三郷町: 'kyonan',
  早川町: 'kyonan',
  身延町: 'kyonan',
  南部町: 'kyonan',
  富士川町: 'kyonan',
  大月市: 'tobu-fujigoko',
  都留市: 'tobu-fujigoko',
  上野原市: 'tobu-fujigoko',
  小菅村: 'tobu-fujigoko',
  丹波山村: 'tobu-fujigoko',
  西桂町: 'tobu-fujigoko',
  道志村: 'tobu-fujigoko',
  富士吉田市: 'tobu-fujigoko',
  富士河口湖町: 'tobu-fujigoko',
  山中湖村: 'tobu-fujigoko',
  忍野村: 'tobu-fujigoko',
  鳴沢村: 'tobu-fujigoko',
};

// connpass の一部イベントはローマ字住所(例: "2-chōme-35-1 Marunouchi, Kofu
// Yamanashi")で登録されているため、末尾の「, <市区町村> Yamanashi」からも
// 判定できるようにする。
const ROMAJI_MUNICIPALITY_AREA: Record<string, AreaKey> = {
  kofu: 'kofu-kyoto',
  fuefuki: 'kofu-kyoto',
  koshu: 'kofu-kyoto',
  nirasaki: 'kyohoku-kyosai',
  hokuto: 'kyohoku-kyosai',
  kai: 'kyohoku-kyosai',
  'minami-alps': 'kyohoku-kyosai',
  chuo: 'kyohoku-kyosai',
  showa: 'kyohoku-kyosai',
  ichikawamisato: 'kyonan',
  hayakawa: 'kyonan',
  minobu: 'kyonan',
  nanbu: 'kyonan',
  fujikawa: 'kyonan',
  otsuki: 'tobu-fujigoko',
  tsuru: 'tobu-fujigoko',
  uenohara: 'tobu-fujigoko',
  kosuge: 'tobu-fujigoko',
  tabayama: 'tobu-fujigoko',
  nishikatsura: 'tobu-fujigoko',
  doshi: 'tobu-fujigoko',
  fujiyoshida: 'tobu-fujigoko',
  fujikawaguchiko: 'tobu-fujigoko',
  yamanakako: 'tobu-fujigoko',
  oshino: 'tobu-fujigoko',
  narusawa: 'tobu-fujigoko',
};

// 「山梨県」等の都道府県名は市区町村名に連結してしまわないよう文字クラスから除外する。
const MUNICIPALITY_PATTERN = /(?:[^\s0-9〒\-,、県]+郡)?([^\s0-9〒\-,、県]+?(?:市|区|町|村))/;
const ROMAJI_PATTERN = /,\s*([A-Za-zĀ-ſ\- ]+?)\s+Yamanashi\b/i;
const ONLINE_PATTERN = /オンライン|リモート|zoom|discord|teams|meet|chatwork|cluster/i;

export function getEventArea(event: ApiEvent): AreaKey {
  const address = event.address?.trim();
  if (address) {
    const match = address.match(MUNICIPALITY_PATTERN);
    if (match) {
      const area = MUNICIPALITY_AREA[match[1]];
      if (area) {
        return area;
      }
    }
    const romajiMatch = address.match(ROMAJI_PATTERN);
    if (romajiMatch) {
      const area = ROMAJI_MUNICIPALITY_AREA[romajiMatch[1].trim().toLowerCase()];
      if (area) {
        return area;
      }
    }
  }

  const place = event.place?.trim();
  if (ONLINE_PATTERN.test(address ?? '') || (!address && place && ONLINE_PATTERN.test(place))) {
    return 'online';
  }

  return 'other';
}

// エリアタブは対象0件でもボタン自体は常に表示するため、件数0のエリアも
// 省略せず全エリア分(AREA_ORDER)を返す。
export function countAreas(events: ApiEvent[]): [AreaKey, number][] {
  const counts = new Map<AreaKey, number>(AREA_ORDER.map((area) => [area, 0]));
  for (const event of events) {
    const area = getEventArea(event);
    counts.set(area, (counts.get(area) ?? 0) + 1);
  }
  return AREA_ORDER.map((area) => [area, counts.get(area)!]);
}

export function filterEventsByArea<T extends ApiEvent>(
  events: T[],
  area: AreaKey | null,
): T[] {
  if (!area) {
    return events;
  }
  return events.filter((event) => getEventArea(event) === area);
}
