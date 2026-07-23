import { describe, it, expect } from 'vitest';
import { getEventArea, countAreas, filterEventsByArea } from './eventAreas';
import { makeEvent } from '../test/fixtures';

describe('getEventArea', () => {
  it('classifies an address in 甲府市 as kofu-kyoto', () => {
    expect(getEventArea(makeEvent({ address: '山梨県甲府市丸の内1-15-2 第5丸銀ビル3F' }))).toBe('kofu-kyoto');
  });

  it('classifies an address in 北杜市 as kyohoku-kyosai', () => {
    expect(getEventArea(makeEvent({ address: '山梨県北杜市高根町村山北割３２８８' }))).toBe('kyohoku-kyosai');
  });

  it('classifies an address with a 郡 prefix (南都留郡山中湖村) as tobu-fujigoko', () => {
    expect(getEventArea(makeEvent({ address: '山梨県南都留郡山中湖村1234' }))).toBe('tobu-fujigoko');
  });

  it('classifies an address in 身延町 as kyonan', () => {
    expect(getEventArea(makeEvent({ address: '山梨県南巨摩郡身延町430' }))).toBe('kyonan');
  });

  it('classifies a romaji address ending in "<City> Yamanashi" using the city name', () => {
    expect(getEventArea(makeEvent({ address: '2-chōme-35-1 Marunouchi, Kofu Yamanashi' }))).toBe('kofu-kyoto');
  });

  it('classifies place "オンライン" with empty address as online', () => {
    expect(getEventArea(makeEvent({ address: '', place: 'オンライン' }))).toBe('online');
  });

  it('classifies an address that itself says "オンライン" as online', () => {
    expect(getEventArea(makeEvent({ address: 'オンライン', place: 'オンライン (山梨)' }))).toBe('online');
  });

  it('classifies a null address with no place as other (no signal to estimate a location)', () => {
    expect(getEventArea(makeEvent({ address: null, place: null }))).toBe('other');
  });

  it('classifies an out-of-prefecture address as other', () => {
    expect(getEventArea(makeEvent({ address: '東京都墨田区錦糸４丁目１７−１' }))).toBe('other');
  });

  it('classifies as other when only a place name is given with no address (unresolvable municipality)', () => {
    expect(getEventArea(makeEvent({ address: null, place: '山梨県立図書館イベントスペース東面' }))).toBe('other');
  });
});

describe('countAreas', () => {
  it('counts events per area in fixed geographic order, including zero-count areas', () => {
    const events = [
      makeEvent({ address: '山梨県甲府市' }),
      makeEvent({ address: '山梨県甲府市' }),
      makeEvent({ address: '山梨県北杜市' }),
      makeEvent({ address: '', place: 'オンライン' }),
      makeEvent({ address: '東京都墨田区錦糸４丁目１７−１' }),
    ];

    expect(countAreas(events)).toEqual([
      ['kofu-kyoto', 2],
      ['kyohoku-kyosai', 1],
      ['kyonan', 0],
      ['tobu-fujigoko', 0],
      ['online', 1],
      ['other', 1],
    ]);
  });
});

describe('filterEventsByArea', () => {
  it('returns all events when area is null', () => {
    const events = [makeEvent({ address: '山梨県甲府市' }), makeEvent({ address: '山梨県北杜市' })];

    expect(filterEventsByArea(events, null)).toEqual(events);
  });

  it('returns only events matching the given area', () => {
    const match = makeEvent({ uid: 'match', address: '山梨県甲府市' });
    const other = makeEvent({ uid: 'other', address: '山梨県北杜市' });

    expect(filterEventsByArea([match, other], 'kofu-kyoto')).toEqual([match]);
  });

  it('excludes events classified as other when filtering by a different area', () => {
    const event = makeEvent({ address: '東京都墨田区' });

    expect(filterEventsByArea([event], 'kofu-kyoto')).toEqual([]);
  });

  it('returns events classified as other when filtering by "other"', () => {
    const event = makeEvent({ address: '東京都墨田区' });

    expect(filterEventsByArea([event], 'other')).toEqual([event]);
  });
});
