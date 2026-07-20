import type { useToast } from '@chakra-ui/react';
import { getEventAnchorId } from './eventAnchors';
import type { EventWithGroup } from '../types/events';

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

export function toEventShareContext(event: EventWithGroup): ShareContext {
  return {
    title: event.title,
    url: buildEventShareUrl(event.uid),
    hashTag: event.hash_tag,
  };
}

export function isNativeShareSupported(): boolean {
  return typeof navigator.share === 'function';
}

export async function shareEventViaNativeShare(
  event: EventWithGroup,
  toast: ReturnType<typeof useToast>,
  onAfterAction?: () => void,
): Promise<void> {
  return shareViaNativeShare(toEventShareContext(event), toast, onAfterAction);
}

export async function shareViaNativeShare(
  ctx: ShareContext,
  toast: ReturnType<typeof useToast>,
  onAfterAction?: () => void,
): Promise<void> {
  try {
    await navigator.share({
      title: ctx.title,
      text: ctx.hashTag ? `${ctx.title} #${ctx.hashTag}` : ctx.title,
      url: ctx.url,
    });
  } catch (err) {
    if ((err as Error)?.name !== 'AbortError') {
      toast({ title: '共有に失敗しました', status: 'error', duration: 2000, isClosable: true });
    }
  } finally {
    onAfterAction?.();
  }
}
