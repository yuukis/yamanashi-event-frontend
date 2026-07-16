import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { renderWithChakra } from '../test/test-utils';
import { ICalendarButton } from './Site';
import { makeEvent } from '../test/fixtures';
import { fetchEvents } from '../utils/api';

const FIXED_NOW = new Date('2026-01-10T12:00:00+09:00');

vi.mock('../utils/nowTicker', () => ({
  subscribeNow: () => () => {},
  getNow: () => FIXED_NOW,
}));

vi.mock('../utils/api', () => ({
  fetchEvents: vi.fn(),
}));

function mockEvents(events: ReturnType<typeof makeEvent>[]) {
  vi.mocked(fetchEvents).mockResolvedValue({ events, lastModified: null });
}

function renderButton() {
  renderWithChakra(<ICalendarButton />);
  return screen.getByRole('button');
}

async function expectAccessibleName(button: HTMLElement, name: string) {
  await waitFor(() => expect(button).toHaveAccessibleName(name));
}

// Popover content mounts with `visibility: hidden` during its entrance
// transition, which `getByRole` treats as inaccessible; `findByRole` polls
// (with real timers) until the transition settles before returning it.
async function openIcalPopover() {
  const button = renderButton();
  await expectAccessibleName(button, 'イベントカレンダー');
  fireEvent.click(button);
  return screen.findByRole('button', { name: 'お使いのカレンダーアプリでも見られます' });
}

async function openAndExpandIcalPanel() {
  const discoveryLink = await openIcalPopover();
  fireEvent.click(discoveryLink);
}

describe('ICalendarButton', () => {
  beforeEach(() => {
    vi.mocked(fetchEvents).mockReset();
    vi.setSystemTime(FIXED_NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows the normal state with no border or dot when there is no event today', async () => {
    mockEvents([]);
    const button = renderButton();

    await expectAccessibleName(button, 'イベントカレンダー');
    expect(screen.queryByTestId('header-ongoing-dot')).not.toBeInTheDocument();
  });

  it('shows a highlighted border but no dot for an event happening later today', async () => {
    mockEvents([makeEvent({
      started_at: '2026-01-10T18:00:00+09:00',
      ended_at: '2026-01-10T20:00:00+09:00',
    })]);
    const button = renderButton();

    await expectAccessibleName(button, '本日開催のイベントがあります');
    expect(screen.queryByTestId('header-ongoing-dot')).not.toBeInTheDocument();
  });

  it('shows the border and a pulsing dot for an event currently in progress', async () => {
    mockEvents([makeEvent({
      started_at: '2026-01-10T11:00:00+09:00',
      ended_at: '2026-01-10T13:00:00+09:00',
    })]);
    const button = renderButton();

    await expectAccessibleName(button, '開催中のイベントがあります');
    expect(screen.getByTestId('header-ongoing-dot')).toBeInTheDocument();
  });

  it('reverts to the normal state once the event has ended', async () => {
    mockEvents([makeEvent({
      started_at: '2026-01-10T08:00:00+09:00',
      ended_at: '2026-01-10T09:00:00+09:00',
    })]);
    const button = renderButton();

    await expectAccessibleName(button, 'イベントカレンダー');
    expect(screen.queryByTestId('header-ongoing-dot')).not.toBeInTheDocument();
  });

  describe('external calendar registration panel', () => {
    it('stays collapsed behind a discovery link until it is clicked', async () => {
      mockEvents([]);
      const discoveryLink = await openIcalPopover();

      expect(discoveryLink).toBeInTheDocument();
      expect(screen.queryByRole('link', { name: 'Google カレンダーに登録する' })).not.toBeInTheDocument();
    });

    it('reveals the Google/Outlook/Apple links and the iCalendar URL once expanded', async () => {
      mockEvents([]);
      await openAndExpandIcalPanel();

      expect(screen.getByRole('link', { name: 'Google カレンダーに登録する' }))
        .toHaveAttribute('href', 'https://calendar.google.com/calendar/render?cid=webcal%3A%2F%2Fhub.yamanashi.dev%2Fevent.ics');
      expect(screen.getByRole('link', { name: 'Outlook に登録する' }))
        .toHaveAttribute('href', 'https://outlook.live.com/calendar/0/addfromweb?url=https%3A%2F%2Fhub.yamanashi.dev%2Fevent.ics&name=IT%E3%82%A4%E3%83%99%E3%83%B3%E3%83%88%20-%20%E5%B1%B1%E6%A2%A8%E7%9C%8C');
      expect(screen.getByRole('link', { name: 'Apple カレンダーに登録する' }))
        .toHaveAttribute('href', 'webcal://hub.yamanashi.dev/event.ics');
      expect(screen.getByRole('textbox')).toHaveValue('https://hub.yamanashi.dev/event.ics');
    });

    it('copies the iCalendar URL to the clipboard and reverts the confirmation after a delay', async () => {
      mockEvents([]);
      const writeTextSpy = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();
      await openAndExpandIcalPanel();

      const copyButton = screen.getByRole('button', { name: 'iCalendar URLをコピー' });
      const initialIcon = copyButton.innerHTML;

      fireEvent.click(copyButton);

      expect(writeTextSpy).toHaveBeenCalledWith('https://hub.yamanashi.dev/event.ics');
      await waitFor(() => expect(copyButton.innerHTML).not.toBe(initialIcon));
      await waitFor(() => expect(copyButton.innerHTML).toBe(initialIcon), { timeout: 2500 });

      writeTextSpy.mockRestore();
    });

    it('resets the copied confirmation if a later copy attempt fails after an earlier success', async () => {
      mockEvents([]);
      const writeTextSpy = vi.spyOn(navigator.clipboard, 'writeText')
        .mockResolvedValueOnce()
        .mockRejectedValueOnce(new Error('denied'));
      await openAndExpandIcalPanel();

      const copyButton = screen.getByRole('button', { name: 'iCalendar URLをコピー' });
      const initialIcon = copyButton.innerHTML;
      const input = screen.getByRole('textbox') as HTMLInputElement;

      fireEvent.click(copyButton);
      await waitFor(() => expect(copyButton.innerHTML).not.toBe(initialIcon));

      fireEvent.click(copyButton);
      await waitFor(() => expect(input.selectionEnd).toBe(input.value.length));
      expect(copyButton.innerHTML).toBe(initialIcon);

      writeTextSpy.mockRestore();
    });

    it('falls back to selecting the URL text when the Clipboard API is unavailable', async () => {
      mockEvents([]);
      const originalClipboard = navigator.clipboard;
      Reflect.deleteProperty(navigator, 'clipboard');

      await openAndExpandIcalPanel();

      const copyButton = screen.getByRole('button', { name: 'iCalendar URLをコピー' });
      const input = screen.getByRole('textbox') as HTMLInputElement;

      fireEvent.click(copyButton);

      expect(input.selectionStart).toBe(0);
      expect(input.selectionEnd).toBe(input.value.length);

      Object.defineProperty(navigator, 'clipboard', { value: originalClipboard, configurable: true });
    });
  });
});
