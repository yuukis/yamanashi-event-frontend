import { describe, it, expect } from 'vitest';
import {
  buildEventShareUrl,
  buildXShareUrl,
  buildShareClipboardText,
} from './share';

describe('buildEventShareUrl', () => {
  it('builds an absolute URL pointing at the event anchor', () => {
    expect(buildEventShareUrl('abc123')).toBe(`${window.location.origin}/#event-item-abc123`);
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

describe('buildShareClipboardText', () => {
  it('joins title, url and hashtag on separate lines when a hashTag is present', () => {
    const text = buildShareClipboardText({ title: 'Sample Event', url: 'https://example.com/#event-item-1', hashTag: 'kofu' });

    expect(text).toBe('Sample Event\nhttps://example.com/#event-item-1\n#kofu');
  });

  it('omits the hashtag line when there is no hashTag', () => {
    const text = buildShareClipboardText({ title: 'Sample Event', url: 'https://example.com/#event-item-1', hashTag: null });

    expect(text).toBe('Sample Event\nhttps://example.com/#event-item-1');
  });
});
