import { getEventAnchorId } from './eventAnchors';

export type ShareContext = {
  title: string;
  url: string;
  hashTag?: string | null;
};

export function buildEventShareUrl(uid: string): string {
  // 年別一覧(/:year)にしか載っていないイベントもあるため、トップページ
  // 固定ではなく現在のパスにアンカーを付ける。
  return `${window.location.origin}${window.location.pathname}#${encodeURIComponent(getEventAnchorId(uid))}`;
}

export function buildXShareUrl(ctx: ShareContext): string {
  const params = new URLSearchParams({ text: ctx.title, url: ctx.url });
  if (ctx.hashTag) {
    params.set('hashtags', ctx.hashTag);
  }
  return `https://twitter.com/intent/tweet?${params.toString()}`;
}

export function buildShareClipboardText(ctx: ShareContext): string {
  const lines = [ctx.title, ctx.url];
  if (ctx.hashTag) {
    lines.push(`#${ctx.hashTag}`);
  }
  return lines.join('\n');
}
