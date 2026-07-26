import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import {
  AspectRatio, Badge, Box, Button, HStack, Heading, IconButton, Image, Link, Skeleton, SkeletonCircle, SkeletonText, Stack, Text,
  Popover, PopoverAnchor, PopoverContent, PopoverArrow, PopoverBody,
  Menu, MenuButton, MenuList, MenuItem,
  useDisclosure, useMediaQuery, useToast,
} from '@chakra-ui/react';
import { GeoAlt, People, Person, Star, StarFill } from '@chakra-icons/bootstrap';
import { FaXTwitter } from 'react-icons/fa6';
import { FiArchive, FiExternalLink, FiMoreVertical } from 'react-icons/fi';
import { formatEventDateKey, getEventAnchorId } from '../utils/eventAnchors';
import { EVENT_CARD_HIGHLIGHT_EVENT } from '../utils/hashScroll';
import { subscribeNow, getNow } from '../utils/nowTicker';
import { isEventNew } from '../utils/newEventTracking';
import { subscribeTrackingData, getTrackingDataSnapshot } from '../utils/newEventTrackingStore';
import { isEventMarked, markEvent, unmarkEvent } from '../utils/markedEvents';
import { subscribeMarkedEvents, getMarkedEventsSnapshot, updateMarkedEventsData } from '../utils/markedEventsStore';
import { buildGroupPagePath } from '../utils/groupPage';
import { isArchiveEvent } from '../utils/eventGroups';
import { buildEventXSearchUrl, getEventXSearchLabel } from '../utils/eventXSearch';
import { NATIVE_SHARE_LABEL, ShareButton, XShareButton } from './ShareButtons';
import { isNativeShareSupported, shareEventViaNativeShare } from '../utils/share';
import { EventActionsDrawer } from './EventActionsDrawer';
import type { EventWithGroup } from '../types/events';

const DAY_OF_WEEK = ['日', '月', '火', '水', '木', '金', '土'];

const GROUP_BADGE_STYLE = {
  position: 'absolute',
  bottom: '0',
  right: '3',
  transform: 'translateY(50%)',
  w: '48px',
  h: '48px',
  borderRadius: 'lg',
  overflow: 'hidden',
  border: '1px solid',
  borderColor: 'gray.200',
  boxShadow: 'sm',
  zIndex: 1,
} as const;

const STATUS_BADGE_STYLE = {
  position: 'absolute',
  top: '0',
  left: '3',
  transform: 'translateY(-50%)',
  boxShadow: 'sm',
  zIndex: 1,
  fontWeight: 'bold',
  fontSize: { base: 'xs', sm: 'sm', md: 'md', lg: 'lg' },
  borderStyle: 'solid',
  borderWidth: { base: '1px', sm: '1px', md: '1.5px', lg: '2px' },
} as const;

const MENU_BUTTON_STYLE = {
  position: 'absolute',
  top: '2',
  right: '2',
  zIndex: 1,
} as const;

// 長押し判定のしきい値。この間に指が動いたりページがスクロールしたり
// した場合は長押しとみなさない(EventBodyCompact等の長押しメニューと
// 同じ考え方)。
const LONG_PRESS_DURATION_MS = 600;
const LONG_PRESS_MOVE_TOLERANCE_PX = 8;

type EventCardProps = {
  event: EventWithGroup;
  anchorId?: string;
};

