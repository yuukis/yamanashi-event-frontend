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
import { buildEventXSearchUrl, getEventXSearchLabel } from '../utils/eventXSearch';
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
  const has_group_page = Boolean(group_key) && is_registered_group !== false;
  const is_archive_event = isArchiveEvent(event);
  const keywords = event.keywords ?? [];
  const event_x_search_url = buildEventXSearchUrl(event, start_date, has_ended);
  const x_search_label = getEventXSearchLabel(has_ended);

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

  const isLongPressRef = useRef(false);
  const pressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartPosRef = useRef<{ x: number; y: number } | null>(null);
  const movedRef = useRef(false);
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
  const isScrollingRef = useRef(false);
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (Math.abs(currentScrollY - lastScrollY) > 5) {
        setIsScrolling(true);
        isScrollingRef.current = true;

        if (scrollTimerRef.current) {
          clearTimeout(scrollTimerRef.current);
        }

        scrollTimerRef.current = setTimeout(() => {
          setIsScrolling(false);
          isScrollingRef.current = false;
        }, 150);
      }

      lastScrollY = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimerRef.current) {
        clearTimeout(scrollTimerRef.current);
      }
    };
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isScrolling) {
      return;
    }

    const touch = e.touches[0];
    touchStartPosRef.current = { x: touch.clientX, y: touch.clientY };
    movedRef.current = false;

    const timer = setTimeout(() => {
      if (!movedRef.current && !isScrollingRef.current) {
        isLongPressRef.current = true;
        onOpen();
      }
    }, 600);
    pressTimerRef.current = timer;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartPosRef.current || isScrolling) return;

    const touch = e.touches[0];
    const dx = Math.abs(touch.clientX - touchStartPosRef.current.x);
    const dy = Math.abs(touch.clientY - touchStartPosRef.current.y);

    if (dx > 8 || dy > 8) {
      movedRef.current = true;
      if (pressTimerRef.current) {
        clearTimeout(pressTimerRef.current);
        pressTimerRef.current = null;
      }
    }
  };
  const handleTouchEnd = () => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }

    if (!isScrolling && !isLongPressRef.current && !movedRef.current && touchStartPosRef.current) {
      window.open(event_url, '_self');
    }
    resetState();
  };
  const resetState = () => {
    isLongPressRef.current = false;
    movedRef.current = false;
    touchStartPosRef.current = null;
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
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
