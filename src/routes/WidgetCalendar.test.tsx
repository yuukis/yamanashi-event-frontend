import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithChakra } from '../test/test-utils';
import WidgetCalendar from './WidgetCalendar';
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

describe('WidgetCalendar', () => {
  beforeEach(() => {
    vi.mocked(fetchEvents).mockReset();
    vi.setSystemTime(FIXED_NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('opens a day overlay with a link to the primary source when a day with events is clicked', async () => {
    mockEvents([makeEvent({
      uid: 'event-1',
      title: '甲府もくもく会',
      event_url: 'https://example.com/event/1',
      started_at: '2026-01-15T19:00:00+09:00',
      ended_at: '2026-01-15T21:00:00+09:00',
    })]);
    renderWithChakra(<WidgetCalendar />);

    const day15 = await screen.findByLabelText(/^1月15日 イベントあり/);
    fireEvent.click(day15);

    const link = await screen.findByRole('link', { name: '甲府もくもく会' });
    expect(link).toHaveAttribute('href', 'https://example.com/event/1');
    expect(link).toHaveAttribute('target', '_blank');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('1月15日(木)')).toBeInTheDocument();
  });

  it('does not open an overlay when a day without events is clicked', async () => {
    mockEvents([]);
    renderWithChakra(<WidgetCalendar />);

    fireEvent.click(await screen.findByLabelText(/^1月10日 今日/));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes the day overlay when the close button is clicked', async () => {
    mockEvents([makeEvent({ started_at: '2026-01-15T19:00:00+09:00', ended_at: '2026-01-15T21:00:00+09:00' })]);
    renderWithChakra(<WidgetCalendar />);

    fireEvent.click(await screen.findByLabelText(/^1月15日 イベントあり/));
    fireEvent.click(await screen.findByRole('button', { name: 'Close' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('closes the day overlay when the backdrop is clicked', async () => {
    const user = userEvent.setup();
    mockEvents([makeEvent({ started_at: '2026-01-15T19:00:00+09:00', ended_at: '2026-01-15T21:00:00+09:00' })]);
    const { container } = renderWithChakra(<WidgetCalendar />);

    fireEvent.click(await screen.findByLabelText(/^1月15日 イベントあり/));
    await screen.findByRole('dialog');

    const overlay = container.ownerDocument.querySelector('.chakra-modal__content-container') as HTMLElement;
    await user.click(overlay);

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('closes the day overlay when Escape is pressed', async () => {
    mockEvents([makeEvent({ started_at: '2026-01-15T19:00:00+09:00', ended_at: '2026-01-15T21:00:00+09:00' })]);
    renderWithChakra(<WidgetCalendar />);

    fireEvent.click(await screen.findByLabelText(/^1月15日 イベントあり/));
    const dialog = await screen.findByRole('dialog');

    fireEvent.keyDown(dialog, { key: 'Escape' });

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('suppresses a tooltip whose open-delay timer was still pending when the day was clicked', async () => {
    // ホバー/フォーカスから200ms以内にクリックすると、ツールチップの
    // 遅延オープン用タイマーが「クリック時点ではまだisOpen=falseだった」
    // ために閉じるロジックをすり抜け、モーダルの裏で後からツールチップが
    // 開いてしまうことがあった。suppressTooltipsで確実に止まることを
    // 確認する。
    vi.useRealTimers();
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_NOW);
    mockEvents([makeEvent({
      title: 'テストイベント',
      started_at: '2026-01-15T19:00:00+09:00',
      ended_at: '2026-01-15T21:00:00+09:00',
    })]);
    renderWithChakra(<WidgetCalendar />);

    await act(async () => {
      await vi.runOnlyPendingTimersAsync();
    });

    const day15 = screen.getByLabelText(/^1月15日 イベントあり/);
    fireEvent.focus(day15); // schedules the tooltip's 200ms open timer
    fireEvent.click(day15); // opens the modal well before the timer fires

    await act(async () => {
      await vi.advanceTimersByTimeAsync(500); // past the tooltip's openDelay
    });

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('keeps the flex chain intact so the calendar grid can grow to fill the available height', async () => {
    // 日別オーバーレイ用のラッパーがdisplay:flexでないと、内側の
    // MiniEventCalendar(fillHeight)のflex="1"が効かずマスが伸びなくなる
    // (縦幅が元に戻る不具合の再発防止)。
    mockEvents([]);
    renderWithChakra(<WidgetCalendar />);

    const wrapper = await screen.findByTestId('calendar-fill-wrapper');
    expect(getComputedStyle(wrapper).display).toBe('flex');
    expect(getComputedStyle(wrapper).flexDirection).toBe('column');
  });

  it('limits forward navigation to 4 months ahead and disables the next button at the boundary', async () => {
    mockEvents([]);
    renderWithChakra(<WidgetCalendar />);

    const nextButton = await screen.findByLabelText('次月を表示');
    for (let i = 0; i < 4; i++) {
      fireEvent.click(nextButton);
    }

    expect(await screen.findByText('2026年5月')).toBeInTheDocument();
    expect(nextButton).toBeDisabled();

    fireEvent.click(nextButton);
    expect(screen.getByText('2026年5月')).toBeInTheDocument();
  });

  it('limits backward navigation to 4 months behind and disables the previous button at the boundary', async () => {
    mockEvents([]);
    renderWithChakra(<WidgetCalendar />);

    const prevButton = await screen.findByLabelText('前月を表示');
    for (let i = 0; i < 4; i++) {
      fireEvent.click(prevButton);
    }

    expect(await screen.findByText('2025年9月')).toBeInTheDocument();
    expect(prevButton).toBeDisabled();

    fireEvent.click(prevButton);
    expect(screen.getByText('2025年9月')).toBeInTheDocument();
  });

  it('lists every event of the day in the overlay, in the order provided', async () => {
    mockEvents([
      makeEvent({ uid: 'a', title: 'イベントA', started_at: '2026-01-15T09:00:00+09:00', ended_at: '2026-01-15T10:00:00+09:00' }),
      makeEvent({ uid: 'b', title: 'イベントB', started_at: '2026-01-15T19:00:00+09:00', ended_at: '2026-01-15T20:00:00+09:00' }),
    ]);
    renderWithChakra(<WidgetCalendar />);

    fireEvent.click(await screen.findByLabelText(/^1月15日 イベントあり/));

    expect(await screen.findByText('イベントA')).toBeInTheDocument();
    expect(screen.getByText('イベントB')).toBeInTheDocument();
  });
});
