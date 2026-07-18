import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, fireEvent, waitFor, act, within } from '@testing-library/react';
import { renderWithChakra, mockMatchMedia } from '../test/test-utils';
import { EventBody, EmptyEventBody, ErrorEventBody } from './EventBody';
import { makeEvent } from '../test/fixtures';
import { updateTrackingData } from '../utils/newEventTrackingStore';
import type { NewEventTrackingData } from '../utils/newEventTracking';
import { buildEventShareUrl, buildXShareUrl } from '../utils/share';
import { getEventAnchorId } from '../utils/eventAnchors';
import { EVENT_CARD_HIGHLIGHT_EVENT } from '../utils/hashScroll';
import { updateMarkedEventsData } from '../utils/markedEventsStore';
import { EMPTY_MARKED_EVENTS_DATA } from '../utils/markedEvents';
const FIXED_NOW = new Date('2026-01-10T12:00:00+09:00');
const EMPTY_TRACKING_DATA: NewEventTrackingData = { version: 1, records: {}, dismissedUids: [], acknowledgedDotUids: [] };

vi.mock('../utils/nowTicker', () => ({
  subscribeNow: () => () => {},
  getNow: () => FIXED_NOW,
}));

describe('EventBody', () => {
  beforeEach(() => {
    updateTrackingData(() => EMPTY_TRACKING_DATA);
    updateMarkedEventsData(() => EMPTY_MARKED_EVENTS_DATA);
  });

  it('renders the event title, address and place', () => {
    mockMatchMedia(true); // desktop layout renders the title as a link
    renderWithChakra(
      <EventBody event={makeEvent({
                   title: '甲府もくもく会 #1',
                   address: '山梨県甲府市',
                   place: 'テックビル 3F',
                   started_at: '2026-01-05T19:00:00+09:00',
                   ended_at: '2026-01-05T21:00:00+09:00',
                 })}
                 />,
    );

    expect(screen.getByText('甲府もくもく会 #1')).toBeInTheDocument();
    expect(screen.getByText('山梨県甲府市')).toBeInTheDocument();
    expect(screen.getByText('テックビル 3F')).toBeInTheDocument();
  });

  it('shows an "ongoing" badge when the event is currently happening', () => {
    mockMatchMedia(true);
    renderWithChakra(
      <EventBody event={makeEvent({
                   started_at: '2026-01-10T11:00:00+09:00',
                   ended_at: '2026-01-10T13:00:00+09:00',
                 })}
                 />,
    );

    expect(screen.getByText('開催中')).toBeInTheDocument();
  });

  it('shows a "today" badge when the event starts later today', () => {
    mockMatchMedia(true);
    renderWithChakra(
      <EventBody event={makeEvent({
                   started_at: '2026-01-10T18:00:00+09:00',
                   ended_at: '2026-01-10T20:00:00+09:00',
                 })}
                 />,
    );

    expect(screen.getByText('本日開催')).toBeInTheDocument();
  });

  it('shows no badge for a past event', () => {
    mockMatchMedia(true);
    renderWithChakra(
      <EventBody event={makeEvent({
                   started_at: '2026-01-01T18:00:00+09:00',
                   ended_at: '2026-01-01T20:00:00+09:00',
                 })}
                 />,
    );

    expect(screen.queryByText('開催中')).not.toBeInTheDocument();
    expect(screen.queryByText('本日開催')).not.toBeInTheDocument();
  });

  it('shows a "NEW" badge for a new, not-yet-started event', () => {
    mockMatchMedia(true);
    updateTrackingData(() => ({ ...EMPTY_TRACKING_DATA, records: { 'event-1': { firstSeenAt: FIXED_NOW.toISOString() } } }));
    renderWithChakra(
      <EventBody event={makeEvent({
                   uid: 'event-1',
                   started_at: '2026-01-15T10:00:00+09:00',
                   ended_at: '2026-01-15T12:00:00+09:00',
                   updated_at: '2026-01-09T00:00:00+09:00',
                 })}
                 />,
    );

    expect(screen.getByText('NEW')).toBeInTheDocument();
  });

  it('does not show a "NEW" badge for an event with no tracked first-seen record', () => {
    mockMatchMedia(true);
    renderWithChakra(
      <EventBody event={makeEvent({
                   uid: 'event-1',
                   started_at: '2026-01-15T10:00:00+09:00',
                   ended_at: '2026-01-15T12:00:00+09:00',
                 })}
                 />,
    );

    expect(screen.queryByText('NEW')).not.toBeInTheDocument();
  });

  it('prioritizes the "ongoing" badge over "NEW" when both would otherwise apply', () => {
    mockMatchMedia(true);
    updateTrackingData(() => ({ ...EMPTY_TRACKING_DATA, records: { 'event-1': { firstSeenAt: FIXED_NOW.toISOString() } } }));
    renderWithChakra(
      <EventBody event={makeEvent({
                   uid: 'event-1',
                   started_at: '2026-01-10T11:00:00+09:00',
                   ended_at: '2026-01-10T13:00:00+09:00',
                 })}
                 />,
    );

    expect(screen.getByText('開催中')).toBeInTheDocument();
    expect(screen.queryByText('NEW')).not.toBeInTheDocument();
  });

  it('always renders a per-event jump anchor, independent of the date-level anchorId prop', () => {
    mockMatchMedia(true);
    const { container } = renderWithChakra(
      <EventBody event={makeEvent({ uid: 'my-uid' })} />,
    );

    expect(container.querySelector(`#${getEventAnchorId('my-uid')}`)).not.toBeNull();
  });

  describe('shared-event highlight', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('highlights the card when the shared-event custom event fires on it, and clears the highlight after a delay', () => {
      mockMatchMedia(true);
      const { container } = renderWithChakra(
        <EventBody event={makeEvent({ uid: 'my-uid' })} />,
      );

      const card = container.querySelector('[data-event-card]') as HTMLElement;
      expect(card.className).not.toMatch(/event-card-highlight/);

      act(() => {
        card.dispatchEvent(new CustomEvent(EVENT_CARD_HIGHLIGHT_EVENT));
      });
      expect(card.className).toMatch(/event-card-highlight/);

      act(() => {
        vi.advanceTimersByTime(2000);
      });
      expect(card.className).not.toMatch(/event-card-highlight/);
    });
  });

  it('renders the group name instead of the owner name when a group is present', () => {
    mockMatchMedia(true);
    renderWithChakra(
      <EventBody event={makeEvent({ owner_name: 'オーナー太郎', group_name: 'テストグループ' })} />,
    );

    expect(screen.getByText('テストグループ')).toBeInTheDocument();
    expect(screen.queryByText('オーナー太郎')).not.toBeInTheDocument();
  });

  it('renders the owner name when there is no group', () => {
    mockMatchMedia(true);
    renderWithChakra(
      <EventBody event={makeEvent({ owner_name: 'オーナー太郎', group_name: null })} />,
    );

    expect(screen.getByText('オーナー太郎')).toBeInTheDocument();
  });

  it('shows an archive badge when the event has an archive source', () => {
    mockMatchMedia(true);
    renderWithChakra(
      <EventBody event={makeEvent({ archive_source: 'connpass' })} />,
    );

    expect(screen.getByText('アーカイブ')).toBeInTheDocument();
  });

  it('calls onKeywordClick when a keyword tag is clicked on desktop', () => {
    mockMatchMedia(true);
    const onKeywordClick = vi.fn();
    renderWithChakra(
      <EventBody event={makeEvent({ keywords: ['React', 'TypeScript'] })}
                 selectedKeyword={null}
                 onKeywordClick={onKeywordClick}
                 />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'React' }));

    expect(onKeywordClick).toHaveBeenCalledWith('React');
  });

  it('does not make keyword tags clickable on mobile layout', () => {
    mockMatchMedia(false);
    const onKeywordClick = vi.fn();
    renderWithChakra(
      <EventBody event={makeEvent({ keywords: ['React'] })}
                 selectedKeyword={null}
                 onKeywordClick={onKeywordClick}
                 />,
    );

    expect(screen.queryByRole('button', { name: 'React' })).not.toBeInTheDocument();
    expect(screen.getByText('React')).toBeInTheDocument();
  });

  it('opens an X(Twitter) search scoped to the event day with since_time/until_time and f=live', () => {
    mockMatchMedia(true);
    const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    renderWithChakra(
      <EventBody event={makeEvent({
                   title: '甲府もくもく会 #1',
                   started_at: '2026-01-05T19:00:00+09:00',
                   ended_at: '2026-01-05T21:00:00+09:00',
                 })}
                 />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Options' }));
    fireEvent.click(screen.getByText('イベント当日の X(Twitter) 投稿を検索'));

    const since_time = Math.floor(new Date('2026-01-05T00:00:00+09:00').getTime() / 1000);
    const until_time = Math.floor(new Date('2026-01-05T23:59:59+09:00').getTime() / 1000);
    const expected_query = encodeURIComponent(`since_time:${since_time} until_time:${until_time} "甲府もくもく会 #1"`);

    expect(windowOpenSpy).toHaveBeenCalledWith(`https://x.com/search?q=${expected_query}&f=live`);

    windowOpenSpy.mockRestore();
  });

  it('opens a keyword-only X(Twitter) search (no since_time/until_time) for an event that has not ended yet', () => {
    mockMatchMedia(true);
    const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    renderWithChakra(
      <EventBody event={makeEvent({
                   title: '甲府もくもく会 #1',
                   started_at: '2026-01-15T19:00:00+09:00',
                   ended_at: '2026-01-15T21:00:00+09:00',
                 })}
                 />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Options' }));

    expect(screen.queryByText('イベント当日の X(Twitter) 投稿を検索')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('イベントに関する X(Twitter) 投稿を検索'));

    const expected_query = encodeURIComponent('"甲府もくもく会 #1"');
    expect(windowOpenSpy).toHaveBeenCalledWith(`https://x.com/search?q=${expected_query}&f=live`);

    windowOpenSpy.mockRestore();
  });

  it('opens the X(Twitter) share intent for the event card URL on desktop', () => {
    mockMatchMedia(true);
    const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    const event = makeEvent({ uid: 'event-1', title: '甲府もくもく会 #1', hash_tag: 'kofu' });
    renderWithChakra(<EventBody event={event} />);

    fireEvent.click(screen.getByRole('button', { name: 'X(Twitter)でシェア' }));

    const expected_url = buildXShareUrl({
      title: event.title,
      url: buildEventShareUrl(event.uid),
      hashTag: event.hash_tag,
    });
    expect(windowOpenSpy).toHaveBeenCalledWith(expected_url);

    windowOpenSpy.mockRestore();
  });

  it('invokes the native Web Share API from the desktop icon row when supported', async () => {
    mockMatchMedia(true);
    const shareSpy = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', { value: shareSpy, configurable: true });
    const event = makeEvent({ uid: 'event-1', title: '甲府もくもく会 #1', hash_tag: 'kofu' });
    renderWithChakra(<EventBody event={event} />);

    fireEvent.click(screen.getByRole('button', { name: '共有' }));

    await waitFor(() => expect(shareSpy).toHaveBeenCalledWith({
      title: event.title,
      text: '甲府もくもく会 #1 #kofu',
      url: buildEventShareUrl(event.uid),
    }));

    Reflect.deleteProperty(navigator, 'share');
  });

  it('shows no native share icon on desktop when the Web Share API is unsupported', () => {
    mockMatchMedia(true);
    expect(navigator.share).toBeUndefined();
    const event = makeEvent({ uid: 'event-1' });
    renderWithChakra(<EventBody event={event} />);

    expect(screen.queryByRole('button', { name: '共有' })).not.toBeInTheDocument();
  });

  it('copies only the event card URL to the clipboard and shows a confirmation toast on desktop', async () => {
    mockMatchMedia(true);
    const writeTextSpy = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();
    const event = makeEvent({ uid: 'event-1', title: '甲府もくもく会 #1', hash_tag: 'kofu' });
    renderWithChakra(<EventBody event={event} />);

    fireEvent.click(screen.getByRole('button', { name: 'リンクをコピー' }));

    expect(writeTextSpy).toHaveBeenCalledWith(buildEventShareUrl(event.uid));
    await screen.findByText('リンクをコピーしました');

    writeTextSpy.mockRestore();
  });

  it('shows an error toast instead of throwing when the Clipboard API is unavailable', async () => {
    mockMatchMedia(true);
    const originalClipboard = navigator.clipboard;
    Reflect.deleteProperty(navigator, 'clipboard');
    const event = makeEvent({ uid: 'event-1', title: '甲府もくもく会 #1' });
    renderWithChakra(<EventBody event={event} />);

    expect(() => fireEvent.click(screen.getByRole('button', { name: 'リンクをコピー' }))).not.toThrow();
    await screen.findByText('コピーに失敗しました');

    Object.defineProperty(navigator, 'clipboard', { value: originalClipboard, configurable: true });
  });

  it('invokes the native Web Share API from a single 共有 button on the mobile long-press menu and closes it', async () => {
    mockMatchMedia(false);
    const shareSpy = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', { value: shareSpy, configurable: true });
    const event = makeEvent({ uid: 'event-1', title: '甲府もくもく会 #1', hash_tag: 'kofu' });
    renderWithChakra(<EventBody event={event} />);

    fireEvent.click(screen.getByLabelText('More options'));
    fireEvent.click(screen.getByRole('button', { name: '共有' }));

    await waitFor(() => expect(shareSpy).toHaveBeenCalledWith({
      title: event.title,
      text: '甲府もくもく会 #1 #kofu',
      url: buildEventShareUrl(event.uid),
    }));
    await waitFor(() => expect(screen.queryByRole('button', { name: 'キャンセル' })).not.toBeInTheDocument());

    Reflect.deleteProperty(navigator, 'share');
  });

  it('includes the title alone in the native share text when the event has no hashtag', async () => {
    mockMatchMedia(false);
    const shareSpy = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', { value: shareSpy, configurable: true });
    const event = makeEvent({ uid: 'event-1', title: '甲府もくもく会 #1', hash_tag: null });
    renderWithChakra(<EventBody event={event} />);

    fireEvent.click(screen.getByLabelText('More options'));
    fireEvent.click(screen.getByRole('button', { name: '共有' }));

    await waitFor(() => expect(shareSpy).toHaveBeenCalledWith({
      title: event.title,
      text: event.title,
      url: buildEventShareUrl(event.uid),
    }));

    Reflect.deleteProperty(navigator, 'share');
  });

  it('shows no share button on the mobile long-press menu when the Web Share API is unsupported', () => {
    mockMatchMedia(false);
    expect(navigator.share).toBeUndefined();
    const event = makeEvent({ uid: 'event-1' });
    renderWithChakra(<EventBody event={event} />);

    fireEvent.click(screen.getByLabelText('More options'));

    expect(screen.queryByRole('button', { name: '共有' })).not.toBeInTheDocument();
  });

  describe('attendance mark', () => {
    it('marks the event and opens a popover with a share action on desktop', async () => {
      mockMatchMedia(true);
      const shareSpy = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'share', { value: shareSpy, configurable: true });
      const event = makeEvent({ uid: 'event-1' });
      renderWithChakra(<EventBody event={event} />);

      fireEvent.click(screen.getByRole('button', { name: '行きたいに追加' }));

      expect(screen.getByRole('button', { name: '行きたいから外す' })).toBeInTheDocument();
      const popoverText = await screen.findByText('行きたいに追加しました');
      const popoverButtons = within(popoverText.parentElement as HTMLElement).getAllByRole('button');
      expect(popoverButtons.map((button) => button.textContent)).toEqual(['X(Twitter)でシェア', '共有']);

      Reflect.deleteProperty(navigator, 'share');
    });

    it('opens the X(Twitter) share intent from the desktop popover', async () => {
      mockMatchMedia(true);
      const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
      const event = makeEvent({ uid: 'event-1', title: '甲府もくもく会 #1', hash_tag: 'kofu' });
      renderWithChakra(<EventBody event={event} />);

      fireEvent.click(screen.getByRole('button', { name: '行きたいに追加' }));
      const popoverText = await screen.findByText('行きたいに追加しました');
      fireEvent.click(within(popoverText.parentElement as HTMLElement).getByRole('button', { name: 'X(Twitter)でシェア' }));

      const expected_url = buildXShareUrl({
        title: event.title,
        url: buildEventShareUrl(event.uid),
        hashTag: event.hash_tag,
      });
      expect(windowOpenSpy).toHaveBeenCalledWith(expected_url);

      windowOpenSpy.mockRestore();
    });

    it('unmarks the event on a second click and does not reopen the popover', () => {
      mockMatchMedia(true);
      const event = makeEvent({ uid: 'event-1' });
      renderWithChakra(<EventBody event={event} />);

      fireEvent.click(screen.getByRole('button', { name: '行きたいに追加' }));
      fireEvent.click(screen.getByRole('button', { name: '行きたいから外す' }));

      expect(screen.getByRole('button', { name: '行きたいに追加' })).toBeInTheDocument();
      expect(screen.queryByText('行きたいに追加しました')).not.toBeInTheDocument();
    });

    it('shows a toast whose share action invokes the native Web Share API directly on mobile', async () => {
      mockMatchMedia(false);
      const shareSpy = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'share', { value: shareSpy, configurable: true });
      const event = makeEvent({ uid: 'event-1', title: '甲府もくもく会 #1', hash_tag: 'kofu' });
      renderWithChakra(<EventBody event={event} />);

      fireEvent.click(screen.getByRole('button', { name: '行きたいに追加' }));

      await screen.findByText('行きたいに追加しました');
      fireEvent.click(screen.getByRole('button', { name: 'シェアする' }));

      await waitFor(() => expect(shareSpy).toHaveBeenCalledWith({
        title: event.title,
        text: '甲府もくもく会 #1 #kofu',
        url: buildEventShareUrl(event.uid),
      }));
      expect(screen.queryByRole('button', { name: 'キャンセル' })).not.toBeInTheDocument();

      Reflect.deleteProperty(navigator, 'share');
    });

    it('falls back to opening the options drawer from the toast when the Web Share API is unsupported', async () => {
      mockMatchMedia(false);
      expect(navigator.share).toBeUndefined();
      const event = makeEvent({ uid: 'event-1' });
      renderWithChakra(<EventBody event={event} />);

      fireEvent.click(screen.getByRole('button', { name: '行きたいに追加' }));

      await screen.findByText('行きたいに追加しました');
      fireEvent.click(screen.getByRole('button', { name: 'シェアする' }));

      expect(await screen.findByRole('button', { name: 'キャンセル' })).toBeInTheDocument();
    });

    it('lets the user mark the event from the mobile options drawer without closing it', () => {
      mockMatchMedia(false);
      const event = makeEvent({ uid: 'event-1' });
      renderWithChakra(<EventBody event={event} />);

      fireEvent.click(screen.getByLabelText('More options'));
      fireEvent.click(screen.getByRole('button', { name: '行きたいに追加' }));

      expect(screen.getByRole('button', { name: '行きたいから外す' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'キャンセル' })).toBeInTheDocument();
    });

    it('persists the marked state across remounts', () => {
      mockMatchMedia(true);
      const event = makeEvent({ uid: 'event-1' });
      const { unmount } = renderWithChakra(<EventBody event={event} />);
      fireEvent.click(screen.getByRole('button', { name: '行きたいに追加' }));
      unmount();

      renderWithChakra(<EventBody event={event} />);

      expect(screen.getByRole('button', { name: '行きたいから外す' })).toBeInTheDocument();
    });
  });
});

describe('EmptyEventBody', () => {
  it('shows the empty-state message', () => {
    renderWithChakra(<EmptyEventBody />);

    expect(screen.getByText('イベントはありません')).toBeInTheDocument();
  });
});

describe('ErrorEventBody', () => {
  it('shows the error message when provided', () => {
    renderWithChakra(<ErrorEventBody message={'Network Error'} />);

    expect(screen.getByText('イベント情報の取得に失敗しました')).toBeInTheDocument();
    expect(screen.getByText('Network Error')).toBeInTheDocument();
  });

  it('omits the detail line when no message is provided', () => {
    renderWithChakra(<ErrorEventBody message={undefined} />);

    expect(screen.getByText('イベント情報の取得に失敗しました')).toBeInTheDocument();
  });
});
