import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithChakra } from '../test/test-utils';
import { SyncButton } from './Sync';
import { updateMarkedEventsData, getMarkedEventsSnapshot } from '../utils/markedEventsStore';
import { EMPTY_MARKED_EVENTS_DATA, markEvent } from '../utils/markedEvents';
import { createSyncCode, fetchSyncUids } from '../utils/sync';

vi.mock('../utils/sync', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../utils/sync')>();
  return {
    ...actual,
    createSyncCode: vi.fn(),
    fetchSyncUids: vi.fn(),
  };
});

const NOW = new Date('2026-01-10T12:00:00+09:00');

function openModal() {
  fireEvent.click(screen.getByRole('button', { name: 'この記録を他の端末に引き継ぐ' }));
}

describe('SyncButton', () => {
  beforeEach(() => {
    updateMarkedEventsData(() => EMPTY_MARKED_EVENTS_DATA);
    vi.mocked(createSyncCode).mockReset();
    vi.mocked(fetchSyncUids).mockReset();
  });

  it('does not render when localStorage is unavailable', () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError');
    });

    renderWithChakra(<SyncButton />);

    expect(screen.queryByRole('button', { name: 'この記録を他の端末に引き継ぐ' })).not.toBeInTheDocument();

    setItemSpy.mockRestore();
  });

  it('opens the modal with the sync heading when the trigger is clicked', () => {
    renderWithChakra(<SyncButton />);

    openModal();

    expect(screen.getByText('他の端末と記録を引き継ぐ')).toBeInTheDocument();
  });

  it('disables the issue button and shows the empty-state message when nothing is marked', () => {
    renderWithChakra(<SyncButton />);

    openModal();

    expect(screen.getByRole('button', { name: 'コードを発行する' })).toBeDisabled();
    expect(screen.getByText('引き継ぐ記録がありません')).toBeInTheDocument();
  });

  it('enables the issue button and hides the empty-state message when an event is marked', () => {
    updateMarkedEventsData((previous) => markEvent(previous, 'event-1', NOW));
    renderWithChakra(<SyncButton />);

    openModal();

    expect(screen.getByRole('button', { name: 'コードを発行する' })).toBeEnabled();
    expect(screen.queryByText('引き継ぐ記録がありません')).not.toBeInTheDocument();
  });

  it('issues a code for the currently marked uids and shows the QR code and code text', async () => {
    updateMarkedEventsData((previous) => markEvent(markEvent(previous, 'event-1', NOW), 'event-2', NOW));
    vi.mocked(createSyncCode).mockResolvedValue({ code: 'ABC123', expiresAt: '2026-01-10T12:10:00+09:00' });
    renderWithChakra(<SyncButton />);

    openModal();
    fireEvent.click(screen.getByRole('button', { name: 'コードを発行する' }));

    expect(await screen.findByText('ABC123')).toBeInTheDocument();
    expect(createSyncCode).toHaveBeenCalledWith(expect.arrayContaining(['event-1', 'event-2']));
    expect(screen.queryByRole('button', { name: 'コードを発行する' })).not.toBeInTheDocument();
  });

  it('shows an error message when issuing a code fails', async () => {
    updateMarkedEventsData((previous) => markEvent(previous, 'event-1', NOW));
    vi.mocked(createSyncCode).mockRejectedValue(new Error('コードの発行に失敗しました。しばらくしてから再度お試しください。'));
    renderWithChakra(<SyncButton />);

    openModal();
    fireEvent.click(screen.getByRole('button', { name: 'コードを発行する' }));

    expect(await screen.findByText('コードの発行に失敗しました。しばらくしてから再度お試しください。')).toBeInTheDocument();
  });

  it('copies the issued code to the clipboard and reverts the confirmation after a delay', async () => {
    updateMarkedEventsData((previous) => markEvent(previous, 'event-1', NOW));
    vi.mocked(createSyncCode).mockResolvedValue({ code: 'ABC123', expiresAt: '2026-01-10T12:10:00+09:00' });
    const writeTextSpy = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();
    renderWithChakra(<SyncButton />);

    openModal();
    fireEvent.click(screen.getByRole('button', { name: 'コードを発行する' }));
    await screen.findByText('ABC123');

    const copyButton = screen.getByRole('button', { name: 'コードをコピー' });
    const initialIcon = copyButton.innerHTML;
    fireEvent.click(copyButton);

    expect(writeTextSpy).toHaveBeenCalledWith('ABC123');
    await waitFor(() => expect(copyButton.innerHTML).not.toBe(initialIcon));
    await waitFor(() => expect(copyButton.innerHTML).toBe(initialIcon), { timeout: 2500 });

    writeTextSpy.mockRestore();
  });

  it('uppercases redeem input as the user types', () => {
    renderWithChakra(<SyncButton />);

    openModal();
    const input = screen.getByPlaceholderText('コードを入力');
    fireEvent.change(input, { target: { value: 'a3k9p2' } });

    expect(input).toHaveValue('A3K9P2');
  });

  it('redeems a code, merges the uids into markedEventsStore, and closes the modal', async () => {
    vi.mocked(fetchSyncUids).mockResolvedValue(['event-a', 'event-b']);
    renderWithChakra(<SyncButton />);

    openModal();
    fireEvent.change(screen.getByPlaceholderText('コードを入力'), { target: { value: 'a3k9p2' } });
    fireEvent.click(screen.getByRole('button', { name: '取り込む' }));

    await waitFor(() => expect(screen.queryByText('他の端末と記録を引き継ぐ')).not.toBeInTheDocument());
    expect(fetchSyncUids).toHaveBeenCalledWith('A3K9P2');
    expect(getMarkedEventsSnapshot().records['event-a']).toBeDefined();
    expect(getMarkedEventsSnapshot().records['event-b']).toBeDefined();
  });

  it('shows an error message and keeps the modal open when redeeming fails', async () => {
    vi.mocked(fetchSyncUids).mockRejectedValue(
      new Error('コードが見つからないか、有効期限が切れています。もう一度発行し直してください。'),
    );
    renderWithChakra(<SyncButton />);

    openModal();
    fireEvent.change(screen.getByPlaceholderText('コードを入力'), { target: { value: 'ZZZZZZ' } });
    fireEvent.click(screen.getByRole('button', { name: '取り込む' }));

    expect(await screen.findByText('コードが見つからないか、有効期限が切れています。もう一度発行し直してください。')).toBeInTheDocument();
    expect(screen.getByText('他の端末と記録を引き継ぐ')).toBeInTheDocument();
  });

  it('resets the issued code when the modal is closed and reopened', async () => {
    updateMarkedEventsData((previous) => markEvent(previous, 'event-1', NOW));
    vi.mocked(createSyncCode).mockResolvedValue({ code: 'ABC123', expiresAt: '2026-01-10T12:10:00+09:00' });
    renderWithChakra(<SyncButton />);

    openModal();
    fireEvent.click(screen.getByRole('button', { name: 'コードを発行する' }));
    await screen.findByText('ABC123');

    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.queryByText('他の端末と記録を引き継ぐ')).not.toBeInTheDocument());

    openModal();

    expect(screen.getByRole('button', { name: 'コードを発行する' })).toBeInTheDocument();
    expect(screen.queryByText('ABC123')).not.toBeInTheDocument();
  });
});
