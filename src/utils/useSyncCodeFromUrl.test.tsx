import { StrictMode } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import { MemoryRouter } from 'react-router-dom';
import axios from 'axios';
import AppTheme from '../theme';
import { useSyncCodeFromUrl } from './sync';
import { updateMarkedEventsData, getMarkedEventsSnapshot } from './markedEventsStore';
import { EMPTY_MARKED_EVENTS_DATA, markEvent } from './markedEvents';

vi.mock('axios');

function Harness() {
  useSyncCodeFromUrl();
  return null;
}

function renderAtUrl(initialEntry: string) {
  return render(
    <StrictMode>
      <ChakraProvider theme={AppTheme}>
        <MemoryRouter initialEntries={[initialEntry]}>
          <Harness />
        </MemoryRouter>
      </ChakraProvider>
    </StrictMode>,
  );
}

describe('useSyncCodeFromUrl', () => {
  beforeEach(() => {
    updateMarkedEventsData(() => EMPTY_MARKED_EVENTS_DATA);
    vi.mocked(axios.get).mockReset();
    vi.mocked(axios.isAxiosError).mockReset();
  });

  it('does nothing when the URL has no sync query param', () => {
    renderAtUrl('/');

    expect(axios.get).not.toHaveBeenCalled();
  });

  it('fetches the code, merges the uids into markedEventsStore, and shows a success toast', async () => {
    vi.mocked(axios.get).mockResolvedValue({ data: { version: 1, uids: ['event-a', 'event-b'] } });

    renderAtUrl('/?sync=ABC123');

    await waitFor(() => expect(getMarkedEventsSnapshot().records['event-a']).toBeDefined());
    expect(getMarkedEventsSnapshot().records['event-b']).toBeDefined();
    expect(await screen.findByText('2件の記録を取り込みました')).toBeInTheDocument();
  });

  it('does not overwrite a uid that is already marked on this device', async () => {
    const earlier = new Date('2026-01-01T00:00:00+09:00');
    updateMarkedEventsData((previous) => markEvent(previous, 'event-a', earlier));
    vi.mocked(axios.get).mockResolvedValue({ data: { version: 1, uids: ['event-a'] } });

    renderAtUrl('/?sync=ABC123');

    expect(await screen.findByText('この端末にはすでにすべての記録があります')).toBeInTheDocument();
    expect(getMarkedEventsSnapshot().records['event-a'].markedAt).toBe(earlier.toISOString());
  });

  it('shows an error toast when the code is missing or expired', async () => {
    vi.mocked(axios.isAxiosError).mockReturnValue(true);
    vi.mocked(axios.get).mockRejectedValue({ response: { status: 404 } });

    renderAtUrl('/?sync=BADCODE');

    expect(
      await screen.findByText('コードが見つからないか、有効期限が切れています。もう一度発行し直してください。'),
    ).toBeInTheDocument();
  });

  it('requests the code endpoint only once even under StrictMode double-invocation', async () => {
    vi.mocked(axios.get).mockResolvedValue({ data: { version: 1, uids: ['event-a'] } });

    renderAtUrl('/?sync=ABC123');

    await waitFor(() => expect(getMarkedEventsSnapshot().records['event-a']).toBeDefined());
    expect(axios.get).toHaveBeenCalledTimes(1);
  });
});
