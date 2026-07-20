// コミュニティ説明文のHTMLを、許可したタグだけでゼロから組み立て直す
// サニタイザー。入力のタグや属性をそのまま通すことはせず、テキストは
// すべてエスケープし直すため、APIが返すHTMLに何が含まれていても
// 出力は安全なマークアップになる。Cloudflare Pages Functions からも
// 使うため、DOMParserには依存しない。
import { decodeHtmlEntities } from './htmlText';

// 見出しは文書のアウトラインに参加させず、文字の大きさを変えるだけの
// 段落(p.desc-hN)として出力する
const TAG_MAP: Record<string, { tag: string; className?: string }> = {
  p: { tag: 'p' },
  h1: { tag: 'p', className: 'desc-h1' },
  h2: { tag: 'p', className: 'desc-h2' },
  h3: { tag: 'p', className: 'desc-h3' },
  h4: { tag: 'p', className: 'desc-h4' },
  h5: { tag: 'p', className: 'desc-h5' },
  h6: { tag: 'p', className: 'desc-h6' },
  strong: { tag: 'strong' },
  b: { tag: 'strong' },
  em: { tag: 'em' },
  i: { tag: 'em' },
  u: { tag: 'u' },
  s: { tag: 's' },
  del: { tag: 's' },
  strike: { tag: 's' },
  a: { tag: 'a' },
  ul: { tag: 'ul' },
  ol: { tag: 'ol' },
  li: { tag: 'li' },
  table: { tag: 'table' },
  thead: { tag: 'thead' },
  tbody: { tag: 'tbody' },
  tfoot: { tag: 'tfoot' },
  tr: { tag: 'tr' },
  th: { tag: 'th' },
  td: { tag: 'td' },
  blockquote: { tag: 'blockquote' },
  pre: { tag: 'pre' },
  code: { tag: 'code' },
  br: { tag: 'br' },
  hr: { tag: 'hr' },
};

const VOID_TAGS = new Set(['br', 'hr']);
const DROP_CONTENT_TAGS = new Set(['script', 'style', 'noscript', 'iframe', 'object', 'svg', 'head', 'title']);
// th/tdは空でも表の列数を保つため対象外にする
const PRUNE_IF_EMPTY = new Set([
  'a', 'p', 'li', 'ul', 'ol', 'blockquote', 'pre', 'code',
  'table', 'thead', 'tbody', 'tfoot', 'tr',
  'strong', 'em', 'u', 's',
]);

type ElementNode = {
  type: 'element';
  tag: string;
  className?: string;
  href?: string;
  children: SanitizedNode[];
};
type TextNode = { type: 'text'; text: string };
type SanitizedNode = ElementNode | TextNode;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function extractHref(attrs: string): string | null {
  const match = attrs.match(/href\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
  if (!match) {
    return null;
  }
  const href = decodeHtmlEntities(match[1] ?? match[2] ?? match[3] ?? '').trim();
  return /^https?:\/\//i.test(href) ? href : null;
}

function parse(html: string): SanitizedNode[] {
  const root: ElementNode = { type: 'element', tag: '#root', children: [] };
  const stack: ElementNode[] = [root];
  let dropContentUntil: string | null = null;

  const tokens = html.match(/<!--[\s\S]*?-->|<[^>]*>|[^<]+/g) ?? [];
  for (const token of tokens) {
    if (token.startsWith('<!--')) {
      continue;
    }
    const tagMatch = token.match(/^<\s*(\/?)\s*([a-zA-Z][a-zA-Z0-9]*)\s*([^>]*?)\s*\/?\s*>$/);
    if (!tagMatch) {
      if (!token.startsWith('<') && !dropContentUntil) {
        stack[stack.length - 1].children.push({ type: 'text', text: decodeHtmlEntities(token) });
      }
      continue;
    }

    const isClosing = tagMatch[1] === '/';
    const tagName = tagMatch[2].toLowerCase();
    const attrs = tagMatch[3];

    if (dropContentUntil) {
      if (isClosing && tagName === dropContentUntil) {
        dropContentUntil = null;
      }
      continue;
    }
    if (DROP_CONTENT_TAGS.has(tagName)) {
      if (!isClosing) {
        dropContentUntil = tagName;
      }
      continue;
    }

    const mapping = TAG_MAP[tagName];
    if (!mapping) {
      continue;
    }

    if (VOID_TAGS.has(mapping.tag)) {
      if (!isClosing) {
        stack[stack.length - 1].children.push({ type: 'element', tag: mapping.tag, children: [] });
      }
      continue;
    }

    if (isClosing) {
      for (let i = stack.length - 1; i > 0; i--) {
        if (stack[i].tag === mapping.tag) {
          stack.length = i;
          break;
        }
      }
      continue;
    }

    const node: ElementNode = { type: 'element', tag: mapping.tag, children: [] };
    if (mapping.className) {
      node.className = mapping.className;
    }
    if (mapping.tag === 'a') {
      const href = extractHref(attrs);
      if (!href) {
        // リンク先が無い・不正なリンクはタグを外して中身だけ残す
        continue;
      }
      node.href = href;
    }
    stack[stack.length - 1].children.push(node);
    stack.push(node);
  }

  return root.children;
}

function hasTextContent(node: SanitizedNode): boolean {
  if (node.type === 'text') {
    return node.text.trim().length > 0;
  }
  return node.children.some(hasTextContent);
}

function prune(nodes: SanitizedNode[]): SanitizedNode[] {
  return nodes
    .map((node): SanitizedNode | null => {
      if (node.type === 'text') {
        return node;
      }
      const children = prune(node.children);
      if (PRUNE_IF_EMPTY.has(node.tag) && !children.some(hasTextContent)) {
        return null;
      }
      return { ...node, children };
    })
    .filter((node): node is SanitizedNode => node !== null);
}

function serialize(nodes: SanitizedNode[]): string {
  return nodes
    .map((node) => {
      if (node.type === 'text') {
        return escapeHtml(node.text);
      }
      if (VOID_TAGS.has(node.tag)) {
        return `<${node.tag}>`;
      }
      const attrs = [
        node.className ? ` class="${node.className}"` : '',
        node.href ? ` href="${escapeHtml(node.href)}" target="_blank" rel="nofollow noopener"` : '',
      ].join('');
      return `<${node.tag}${attrs}>${serialize(node.children)}</${node.tag}>`;
    })
    .join('');
}

export function sanitizeDescriptionHtml(html: string): string {
  return serialize(prune(parse(html))).trim();
}
