import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useToast } from '@chakra-ui/react';
import { isLocalStorageAvailable, getMarkedEventsSnapshot, updateMarkedEventsData } from './markedEventsStore';
import { mergeMarkedEvents } from './markedEvents';

export const SYNC_API_URL = 'https://sync.event.yamanashi.dev';
export const SYNC_QUERY_PARAM = 'sync';

export type SyncIssueResult = {
  code: string;
  expiresAt: string;
};

export async function createSyncCode(uids: string[]): Promise<SyncIssueResult> {
  try {
    const res = await axios.post(`${SYNC_API_URL}/sync`, { version: 1, uids });
    return { code: res.data.code, expiresAt: res.data.expires_at };
  } catch {
    throw new Error('コードの発行に失敗しました。しばらくしてから再度お試しください。');
  }
}

export async function fetchSyncUids(code: string): Promise<string[]> {
  let data: unknown;
  try {
    const res = await axios.get(`${SYNC_API_URL}/sync/${encodeURIComponent(code)}`);
    data = res.data;
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 404) {
      throw new Error('コードが見つからないか、有効期限が切れています。もう一度発行し直してください。');
    }
    throw new Error('データの取得に失敗しました。しばらくしてから再度お試しください。');
  }

  const candidate = data as { version?: unknown; uids?: unknown };
  if (candidate.version !== 1 || !Array.isArray(candidate.uids) || !candidate.uids.every((uid) => typeof uid === 'string')) {
    throw new Error('同期データの形式が不正です。');
  }
  return candidate.uids;
}

export function mergeUidsAndNotify(uids: string[], toast: ReturnType<typeof useToast>): void {
  const before = new Set(Object.keys(getMarkedEventsSnapshot().records));
  updateMarkedEventsData((previous) => mergeMarkedEvents(previous, uids, new Date()));
  const addedCount = uids.filter((uid) => !before.has(uid)).length;
  toast({
    position: 'bottom',
    duration: 4000,
    isClosable: true,
    status: 'success',
    title: addedCount > 0 ? `${addedCount}件の記録を取り込みました` : 'この端末にはすでにすべての記録があります',
  });
}

// SiteHeaderContentは固定/非固定の2枚が同時にマウントされるため、二重
// 取り込みを避けるためSiteHeader本体(1回だけ呼ばれる場所)から呼び出すこと。
export function useSyncCodeFromUrl(): void {
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useToast();
  const hasProcessedRef = useRef(false);

  useEffect(() => {
    const code = searchParams.get(SYNC_QUERY_PARAM);
    if (!code || hasProcessedRef.current || !isLocalStorageAvailable()) {
      return;
    }
    hasProcessedRef.current = true;

    fetchSyncUids(code)
      .then((uids) => mergeUidsAndNotify(uids, toast))
      .catch((err: Error) => {
        toast({
          position: 'bottom',
          duration: 5000,
          isClosable: true,
          status: 'error',
          title: err.message,
        });
      })
      .finally(() => {
        searchParams.delete(SYNC_QUERY_PARAM);
        setSearchParams(searchParams, { replace: true });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
