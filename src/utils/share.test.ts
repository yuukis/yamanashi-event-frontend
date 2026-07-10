import { describe, it, expect, afterEach } from 'vitest';
import {
  buildEventShareUrl,
  buildXShareUrl,
} from './share';
import { getEventAnchorId } from './eventAnchors';

describe('buildEventShareUrl', () => {
  afterEach(() => {
    window.history.pushState({}, '', '/');
  });

  it('builds an absolute URL pointing at the event anchor on the top page', () => {
    expect(buildEventShareUrl('abc123')).toBe(`${window.location.origin}/#${getEventAnchorId('abc123')}`);
  });

  it('keeps the current year-list path so the anchor stays within that page', () => {
    window.history.pushState({}, '', '/events/2026');

    expect(buildEventShareUrl('abc123')).toBe(`${window.location.origin}/events/2026#${getEventAnchorId('abc123')}`);
  });
});

describe('buildXShareUrl', () => {
  it('includes text, url and hashtags when a hashTag is present', () => {
    const url = buildXShareUrl({ title: '甲府もくもく会', url: 'https://example.com/#event-item-1', hashTag: 'kofu' });

    expect(url).toBe(
      'https://twitter.com/intent/tweet?text=%E7%94%B2%E5%BA%9C%E3%82%82%E3%81%8F%E3%82%82%E3%81%8F%E4%BC%9A&url=https%3A%2F%2Fexample.com%2F%23event-item-1&hashtags=kofu',
    );
  });

  it('omits the hashtags param when there is no hashTag', () => {
    const url = buildXShareUrl({ title: 'Sample Event', url: 'https://example.com/#event-item-1', hashTag: null });

    expect(url).toBe('https://twitter.com/intent/tweet?text=Sample+Event&url=https%3A%2F%2Fexample.com%2F%23event-item-1');
  });
});
