// コミュニティ説明文などAPIが返すHTML断片をプレーンテキストの段落に変換する。
// Cloudflare Pages Functions(DOM無し環境)からも使うため、DOMParserに依存しない。
const BLOCK_END_PATTERN = /<\/(?:p|div|section|article|li|ul|ol|dl|dt|dd|h[1-6]|blockquote|pre|table|tr)>/gi;

function safeFromCodePoint(codePoint: number): string {
  try {
    return String.fromCodePoint(codePoint);
  } catch {
    return '';
  }
}

export function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&#(\d+);/g, (_, digits) => safeFromCodePoint(Number(digits)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => safeFromCodePoint(parseInt(hex, 16)))
    .replace(/&nbsp;/gi, ' ')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&amp;/gi, '&');
}

export function htmlToParagraphs(html: string): string[] {
  const text = html
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(BLOCK_END_PATTERN, '\n\n')
    .replace(/<[^>]*>/g, '');

  return decodeHtmlEntities(text)
    .split(/\n{2,}/)
    .map((paragraph) =>
      paragraph
        .split('\n')
        .map((line) => line.replace(/\s+/g, ' ').trim())
        .filter(Boolean)
        .join('\n'),
    )
    .filter(Boolean);
}

export function htmlToText(html: string): string {
  return htmlToParagraphs(html).join(' ').replace(/\n/g, ' ');
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength - 1)}…`;
}