export function EventCard({ event, anchorId }: EventCardProps) {
  const now = useSyncExternalStore(subscribeNow, getNow);
  const trackingData = useSyncExternalStore(subscribeTrackingData, getTrackingDataSnapshot);
  const markedEventsData = useSyncExternalStore(subscribeMarkedEvents, getMarkedEventsSnapshot);
  const isMarked = isEventMarked(markedEventsData, event.uid);

  const start_date = new Date(event.started_at);
  const end_date = new Date(event.ended_at);
  const now_year = now.getFullYear();
  const start_year = start_date.getFullYear();
  const start_month = start_date.getMonth() + 1;
  const start_day = start_date.getDate();
  const start_dow = DAY_OF_WEEK[start_date.getDay()];
  const start_time = start_date.getHours() + ':' + ('0' + start_date.getMinutes()).slice(-2);
  const has_ended = now.getTime() > end_date.getTime();
  const is_today = formatEventDateKey(start_date) === formatEventDateKey(now);
  const is_ongoing = now.getTime() >= start_date.getTime() && !has_ended;
  const is_new = isEventNew(trackingData, event, now);
  const has_group_page = Boolean(event.group_key) && event.is_registered_group !== false;
  const group_page_aria_label = `${event.group_name ?? 'コミュニティ'}のページを見る`;
  const show_ongoing_badge = (is_today || is_ongoing) && !has_ended;
  const show_new_badge = !show_ongoing_badge && is_new;
  const card_border_color = show_ongoing_badge ? 'impact.500' : show_new_badge ? 'purple.500' : 'gray.200';

  const address = [event.address, event.place].filter(Boolean)[0];
  const event_map_url = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(address || '');
  const is_archive_event = isArchiveEvent(event);
  const event_x_search_url = buildEventXSearchUrl(event, start_date, has_ended);
  const x_search_label = getEventXSearchLabel(has_ended);

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

  const markLabel = has_ended
    ? (isMarked ? '気になる解除' : '気になる')
    : (isMarked ? '行きたいから外す' : '行きたいに追加');
  const attendanceMarkConfirmationText = has_ended ? '気になるに追加しました' : '行きたいに追加しました';
  const attendanceInviteSubtext = has_ended ? '友達にシェアしてみませんか?' : '一緒に行く友達を誘ってみませんか?';
  const nativeShareLabel = has_ended ? '友達にシェア' : NATIVE_SHARE_LABEL;

  const [isDesktopScreenSize] = useMediaQuery('(min-width: 768px)');
  const { isOpen: isMarkPopoverOpen, onOpen: onMarkPopoverOpen, onClose: onMarkPopoverClose } = useDisclosure();
  const { isOpen: isMenuOpen, onOpen: onMenuOpen, onClose: onMenuClose } = useDisclosure();
  const toast = useToast();

  // カード右上の「その他」メニューはクリックに加え、モバイルではカード
  // 全体の長押しでも開けるようにする(EventBody/EventBodyCompactの長押し
  // メニューと同じ考え方)。スクロール中の指の動きで誤って開かないよう、
  // ページスクロール中は長押し判定そのものを行わない。
  const [isScrolling, setIsScrolling] = useState(false);
  // 長押し判定のsetTimeoutコールバック(600ms後)から読む用に、常に最新値を
  // 持つrefも並行して更新する。useStateの値をそのままコールバック内で
  // 読むと、タイマー開始時点の古い値を参照し続けてしまうため。
  const isScrollingRef = useRef(false);
  useEffect(() => {
    let lastScrollY = window.scrollY;
    let scrollTimer: ReturnType<typeof setTimeout> | undefined;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (Math.abs(currentScrollY - lastScrollY) > 5) {
        setIsScrolling(true);
        isScrollingRef.current = true;
        clearTimeout(scrollTimer);
        scrollTimer = setTimeout(() => {
          setIsScrolling(false);
          isScrollingRef.current = false;
        }, 150);
      }
      lastScrollY = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimer);
    };
  }, []);

  const touchStartPosRef = useRef<{ x: number; y: number } | null>(null);
  const pressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const movedRef = useRef(false);

  const clearPressTimer = () => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
  };

  const handleCardTouchStart = (e: React.TouchEvent) => {
    if (isScrolling) {
      return;
    }
    const touch = e.touches[0];
    touchStartPosRef.current = { x: touch.clientX, y: touch.clientY };
    movedRef.current = false;
    clearPressTimer();
    pressTimerRef.current = setTimeout(() => {
      if (!movedRef.current && !isScrollingRef.current) {
        onMenuOpen();
      }
    }, LONG_PRESS_DURATION_MS);
  };
  const handleCardTouchMove = (e: React.TouchEvent) => {
    if (!touchStartPosRef.current || isScrolling) {
      return;
    }
    const touch = e.touches[0];
    const dx = Math.abs(touch.clientX - touchStartPosRef.current.x);
    const dy = Math.abs(touch.clientY - touchStartPosRef.current.y);
    if (dx > LONG_PRESS_MOVE_TOLERANCE_PX || dy > LONG_PRESS_MOVE_TOLERANCE_PX) {
      movedRef.current = true;
      clearPressTimer();
    }
  };
  const handleCardTouchEnd = () => {
    clearPressTimer();
    touchStartPosRef.current = null;
    movedRef.current = false;
  };

  const handleMenuButtonTouch = (e: React.TouchEvent) => {
    e.stopPropagation();
  };

  const toggleAttendanceMark = (): boolean => {
    const nowMarked = !isMarked;
    updateMarkedEventsData((previous) =>
      nowMarked ? markEvent(previous, event.uid, new Date()) : unmarkEvent(previous, event.uid)
    );
    return nowMarked;
  };

  const handleMarkClick = (e: React.MouseEvent) => {
    e.preventDefault();
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
                onMarkPopoverOpen();
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

  const handleGroupLogoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (event.group_key) {
      window.open(buildGroupPagePath(event.group_key), '_self');
    }
  };

  return (
    <Box as={'article'}
         ref={cardRef}
         id={anchorId}
         data-event-card
         data-event-date={formatEventDateKey(start_date).replace(/-/g, '')}
         className={isHighlighted ? 'event-card-ring-pulse' : undefined}
         scrollMarginTop={{ base: '4.5rem', md: '5.5rem' }}
         position={'relative'}
         display={'flex'}
         flexDirection={'column'}
         h={'100%'}
         borderRadius={'md'}
         borderStyle={'solid'}
         borderWidth={show_ongoing_badge || show_new_badge ? STATUS_BADGE_STYLE.borderWidth : '1px'}
         borderColor={card_border_color}
         bg={'white'}
         p={'3'}
         _hover={{
           borderColor: show_ongoing_badge ? 'impact.600' : show_new_badge ? 'purple.600' : 'gray.300',
           shadow: 'sm',
         }}
         transition={'box-shadow 120ms ease-out, border-color 120ms ease-out'}
         onTouchStart={handleCardTouchStart}
         onTouchMove={handleCardTouchMove}
         onTouchEnd={handleCardTouchEnd}
         onContextMenu={(e) => {
           // モバイルの長押しは独自メニュー(ドロワー)を開く用途なので、
           // 画像やリンクに対するブラウザ標準のコンテキストメニューが
           // 同時に出ないよう抑止する(デスクトップの右クリックは妨げない)。
           if (!isDesktopScreenSize) {
             e.preventDefault();
           }
         }}
         sx={!isDesktopScreenSize ? { WebkitTouchCallout: 'none' } : undefined}
         >
      <Box id={getEventAnchorId(event.uid)}
           position={'absolute'}
           top={'0'} left={'0'}
           w={'0'} h={'0'}
           overflow={'hidden'}
           scrollMarginTop={{ base: '4.5rem', md: '5.5rem' }}
           aria-hidden
           />
      <Box position={'relative'} mt={'-3'} mx={'-3'} mb={'3'}>
        <Box borderTopRadius={'md'} overflow={'hidden'}>
          <Link href={event.event_url} isExternal display={'block'}>
            <AspectRatio ratio={16 / 9} borderBottom={'1px solid'} borderColor={'gray.200'}>
              {event.image_url ? (
                <Image src={event.image_url}
                       alt={event.title}
                       fit={'cover'}
                       fallback={<Skeleton w={'100%'} h={'100%'} />}
                       />
              ) : (
                <Box className={'scroll-row-bg-pattern'} />
              )}
            </AspectRatio>
          </Link>
        </Box>
        {show_ongoing_badge ? (
          <Badge bg={'#f9f1e8'}
                 color={'impact.700'}
                 borderColor={'impact.500'}
                 {...STATUS_BADGE_STYLE}
                 >
            {is_ongoing ? '開催中' : '本日開催'}
          </Badge>
        ) : show_new_badge ? (
          <Badge bg={'#f3e8fb'}
                 color={'purple.700'}
                 borderColor={'purple.500'}
                 {...STATUS_BADGE_STYLE}
                 >
            NEW
          </Badge>
        ) : null}
        {event.group_image_url ? (
          event.group_key ? (
            <Button variant={'unstyled'}
                    aria-label={group_page_aria_label}
                    onClick={handleGroupLogoClick}
                    onTouchStart={handleMenuButtonTouch}
                    onTouchMove={handleMenuButtonTouch}
                    onTouchEnd={handleMenuButtonTouch}
                    minW={'auto'}
                    p={'0'}
                    bg={'#ffffff'}
                    {...GROUP_BADGE_STYLE}
                    >
              <Image src={event.group_image_url}
                     alt={''}
                     w={'100%'} h={'100%'}
                     fit={'contain'}
                     pointerEvents={'none'}
                     />
            </Button>
          ) : (
            <Box bg={'#ffffff'} pointerEvents={'none'} {...GROUP_BADGE_STYLE}>
              <Image src={event.group_image_url}
                     alt={''}
                     w={'100%'} h={'100%'}
                     fit={'contain'}
                     />
            </Box>
          )
        ) : has_group_page && (
          <Button variant={'unstyled'}
                  aria-label={group_page_aria_label}
                  onClick={handleGroupLogoClick}
                  onTouchStart={handleMenuButtonTouch}
                  onTouchMove={handleMenuButtonTouch}
                  onTouchEnd={handleMenuButtonTouch}
                  minW={'auto'}
                  p={'0'}
                  display={'flex'}
                  alignItems={'center'}
                  justifyContent={'center'}
                  bg={'gray.50'}
                  {...GROUP_BADGE_STYLE}
                  >
            <People color={'gray.400'} />
          </Button>
        )}
        {isDesktopScreenSize ? (
          <Menu isOpen={isMenuOpen} onOpen={onMenuOpen} onClose={onMenuClose} placement={'bottom-end'} isLazy>
            <MenuButton as={IconButton}
                        aria-label={'イベントのメニュー'}
                        icon={<FiMoreVertical />}
                        size={'sm'}
                        bg={'whiteAlpha.900'}
                        color={'gray.700'}
                        borderRadius={'full'}
                        boxShadow={'sm'}
                        _hover={{ bg: 'white' }}
                        {...MENU_BUTTON_STYLE}
                        />
            <MenuList fontSize={'sm'} onClick={(e) => e.stopPropagation()}>
              <MenuItem icon={<FiExternalLink />}
                        onClick={() => window.open(event.event_url)}
                        >
                情報提供元のページを開く
              </MenuItem>
              {has_group_page && (
                <MenuItem icon={<People />}
                          onClick={() => window.open(buildGroupPagePath(event.group_key!), '_self')}
                          >
                  コミュニティページを見る
                </MenuItem>
              )}
              <MenuItem icon={<FaXTwitter />}
                        onClick={() => window.open(event_x_search_url)}
                        >
                { x_search_label }
              </MenuItem>
              {is_archive_event && event.archive_url && (
                <MenuItem icon={<FiArchive />}
                          onClick={() => window.open(event.archive_url!)}
                          >
                  アーカイブ元を開く
                </MenuItem>
              )}
            </MenuList>
          </Menu>
        ) : (
          // モバイルは標準表示と同じ下から出てくるメニュー(EventActionsDrawer)を
          // 開く。3点リーダーのタップに加え、カード全体の長押しでも開ける。
          <IconButton aria-label={'イベントのメニュー'}
                      icon={<FiMoreVertical />}
                      size={'sm'}
                      bg={'whiteAlpha.900'}
                      color={'gray.700'}
                      borderRadius={'full'}
                      boxShadow={'sm'}
                      _hover={{ bg: 'white' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onMenuOpen();
                      }}
                      onTouchStart={handleMenuButtonTouch}
                      onTouchMove={handleMenuButtonTouch}
                      onTouchEnd={handleMenuButtonTouch}
                      {...MENU_BUTTON_STYLE}
                      />
        )}
      </Box>
      <Stack spacing={'0'} color={'gray.600'} fontSize={'sm'} mb={'1'}>
        {now_year !== start_year && (
          <Text fontSize={'xs'} fontWeight={'light'} lineHeight={'1'}>{start_year}</Text>
        )}
        <HStack spacing={'1'} align={'baseline'} mt={now_year !== start_year ? '-1' : '0'}>
          <HStack spacing={'0'} fontSize={{ base: 'sm', sm: 'lg', md: 'xl', lg: '2xl' }}>
            <Text as={'span'} fontWeight={'bold'}>{start_month}</Text>
            <Text as={'span'} fontWeight={'light'}>/{start_day}</Text>
          </HStack>
          <Text whiteSpace={'nowrap'}>({start_dow}) {start_time}-</Text>
        </HStack>
      </Stack>
      <Heading size={'sm'}
                color={'primary.800'}
                noOfLines={2}
                >
        <Link href={event.event_url} isExternal>{ event.title }</Link>
      </Heading>
      <Stack spacing={'0.5'} mt={'auto'} pt={'2'} pr={'6'} fontSize={'xs'} color={'gray.500'}>
        {address && (
          <HStack spacing={'1'}>
            <GeoAlt />
            <Text noOfLines={1}><Link href={event_map_url} isExternal>{ address }</Link></Text>
          </HStack>
        )}
        {event.group_name ? (
          <HStack spacing={'1'}>
            <People />
            <Text noOfLines={1}>{ event.group_name }</Text>
          </HStack>
        ) : event.owner_name ? (
          <HStack spacing={'1'}>
            <Person />
            <Text noOfLines={1}>{ event.owner_name }</Text>
          </HStack>
        ) : null}
      </Stack>
      <Popover isOpen={isMarkPopoverOpen} onClose={onMarkPopoverClose} placement={'top-end'} isLazy>
        <PopoverAnchor>
          <IconButton aria-label={markLabel}
                      icon={isMarked ? <StarFill /> : <Star />}
                      size={'xs'}
                      variant={isMarked ? 'solid' : 'ghost'}
                      colorScheme={isMarked ? 'yellow' : 'gray'}
                      position={'absolute'}
                      bottom={'2'} right={'2'}
                      zIndex={1}
                      onClick={handleMarkClick}
                      onTouchStart={handleMenuButtonTouch}
                      onTouchMove={handleMenuButtonTouch}
                      onTouchEnd={handleMenuButtonTouch}
                      />
        </PopoverAnchor>
        <PopoverContent w={'auto'}>
          <PopoverArrow />
          <PopoverBody>
            <Stack spacing={'2'}>
              <Stack spacing={'0'}>
                <Text fontSize={'sm'} fontWeight={'bold'}>{ attendanceMarkConfirmationText }</Text>
                <Text fontSize={'xs'} color={'gray.500'}>{ attendanceInviteSubtext }</Text>
              </Stack>
              <XShareButton event={event} />
              <ShareButton event={event} label={nativeShareLabel} />
            </Stack>
          </PopoverBody>
        </PopoverContent>
      </Popover>
      {!isDesktopScreenSize && (
        <EventActionsDrawer event={event}
                            isOpen={isMenuOpen}
                            onClose={onMenuClose}
                            resetState={handleCardTouchEnd}
                            isMarked={isMarked}
                            attendanceMarkLabel={markLabel}
                            onMarkClick={() => toggleAttendanceMark()}
                            nativeShareLabel={nativeShareLabel}
                            hasGroupPage={has_group_page}
                            hasAddress={Boolean(address)}
                            eventMapUrl={event_map_url}
                            eventXSearchUrl={event_x_search_url}
                            xSearchLabel={x_search_label}
                            isArchiveEvent={is_archive_event}
                            />
      )}
    </Box>
  );
}

export function SkeletonEventCard() {
  return (
    <Box borderRadius={'md'}
         borderWidth={'1px'}
         borderColor={'gray.200'}
         bg={'white'}
         overflow={'hidden'}
         >
      <AspectRatio ratio={16 / 9}>
        <Skeleton />
      </AspectRatio>
      <Stack spacing={'2'} p={'3'}>
        <HStack spacing={'1'}>
          <Skeleton height={{ base: '1.2rem', md: '1.5rem' }} width={'3rem'} />
          <Skeleton height={'0.875rem'} width={'5rem'} />
        </HStack>
        <SkeletonText noOfLines={2} spacing={'2'} skeletonHeight={'0.75rem'} />
        <HStack spacing={'2'} pt={'2'}>
          <SkeletonCircle size={'0.875rem'} />
          <Skeleton height={'0.75rem'} width={'60%'} />
        </HStack>
      </Stack>
    </Box>
  );
}

