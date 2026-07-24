import { useState, useEffect, useRef, useSyncExternalStore } from 'react';
import { HStack, Text, Button, useMediaQuery, useDisclosure, useToast } from '@chakra-ui/react';
import { formatEventDateKey } from '../utils/eventAnchors';
import { EVENT_CARD_HIGHLIGHT_EVENT } from '../utils/hashScroll';
import { NATIVE_SHARE_LABEL } from './ShareButtons';
import { isNativeShareSupported, shareEventViaNativeShare } from '../utils/share';
import { subscribeNow, getNow } from '../utils/nowTicker';
import { isEventNew } from '../utils/newEventTracking';
import { subscribeTrackingData, getTrackingDataSnapshot } from '../utils/newEventTrackingStore';
import { isEventMarked, markEvent, unmarkEvent } from '../utils/markedEvents';
import { isArchiveEvent } from '../utils/eventGroups';
import { subscribeMarkedEvents, getMarkedEventsSnapshot, updateMarkedEventsData } from '../utils/markedEventsStore';
import { buildGroupPagePath } from '../utils/groupPage';
import type { EventWithGroup } from '../types/events';

const DAY_OF_WEEK = ['日', '月', '火', '水', '木', '金', '土'];

export type EventBodyProps = {
  event: EventWithGroup;
  anchorId?: string;
  selectedKeyword?: string | null;
  onKeywordClick?: (keyword: string) => void;
  enableSummarizer?: boolean;
  summaryDescriptionYear?: number;
};

function buildJstDayScopedSearchPrefix(start_date: Date): string {
  const jst_date_formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const jst_date_parts = jst_date_formatter.formatToParts(start_date);
  const jst_date_part = (type: string) => jst_date_parts.find((part) => part.type === type)?.value;
  const start_date_str = `${jst_date_part('year')}-${jst_date_part('month')}-${jst_date_part('day')}`;
  const since_time = Math.floor(new Date(start_date_str + "T00:00:00+09:00").getTime() / 1000);
  const until_time = Math.floor(new Date(start_date_str + "T23:59:59+09:00").getTime() / 1000);
  return "since_time:" + since_time + " until_time:" + until_time + " ";
}

