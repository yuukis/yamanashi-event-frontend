import { getEventAnchorId } from './eventAnchors';

export type ShareContext = {
  title: string;
  url: string;
  hashTag?: string | null;
};

export function buildEventShareUrl(uid: string): string {
  return `${window.location.origin}${window.location.pathname}#${encodeURIComponent(getEventAnchorId(uid))}`;
}

export function buildXShareUrl(ctx: ShareContext): string {
  const params = new URLSearchParams({ text: ctx.title, url: ctx.url });
  if (ctx.hashTag) {
    params.set('hashtags', ctx.hashTag);
  }
  return `https://twitter.com/intent/tweet?${params.toString()}`;
}
