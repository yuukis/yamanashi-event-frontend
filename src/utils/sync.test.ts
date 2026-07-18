import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import type { useToast } from '@chakra-ui/react';
import { createSyncCode, fetchSyncUids, mergeUidsAndNotify, SYNC_API_URL } from './sync';
import { updateMarkedEventsData } from './markedEventsStore';
import { EMPTY_MARKED_EVENTS_DATA, markEvent } from './markedEvents';

function makeToastSpy() {
  return vi.fn() as unknown as ReturnType<typeof useToast>;
}

vi.mock('axios');

describe('createSyncCode', () => {
  beforeEach(() => {
    vi.mocked(axios.post).mockReset();
  });

  it('posts the uids and returns the issued code', async () => {
    vi.mocked(axios.post).mockResolvedValue({
      data: { code: 'A3K9P2', expires_at: '2026-07-18T20:33:37+09:00' },
    });

    const result = await createSyncCode(['e1', 'e2']);

    expect(axios.post).toHaveBeenCalledWith(`${SYNC_API_URL}/sync`, { version: 1, uids: ['e1', 'e2'] });
    expect(result).toEqual({ code: 'A3K9P2', expiresAt: '2026-07-18T20:33:37+09:00' });
  });

  it('throws a user-facing error when the request fails', async () => {
    vi.mocked(axios.post).mockRejectedValue(new Error('network error'));

    await expect(createSyncCode(['e1'])).rejects.toThrow('コードの発行に失敗しました。しばらくしてから再度お試しください。');
  });

  it('throws when the response does not include a code', async () => {
    vi.mocked(axios.post).mockResolvedValue({ data: { expires_at: '2026-07-18T20:33:37+09:00' } });

    await expect(createSyncCode(['e1'])).rejects.toThrow('コードの発行に失敗しました。しばらくしてから再度お試しください。');
  });

  it('throws when the response does not include an expiry', async () => {
    vi.mocked(axios.post).mockResolvedValue({ data: { code: 'A3K9P2' } });

    await expect(createSyncCode(['e1'])).rejects.toThrow('コードの発行に失敗しました。しばらくしてから再度お試しください。');
  });
});

describe('fetchSyncUids', () => {
  beforeEach(() => {
    vi.mocked(axios.get).mockReset();
    vi.mocked(axios.isAxiosError).mockReset();
  });

  it('requests the code endpoint and returns the uids', async () => {
    vi.mocked(axios.get).mockResolvedValue({ data: { version: 1, uids: ['e1', 'e2'] } });

    const result = await fetchSyncUids('a3k9p2');

    expect(axios.get).toHaveBeenCalledWith(`${SYNC_API_URL}/sync/a3k9p2`);
    expect(result).toEqual(['e1', 'e2']);
  });

  it('throws an expiry-specific error on 404', async () => {
    vi.mocked(axios.isAxiosError).mockReturnValue(true);
    vi.mocked(axios.get).mockRejectedValue({ response: { status: 404 } });

    await expect(fetchSyncUids('a3k9p2')).rejects.toThrow('コードが見つからないか、有効期限が切れています。もう一度発行し直してください。');
  });

  it('throws a generic error on other request failures', async () => {
    vi.mocked(axios.isAxiosError).mockReturnValue(false);
    vi.mocked(axios.get).mockRejectedValue(new Error('network error'));

    await expect(fetchSyncUids('a3k9p2')).rejects.toThrow('データの取得に失敗しました。しばらくしてから再度お試しください。');
  });

  it('throws when the response does not match the expected envelope', async () => {
    vi.mocked(axios.get).mockResolvedValue({ data: { version: 2, uids: ['e1'] } });

    await expect(fetchSyncUids('a3k9p2')).rejects.toThrow('同期データの形式が不正です。');
  });

  it('throws when uids contains a non-string entry', async () => {
    vi.mocked(axios.get).mockResolvedValue({ data: { version: 1, uids: ['e1', 42] } });

    await expect(fetchSyncUids('a3k9p2')).rejects.toThrow('同期データの形式が不正です。');
  });

  it.each(['__proto__', 'constructor', 'prototype'])(
    'throws when uids contains the unsafe key "%s"',
    async (unsafeKey) => {
      vi.mocked(axios.get).mockResolvedValue({ data: { version: 1, uids: ['e1', unsafeKey] } });

      await expect(fetchSyncUids('a3k9p2')).rejects.toThrow('同期データの形式が不正です。');
    },
  );
});

describe('mergeUidsAndNotify', () => {
  beforeEach(() => {
    updateMarkedEventsData(() => EMPTY_MARKED_EVENTS_DATA);
  });

  it('reports the number of distinct uids actually added', () => {
    const toast = makeToastSpy();

    mergeUidsAndNotify(['e1', 'e2'], toast);

    expect(toast).toHaveBeenCalledWith(expect.objectContaining({ title: '2件の記録を取り込みました' }));
  });

  it('does not over-count when the uids array contains duplicates', () => {
    const toast = makeToastSpy();

    mergeUidsAndNotify(['e1', 'e1', 'e2'], toast);

    expect(toast).toHaveBeenCalledWith(expect.objectContaining({ title: '2件の記録を取り込みました' }));
  });

  it('reports the already-synced message when every uid is already marked', () => {
    updateMarkedEventsData((previous) => markEvent(previous, 'e1', new Date('2026-01-01T00:00:00+09:00')));
    const toast = makeToastSpy();

    mergeUidsAndNotify(['e1'], toast);

    expect(toast).toHaveBeenCalledWith(expect.objectContaining({ title: 'この端末にはすでにすべての記録があります' }));
  });
});