// EventBody(標準表示)とEventBodyCompact(コンパクト表示)で共通の
// 日付計算・ラベル・状態・イベントハンドラをまとめたフック。
// 見た目(JSX)は呼び出し側の各コンポーネントがそれぞれ持つ。
export function useEventBodyData(data: EventBodyProps) {
  const event = data.event;
  const now = useSyncExternalStore(subscribeNow, getNow);
  const trackingData = useSyncExternalStore(subscribeTrackingData, getTrackingDataSnapshot);
  const markedEventsData = useSyncExternalStore(subscribeMarkedEvents, getMarkedEventsSnapshot);
  const isMarked = isEventMarked(markedEventsData, event.uid);
  const now_year = now.getFullYear();
  const start_date = new Date(event.started_at);
  const end_date = new Date(event.ended_at);
  const start_year = start_date.getFullYear();
  const start_month = start_date.getMonth() + 1;
  const start_day = start_date.getDate();
  const start_dow = DAY_OF_WEEK[start_date.getDay()];
  const start_time = start_date.getHours() + ':' + ('0' + start_date.getMinutes()).slice(-2);
  const is_today = formatEventDateKey(start_date) === formatEventDateKey(now);
  const has_ended = now.getTime() > end_date.getTime();
  const is_ongoing = now.getTime() >= start_date.getTime() && !has_ended;
  const is_new = isEventNew(trackingData, event, now);

  const title = event.title;
  const sub_title = event.catch;
  const hash_tag = event.hash_tag;
  const hash_tag_url = hash_tag ? "https://x.com/hashtag/" + encodeURIComponent(hash_tag) : "";
  const address = event.address;
  const place = event.place;
  const event_url = event.event_url;
  const owner_name = event.owner_name;
  const group_key = event.group_key;
  const group_name = event.group_name;
  const group_url = event.group_url;
  const group_image_url = event.group_image_url;
  const is_registered_group = event.is_registered_group;
  const archive_url = event.archive_url;
  // 後方互換: is_registered_group未設定の呼び出し元を壊さないため
  const has_group_page = Boolean(group_key) && is_registered_group !== false;
  const is_archive_event = isArchiveEvent(event);
  const keywords = event.keywords ?? [];
  const x_search_keywords_array = [];
  if (hash_tag) {
    x_search_keywords_array.push("#" + hash_tag);
  }
  x_search_keywords_array.push("\"" + title + "\"");
  if (group_name) {
    x_search_keywords_array.push("\"" + group_name+ "\"");
  }
  const x_search_since_until = has_ended ? buildJstDayScopedSearchPrefix(start_date) : "";
  const x_search_query = x_search_since_until + x_search_keywords_array.join(" OR ");
  const event_x_search_url = "https://x.com/search?q=" + encodeURIComponent(x_search_query) + "&f=live";
  const x_search_label = has_ended
    ? "イベント当日の X(Twitter) 投稿を検索"
    : "イベントに関する X(Twitter) 投稿を検索";

  const address_array = [address, place].filter(Boolean);

  const event_map_url = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(address_array[0] || '');

  const [isDesktopScreenSize] = useMediaQuery("(min-width: 768px)");

  const cardRef = useRef<HTMLDivElement>(null);
  const [isHighlighted, setIsHighlighted] = useState(false);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) {
      return;
    }

    let timer: ReturnType<typeof setTimeout> | undefined;

    const handleHighlight = () => {
      setIsHighlighted(true);
      clearTimeout(timer);
      timer = setTimeout(() => setIsHighlighted(false), 2000);
    };

    card.addEventListener(EVENT_CARD_HIGHLIGHT_EVENT, handleHighlight);
    return () => {
      card.removeEventListener(EVENT_CARD_HIGHLIGHT_EVENT, handleHighlight);
      clearTimeout(timer);
    };
  }, []);

  const [isLongPress, setIsLongPress] = useState(false);
  const [pressTimer, setPressTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [touchStartPos, setTouchStartPos] = useState<{ x: number; y: number } | null>(null);
  const [moved, setMoved] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isMarkPopoverOpen, onOpen: onMarkPopoverOpen, onClose: onMarkPopoverClose } = useDisclosure();
  const toast = useToast();

  const attendanceMarkLabel = has_ended
    ? (isMarked ? '気になる解除' : '気になる')
    : (isMarked ? '行きたいから外す' : '行きたいに追加');
  const attendanceMarkConfirmationText = has_ended ? '気になるに追加しました' : '行きたいに追加しました';
  const attendanceInviteSubtext = has_ended ? '友達にシェアしてみませんか?' : '一緒に行く友達を誘ってみませんか?';
  const nativeShareLabel = has_ended ? '友達にシェア' : NATIVE_SHARE_LABEL;

  const toggleAttendanceMark = (): boolean => {
    const nowMarked = !isMarked;
    updateMarkedEventsData((previous) =>
      nowMarked ? markEvent(previous, event.uid, new Date()) : unmarkEvent(previous, event.uid)
    );
    return nowMarked;
  };

  const handleCardMarkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nowMarked = toggleAttendanceMark();
    if (!nowMarked) {
      onMarkPopoverClose();
      return;
    }
    if (isDesktopScreenSize) {
      onMarkPopoverOpen();
    } else {
      toast({
        position: 'bottom',
        duration: 4000,
        isClosable: true,
        render: ({ onClose: onToastClose }) => (
          <HStack bg={'gray.700'} color={'white'} borderRadius={'md'} px={'4'} py={'3'} boxShadow={'lg'} spacing={'3'}>
            <Text fontSize={'sm'} flex={'1'}>{ attendanceMarkConfirmationText }</Text>
            <Button size={'xs'} onClick={() => {
              if (isNativeShareSupported()) {
                shareEventViaNativeShare(event, toast, onToastClose);
              } else {
                onOpen();
                onToastClose();
              }
            }}>
              { nativeShareLabel }
            </Button>
          </HStack>
        ),
      });
    }
  };

  const handleMarkButtonTouch = (e: React.TouchEvent) => {
    e.stopPropagation();
  };

  const handleDrawerMarkClick = () => {
    toggleAttendanceMark();
  };

  const handleGroupLogoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (group_key) {
      window.open(buildGroupPagePath(group_key), '_self');
    }
  };
  const handleGroupLogoTouch = (e: React.TouchEvent) => {
    e.stopPropagation();
  };

  const handleMenuButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onOpen();
  };
  const handleMenuButtonTouch = (e: React.TouchEvent) => {
    e.stopPropagation();
  };

  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollTimer, setScrollTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (Math.abs(currentScrollY - lastScrollY) > 5) {
        setIsScrolling(true);

        if (scrollTimer) {
          clearTimeout(scrollTimer);
        }

        const timer = setTimeout(() => {
          setIsScrolling(false);
        }, 150); // judge scrolling stopped after 150ms of no scroll events

        setScrollTimer(timer);
      }

      lastScrollY = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimer) {
        clearTimeout(scrollTimer);
      }
    };
  }, [scrollTimer]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isScrolling) {
      return;
    }

    const touch = e.touches[0];
    setTouchStartPos({ x: touch.clientX, y: touch.clientY });
    setMoved(false);

    const timer = setTimeout(() => {
      if (!moved && !isScrolling) {
        setIsLongPress(true);
        onOpen();
      }
    }, 600);
    setPressTimer(timer);
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartPos || isScrolling) return;

    const touch = e.touches[0];
    const dx = Math.abs(touch.clientX - touchStartPos.x);
    const dy = Math.abs(touch.clientY - touchStartPos.y);

    if (dx > 8 || dy > 8) {
      setMoved(true);
      if (pressTimer) {
        clearTimeout(pressTimer);
        setPressTimer(null);
      }
    }
  };
  const handleTouchEnd = () => {
    if (pressTimer) {
      clearTimeout(pressTimer);
      setPressTimer(null);
    }

    if (!isScrolling && !isLongPress && !moved && touchStartPos) {
      window.open(event_url, '_self');
    }
    resetState();
  };
  const resetState = () => {
    setIsLongPress(false);
    setMoved(false);
    setTouchStartPos(null);
    if (pressTimer) {
      clearTimeout(pressTimer);
      setPressTimer(null);
    }
  }

  useEffect(() => {
    if (!isOpen) {
      resetState();
    }
  }, [isOpen]);

  return {
    event,
    anchorId: data.anchorId,
    selectedKeyword: data.selectedKeyword,
    onKeywordClick: data.onKeywordClick,
    enableSummarizer: data.enableSummarizer,
    summaryDescriptionYear: data.summaryDescriptionYear,

    now_year,
    start_date,
    start_year,
    start_month,
    start_day,
    start_dow,
    start_time,
    is_today,
    has_ended,
    is_ongoing,
    is_new,

    title,
    sub_title,
    hash_tag,
    hash_tag_url,
    event_url,
    owner_name,
    group_key,
    group_name,
    group_url,
    group_image_url,
    has_group_page,
    is_archive_event,
    archive_url,
    keywords,
    address_array,
    event_map_url,
    event_x_search_url,
    x_search_label,

    isDesktopScreenSize,
    isMarked,
    cardRef,
    isHighlighted,

    isOpen,
    onOpen,
    onClose,
    isMarkPopoverOpen,
    onMarkPopoverClose,

    attendanceMarkLabel,
    attendanceMarkConfirmationText,
    attendanceInviteSubtext,
    nativeShareLabel,

    handleCardMarkClick,
    handleMarkButtonTouch,
    handleDrawerMarkClick,
    handleGroupLogoClick,
    handleGroupLogoTouch,
    handleMenuButtonClick,
    handleMenuButtonTouch,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    resetState,
  };
}
