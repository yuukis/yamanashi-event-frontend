import { describe, it, expect } from 'vitest';
import { htmlToParagraphs, htmlToText, truncateText } from './htmlText';

describe('htmlToParagraphs', () => {
  it('splits block-level elements into paragraphs and strips tags', () => {
    const html = '<p>『AI BASE』は生成AIに興味がある山梨のコミュニティです。</p><p>初心者でも大歓迎！</p>';

    expect(htmlToParagraphs(html)).toEqual([
      '『AI BASE』は生成AIに興味がある山梨のコミュニティです。',
      '初心者でも大歓迎！',
    ]);
  });

  it('keeps <br> line breaks inside a paragraph', () => {
    const html = '<p>1行目<br>2行目</p>';

    expect(htmlToParagraphs(html)).toEqual(['1行目\n2行目']);
  });

  it('strips inline tags while keeping their text', () => {
    const html = '<p><strong>テック無尽</strong>は<a href="https://example.com">合同イベント</a>です。</p>';

    expect(htmlToParagraphs(html)).toEqual(['テック無尽は合同イベントです。']);
  });

  it('decodes basic HTML entities', () => {
    const html = '<p>A &amp; B &lt;C&gt; &quot;D&quot; &#39;E&#39;&nbsp;F</p>';

    expect(htmlToParagraphs(html)).toEqual(['A & B <C> "D" \'E\' F']);
  });

  it('decodes numeric character references', () => {
    expect(htmlToParagraphs('<p>&#x27;A&#x27; &#12354;</p>')).toEqual(["'A' あ"]);
  });

  it('removes script and style contents entirely', () => {
    const html = '<style>p { color: red; }</style><p>本文</p><script>alert(1)</script>';

    expect(htmlToParagraphs(html)).toEqual(['本文']);
  });

  it('turns list items into separate paragraphs', () => {
    const html = '<ul><li>項目1</li><li>項目2</li></ul>';

    expect(htmlToParagraphs(html)).toEqual(['項目1', '項目2']);
  });

  it('returns an empty array for empty or whitespace-only HTML', () => {
    expect(htmlToParagraphs('')).toEqual([]);
    expect(htmlToParagraphs('<p>  </p>')).toEqual([]);
  });

  it('collapses runs of whitespace within a line', () => {
    expect(htmlToParagraphs('<p>あ   い\t う</p>')).toEqual(['あ い う']);
  });
});

describe('htmlToText', () => {
  it('joins paragraphs and line breaks into a single line', () => {
    const html = '<p>1行目<br>2行目</p><p>2段落目</p>';

    expect(htmlToText(html)).toBe('1行目 2行目 2段落目');
  });
});

describe('truncateText', () => {
  it('returns short text as is', () => {
    expect(truncateText('短いテキスト', 10)).toBe('短いテキスト');
  });

  it('truncates long text to the given length with an ellipsis', () => {
    const result = truncateText('あ'.repeat(20), 10);

    expect(result).toBe(`${'あ'.repeat(9)}…`);
    expect(result.length).toBe(10);
  });
});
