import { describe, it, expect } from 'vitest';
import { sanitizeDescriptionHtml } from './descriptionHtml';

describe('sanitizeDescriptionHtml', () => {
  it('keeps paragraphs and inline formatting tags', () => {
    expect(sanitizeDescriptionHtml('<p><strong>太字</strong>と<em>斜体</em>と<u>下線</u>と<s>打消し</s></p>'))
      .toBe('<p><strong>太字</strong>と<em>斜体</em>と<u>下線</u>と<s>打消し</s></p>');
  });

  it('normalizes b/i aliases to strong/em', () => {
    expect(sanitizeDescriptionHtml('<p><b>太字</b><i>斜体</i></p>'))
      .toBe('<p><strong>太字</strong><em>斜体</em></p>');
  });

  it('converts headings to styled paragraphs instead of document headings', () => {
    expect(sanitizeDescriptionHtml('<h2>見出し</h2><p>本文</p>'))
      .toBe('<p class="desc-h2">見出し</p><p>本文</p>');
    expect(sanitizeDescriptionHtml('<h1>a</h1>')).not.toContain('<h1');
  });

  it('keeps http(s) links with target and rel, dropping other attributes', () => {
    expect(sanitizeDescriptionHtml('<p><a href="https://example.com/" onclick="evil()" class="x">リンク</a></p>'))
      .toBe('<p><a href="https://example.com/" target="_blank" rel="nofollow noopener">リンク</a></p>');
  });

  it('unwraps links with unsafe or missing href but keeps their text', () => {
    expect(sanitizeDescriptionHtml('<p><a href="javascript:alert(1)">テキスト</a></p>')).toBe('<p>テキスト</p>');
    expect(sanitizeDescriptionHtml('<p><a>テキスト</a></p>')).toBe('<p>テキスト</p>');
    expect(sanitizeDescriptionHtml('<p><a href="/relative">テキスト</a></p>')).toBe('<p>テキスト</p>');
  });

  it('keeps table structure including empty cells', () => {
    const html = '<table><thead><tr><th>列1</th><th>列2</th></tr></thead><tbody><tr><td>あ</td><td></td></tr></tbody></table>';
    expect(sanitizeDescriptionHtml(html)).toBe(html);
  });

  it('removes script/style tags together with their contents', () => {
    expect(sanitizeDescriptionHtml('<p>前</p><script>alert(1)</script><style>p{}</style><p>後</p>'))
      .toBe('<p>前</p><p>後</p>');
  });

  it('drops images and prunes elements left empty by them', () => {
    expect(sanitizeDescriptionHtml('<p><a href="https://example.com/"><img src="https://example.com/a.png"></a></p>'))
      .toBe('');
    expect(sanitizeDescriptionHtml('<p>本文<img src="https://example.com/a.png"></p>')).toBe('<p>本文</p>');
  });

  it('unwraps unknown tags while keeping their children', () => {
    expect(sanitizeDescriptionHtml('<div><section><p><span>本文</span></p></section></div>')).toBe('<p>本文</p>');
  });

  it('balances unclosed tags and ignores stray closing tags', () => {
    expect(sanitizeDescriptionHtml('<p><strong>abc')).toBe('<p><strong>abc</strong></p>');
    expect(sanitizeDescriptionHtml('</p></strong>テキスト')).toBe('テキスト');
  });

  it('re-escapes text content so entities round-trip safely', () => {
    expect(sanitizeDescriptionHtml('<p>A &amp; B &lt;tag&gt; &#39;q&#39;</p>'))
      .toBe('<p>A &amp; B &lt;tag&gt; &#39;q&#39;</p>');
  });

  it('keeps br and hr as void elements', () => {
    expect(sanitizeDescriptionHtml('<p>1行目<br>2行目</p><hr>')).toBe('<p>1行目<br>2行目</p><hr>');
  });

  it('returns an empty string for empty or tag-only input', () => {
    expect(sanitizeDescriptionHtml('')).toBe('');
    expect(sanitizeDescriptionHtml('<p>  </p><ul><li></li></ul>')).toBe('');
  });
});
