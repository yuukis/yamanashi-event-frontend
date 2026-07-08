import icon from "../assets/images/icon.png"
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { NotificationButton } from '../components/Notification';
import {
  Heading,
  Box,
  Center,
  Stack,
  Spacer,
  Link,
  Text,
  Image,
  Button,
  IconButton,
  Input,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverArrow,
  PopoverHeader,
  PopoverCloseButton,
  PopoverBody,
  PopoverFooter,
  SimpleGrid,
  HStack,
  Tooltip,
  useDisclosure
} from '@chakra-ui/react';
import { isMobile } from 'react-device-detect';
import { ChevronLeftIcon, ChevronRightIcon, RepeatClockIcon } from "@chakra-ui/icons";
import { Github, Calendar3, CaretRightFill } from '@chakra-icons/bootstrap';
import { keyframes } from '@emotion/react';
import { formatEventDateKey, getEventDateAnchorId } from '../utils/eventAnchors';
import { fetchEvents } from '../utils/api';
import { subscribeNow, getNow } from '../utils/nowTicker';
import { subscribeHeaderVisibility, getHeaderVisible, getNearPageTop, HEADER_HEIGHT } from '../utils/headerVisibility';
import { scrollToCurrentHash } from '../utils/hashScroll';
import type { ApiEvent } from '../types/events';

const todayBadgePulse = keyframes`
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.2); }
`;

function SiteHeaderContent() {
  return (
    <>
      <Stack h={{base: '12', md: '16'}}
             maxW={'980px'}
             m={'auto'}
             p={'4'}
             direction={'row'}
             alignItems={'center'}
             bg={'white'}
             >
        <Link href={'/'} style={{textDecoration: 'none'}} _hover={{opacity: '0.6'}}>
          <Stack direction={'row'} spacing={'3'} alignItems={'center'}>
            <Image src={icon}
                   boxSize={{base: '6', md: '8'}}
                   alt='Yamanashi Developer Hub'
                   />
            <Heading size={{base: 'sm', md: 'md'}}
                     fontWeight={'normal'}
                     noOfLines={1}
                     >
              <strong>Yamanashi</strong> Developer Hub
            </Heading>
          </Stack>
        </Link>
        <Spacer />
        <ICalendarButton />
        <NotificationButton />
        <GithubButton />
      </Stack>
      <Stack spacing={'2px'}>
        <Box h={'1px'} bg={'impact.500'} />
        <Box h={'1px'} bg={'secondary.500'} />
        <Box h={'1px'} bg={'primary.500'} />
      </Stack>
    </>
  );
}

// ヘッダーは2枚構成。最上部ヘッダーは通常フローに置き、ページと一緒に
// スクロールして自然に消える。固定ヘッダーは上スクロール時にスライドイン
// し、ページ上端付近では最上部ヘッダーに役割を譲って隠れる。両者は同一の
// 見た目でページ上端付近では位置ずれが8px未満に収まるため、そこでの
// 切り替えはアニメーションなしで行うことで入れ替えを悟らせない
// (スライドさせると背面の最上部ヘッダーの上を下線が横切るのが見える)。
// さらに上端付近では translateY で画面外へ逃がさず、その場で非表示にする。
// ヘッダー内のふきだし(Popover)は親を visibility: hidden にしても自身の
// visibility 指定で見え続けるため、画面外へ動かすとふきだしだけが上へ
// ずれてしまう。その場に留めれば、ふきだしは同位置の最上部ヘッダーの
// ボタンを指したまま自然に使い続けられる。
export function SiteHeader() {
  const isFixedHeaderVisible = useSyncExternalStore(subscribeHeaderVisibility, getHeaderVisible);
  const isNearPageTop = useSyncExternalStore(subscribeHeaderVisibility, getNearPageTop);

  return (
    <>
      <Box w={'100%'} bg={'white'} h={HEADER_HEIGHT}>
        <SiteHeaderContent />
      </Box>
      <Box w={'100%'}
           bg={'white'}
           position={'fixed'}
           top={'0'}
           left={'0'}
           right={'0'}
           zIndex={'sticky'}
           transform={isFixedHeaderVisible || isNearPageTop ? 'translateY(0)' : 'translateY(-100%)'}
           visibility={isFixedHeaderVisible ? 'visible' : 'hidden'}
           transition={isNearPageTop ? 'none' : 'transform 180ms ease-out, visibility 180ms ease-out'}
           >
        <SiteHeaderContent />
      </Box>
    </>
  );
}

export function SiteFooter() {
  return (
    <Center p={'4'}>
      <Text fontSize={'xs'} color={'gray'}>
        Yamanashi Developer Hub
      </Text>
    </Center>
  );
}

export function ICalendarButton() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [events, setEvents] = useState<ApiEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [monthOffset, setMonthOffset] = useState(0);
  const [today, setToday] = useState(() => new Date());
  const monthStart = useMemo(
    () => new Date(today.getFullYear(), today.getMonth() + monthOffset, 1),
    [monthOffset, today],
  );
  const monthLabel = monthStart.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
  });
  const todayKey = formatEventDateKey(today);
  const calendarDays = useMemo(() => buildCalendarDays(monthStart), [monthStart]);
  const eventsByDate = useMemo(() => {
    const eventMap = new Map<string, ApiEvent[]>();
    const visibleDateKeys = new Set(calendarDays.map((day) => day.key));

    events.forEach((event) => {
      const eventDate = new Date(event.started_at);
      const key = formatEventDateKey(eventDate);

      if (visibleDateKeys.has(key)) {
        eventMap.set(key, [...(eventMap.get(key) ?? []), event]);
      }
    });

    eventMap.forEach((dayEvents) => {
      dayEvents.sort((a, b) => new Date(a.started_at).getTime() - new Date(b.started_at).getTime());
    });

    return eventMap;
  }, [calendarDays, events]);

  useEffect(() => {
    let timerId: number | undefined;

    const scheduleNextUpdate = () => {
      if (timerId !== undefined) {
        window.clearTimeout(timerId);
      }

      timerId = window.setTimeout(updateToday, getMillisecondsUntilNextDay());
    };
    const updateToday = () => {
      const nextToday = new Date();
      setToday((currentToday) => (
        formatEventDateKey(currentToday) === formatEventDateKey(nextToday)
          ? currentToday
          : nextToday
      ));
      scheduleNextUpdate();
    };
    const updateTodayAfterResume = () => {
      if (!document.hidden) {
        updateToday();
      }
    };

    scheduleNextUpdate();
    document.addEventListener('visibilitychange', updateTodayAfterResume);

    return () => {
      if (timerId !== undefined) {
        window.clearTimeout(timerId);
      }
      document.removeEventListener('visibilitychange', updateTodayAfterResume);
    };
  }, []);

  const isUnmountedRef = useRef(false);

  const loadEvents = () => {
    setIsLoading(true);

    fetchEvents()
      .then((res) => {
        if (!isUnmountedRef.current) {
          setEvents(res.events);
          setErrorMessage('');
        }
      })
      .catch((err) => {
        if (!isUnmountedRef.current) {
          setErrorMessage(err.message);
        }
      })
      .finally(() => {
        if (!isUnmountedRef.current) {
          setIsLoading(false);
        }
      });
  };

  useEffect(() => {
    isUnmountedRef.current = false;
    loadEvents();
    return () => {
      isUnmountedRef.current = true;
    };
  }, []);

  const openCalendar = () => {
    if (errorMessage) {
      loadEvents();
    }

    onOpen();
  };

  const now = useSyncExternalStore(subscribeNow, getNow);

  const hasEventToday = useMemo(
    () => events.some((event) => (
      formatEventDateKey(new Date(event.started_at)) === todayKey
      && now.getTime() <= new Date(event.ended_at).getTime()
    )),
    [events, todayKey, now],
  );

  const hasOngoingEvent = useMemo(
    () => events.some((event) => {
      const nowTime = now.getTime();
      return nowTime >= new Date(event.started_at).getTime() && nowTime <= new Date(event.ended_at).getTime();
    }),
    [events, now],
  );

  const isTodayHighlighted = hasEventToday || hasOngoingEvent;
  const todayLabel = hasOngoingEvent ? '開催中' : '本日開催';

  const closePopover = () => {
    setMonthOffset(0);
    onClose();
  };

  return (
    <Popover isOpen={isOpen} onOpen={openCalendar} onClose={closePopover} placement='bottom-end'>
      <PopoverTrigger>
        <Button variant={'ghost'}
                aria-label={isTodayHighlighted ? `${todayLabel}のイベントがあります` : 'イベントカレンダー'}
                px={{base: '2', md: '4'}}
                minW={{base: '10', md: 'auto'}}
                bg={isTodayHighlighted ? '#f9f1e8' : undefined}
                border={isTodayHighlighted ? '2px solid' : undefined}
                borderColor={isTodayHighlighted ? 'impact.500' : undefined}
                _hover={{bg: isTodayHighlighted ? '#f3e6d3' : 'gray.100'}}
                >
          <Box position={'relative'} display={'inline-flex'}>
            <Calendar3 mr={{base: '0', md: '2'}} color={isTodayHighlighted ? 'impact.700' : undefined} />
            {isTodayHighlighted && (
              <Box position={'absolute'}
                   top={'-1px'}
                   right={{base: '-1px', md: '5px'}}
                   w={'8px'}
                   h={'8px'}
                   borderRadius={'full'}
                   bg={'impact.600'}
                   animation={`${todayBadgePulse} 1.6s ease-in-out infinite`}
                   sx={{'@media (prefers-reduced-motion: reduce)': {animation: 'none'}}}
                   />
            )}
          </Box>
          <Text display={{base: 'none', md: 'block'}}
                fontWeight={isTodayHighlighted ? 'bold' : 'normal'}
                fontSize={'sm'}
                color={isTodayHighlighted ? 'impact.700' : undefined}
                >
            {isTodayHighlighted ? todayLabel : 'カレンダー'}
          </Text>
        </Button>
      </PopoverTrigger>
      <PopoverContent w={{base: 'calc(100vw - 24px)', md: '360px'}}>
        <PopoverArrow />
        <PopoverHeader>
          <HStack spacing={'2'} pr={'8'}>
            <IconButton aria-label='前月を表示'
                        icon={<ChevronLeftIcon />}
                        size={'xs'}
                        variant={'outline'}
                        isDisabled={monthOffset <= -1}
                        onClick={() => setMonthOffset((current) => Math.max(current - 1, -1))}
                        />
            <Text fontSize={'md'} flex={'1'} textAlign={'center'} fontWeight={'bold'}>
              {monthLabel}
            </Text>
            <IconButton aria-label='次月を表示'
                        icon={<ChevronRightIcon />}
                        size={'xs'}
                        variant={'outline'}
                        isDisabled={monthOffset >= 1}
                        onClick={() => setMonthOffset((current) => Math.min(current + 1, 1))}
                        />
          </HStack>
        </PopoverHeader>
        <PopoverCloseButton />
        <PopoverBody>
          <Stack spacing={'4'}>
            <MiniEventCalendar
              calendarDays={calendarDays}
              todayKey={todayKey}
              eventsByDate={eventsByDate}
              isLoading={isLoading}
              errorMessage={errorMessage}
            />
            <Stack borderTop={'1px solid'}
                   borderColor={'gray.100'}
                   pt={'3'}
                   spacing={'2'}
                   >
              <Text fontSize={'xs'} color={'gray.600'}>
                連携用URL（iCalendar）
              </Text>
              <Text fontSize={'xs'} color={'gray.500'}>
                外部カレンダーに追加したい方向けです。
              </Text>
              <Input value={'https://hub.yamanashi.dev/event.ics'}
                    size={'sm'}
                    isReadOnly
                    onSelect={(e) => {
                      const inputElement = e.target as HTMLInputElement;
                      inputElement.select();
                    }}
                    />
            </Stack>
          </Stack>
        </PopoverBody>
        {!isMobile && (
          <PopoverFooter>
            <Button w={'100%'} variant={'ghost'} size={'sm'}
                    onClick={() => { window.open('https://calendar.google.com/calendar/r/settings/addbyurl', '_blank') }}>
              <CaretRightFill mr={'2'} />
              <Text fontWeight={'normal'}>Google カレンダーに登録する</Text>
              <Spacer />
            </Button>
          </PopoverFooter>
        )}
      </PopoverContent>
    </Popover>
  )
}

function MiniEventCalendar({
  calendarDays,
  todayKey,
  eventsByDate,
  isLoading,
  errorMessage,
}: {
  calendarDays: CalendarDay[];
  todayKey: string;
  eventsByDate: Map<string, ApiEvent[]>;
  isLoading: boolean;
  errorMessage: string;
}) {
  const weekDays = ['日', '月', '火', '水', '木', '金', '土'];

  return (
    <Stack spacing={'2'}>
      <SimpleGrid columns={7} spacing={'1'}>
        {weekDays.map((day, index) => (
          <Center key={day}
                  h={'6'}
                  fontSize={'xs'}
                  color={index === 0 ? 'impact.700' : index === 6 ? 'primary.800' : 'gray.500'}
                  >
            {day}
          </Center>
        ))}
        {calendarDays.map((day) => {
          const dayEvents = eventsByDate.get(day.key) ?? [];
          const hasEvent = dayEvents.length > 0;
          const isToday = day.key === todayKey;
          const bg = getCalendarDayBg(hasEvent);
          const color = isToday ? 'impact.700' : day.isCurrentMonth ? 'gray.800' : 'gray.300';
          const dayLabel = `${day.date.getMonth() + 1}月${day.date.getDate()}日`;
          const jumpToEvent = () => {
            if (dayEvents.length === 0) {
              return;
            }

            const anchorId = getEventDateAnchorId(day.key);

            if (window.location.pathname === '/') {
              window.location.hash = anchorId;
              window.requestAnimationFrame(scrollToCurrentHash);
              return;
            }

            window.open(`/#${anchorId}`, '_self');
          };
          const dayCell = (
            <Center key={day.key}
                    h={'9'}
                    borderRadius={'md'}
                    border={isToday ? '2px solid' : '1px solid'}
                    borderColor={isToday ? 'impact.500' : 'gray.100'}
                    bg={bg}
                    color={color}
                    fontSize={isToday ? 'md' : 'sm'}
                    fontWeight={isToday || hasEvent ? 'bold' : 'normal'}
                    tabIndex={hasEvent ? 0 : undefined}
                    cursor={hasEvent ? 'pointer' : 'default'}
                    role={hasEvent ? 'link' : undefined}
                    onClick={hasEvent ? jumpToEvent : undefined}
                    onKeyDown={hasEvent ? (e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        jumpToEvent();
                      }
                    } : undefined}
                    aria-label={`${dayLabel}${isToday ? ' 今日' : ''}${hasEvent ? ' イベントあり' : ''}`}
                    >
              {day.date.getDate()}
            </Center>
          );

          if (!hasEvent) {
            return dayCell;
          }

          return (
            <Tooltip key={day.key}
                     label={<EventDayTooltip events={dayEvents} />}
                     hasArrow
                     maxW={{base: '240px', md: '280px'}}
                     placement='top'
                     openDelay={200}
                     >
              {dayCell}
            </Tooltip>
          );
        })}
      </SimpleGrid>
      {isLoading ? (
        <Text fontSize={'xs'} color={'gray.500'}>イベント日を読み込み中です</Text>
      ) : errorMessage ? (
        <Text fontSize={'xs'} color={'impact.700'}>イベント日を取得できませんでした</Text>
      ) : null}
    </Stack>
  );
}

function EventDayTooltip({ events }: { events: ApiEvent[] }) {
  return (
    <Stack spacing={'1'}>
      {events.map((event) => (
        <Text key={event.uid}
              fontSize={'xs'}
              lineHeight={'1.4'}
              >
          <Text as={'span'} fontWeight={'bold'}>
            {formatEventTime(event.started_at)}
          </Text>{' '}
          {event.title}
        </Text>
      ))}
    </Stack>
  );
}

type CalendarDay = {
  date: Date;
  key: string;
  isCurrentMonth: boolean;
};

function buildCalendarDays(monthStart: Date): CalendarDay[] {
  const firstCalendarDate = new Date(monthStart);
  firstCalendarDate.setDate(monthStart.getDate() - monthStart.getDay());
  const days = [];

  for (let i = 0; i < 42; i++) {
    const date = new Date(firstCalendarDate);
    date.setDate(firstCalendarDate.getDate() + i);
    days.push({
      date,
      key: formatEventDateKey(date),
      isCurrentMonth: date.getMonth() === monthStart.getMonth(),
    });
  }

  return days;
}

function getMillisecondsUntilNextDay(): number {
  const now = new Date();
  const nextDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

  return Math.max(0, nextDay.getTime() - now.getTime());
}

function formatEventTime(startedAt: string): string {
  const startedAtDate = new Date(startedAt);
  const hours = startedAtDate.getHours();
  const minutes = `${startedAtDate.getMinutes()}`.padStart(2, '0');

  return `${hours}:${minutes}-`;
}

function getCalendarDayBg(hasEvent: boolean) {
  if (hasEvent) {
    return 'secondary.100';
  }

  return 'white';
}

export function GithubButton() {

  return (
    <Popover>
      <PopoverTrigger>
        <IconButton aria-label='Git repo' variant={'ghost'} icon={<Github />} />
      </PopoverTrigger>
      <PopoverContent>
        <PopoverArrow />
        <PopoverHeader>
          <Text fontSize={'sm'}>
            git repo
          </Text>
        </PopoverHeader>
        <PopoverCloseButton />
        <PopoverBody>
          <Button w={'100%'} variant={'ghost'} size={'sm'}
                  onClick={() => { window.open('https://github.com/yuukis/yamanashi-event-frontend', '_blank') }}>
            <Github mr={'2'} />
            <Text fontWeight={'normal'}>yuukis/yamanashi-event-frontend</Text>
            <Spacer />
          </Button>
          <Button w={'100%'} variant={'ghost'} size={'sm'}
                  onClick={() => { window.open('https://github.com/yuukis/yamanashi-event-api', '_blank') }}>
            <Github mr={'2'} />
            <Text fontWeight={'normal'}>yuukis/yamanashi-event-api</Text>
            <Spacer />
          </Button>
          <Button w={'100%'} variant={'ghost'} size={'sm'}
                  onClick={() => { window.open('https://github.com/yuukis/yamanashi-event-icalendar', '_blank') }}>
            <Github mr={'2'} />
            <Text fontWeight={'normal'}>yuukis/yamanashi-event-icalendar</Text>
            <Spacer />
          </Button>
          <Button w={'100%'} variant={'ghost'} size={'sm'}
                  onClick={() => { window.open('https://github.com/yuukis/yamanashi-event-notify-backend', '_blank') }}>
            <Github mr={'2'} />
            <Text fontWeight={'normal'}>yuukis/yamanashi-event-notify-backend</Text>
            <Spacer />
          </Button>
          <Button w={'100%'} variant={'ghost'} size={'sm'}
                  onClick={() => { window.open('https://github.com/yuukis/yamanashi-event-stream', '_blank') }}>
            <Github mr={'2'} />
            <Text fontWeight={'normal'}>yuukis/yamanashi-event-stream</Text>
            <Spacer />
          </Button>
          <Button w={'100%'} variant={'ghost'} size={'sm'}
                  onClick={() => { window.open('https://github.com/yuukis/yamanashi-event-stream-x', '_blank') }}>
            <Github mr={'2'} />
            <Text fontWeight={'normal'}>yuukis/yamanashi-event-stream-x</Text>
            <Spacer />
          </Button>
        </PopoverBody>
      </PopoverContent>
    </Popover>
  )
}

export function SelectYearButtons({startYear} : { startYear: number }) {

  const currentYear = new Date().getFullYear();
  const years = [];

  for (let y = startYear; y <= currentYear; y++) {
    years.push(y);
  }

  return (
    <>
      {years.map((year) => (
        <Button key={year} size={'sm'} m={'1'}
                onClick={() => { window.open(`/${year}`, '_self'); }}
                >{`${year}年`}</Button>
      ))}
    </>
  );
}

export function FooterLastModified(prop: any) {
  
  const lastModified = new Date(prop.lastModified);
  const lastModifiedString = lastModified ? lastModified.toLocaleString() : '---';

  return (
    <Stack direction={'row'}
           alignItems={'center'}
           ml={{base: '4', md: '0'}}
           mb={4}
           spacing={2}
           >
      <RepeatClockIcon w={{base: '3', md: '4'}}
                       h={{base: '3', md: '4'}}
                       color={'gray'}
                       />
      <Text fontSize={{base: 'xs', md: 'sm'}} color={'gray'}>
        最終更新: { lastModifiedString }
      </Text>
    </Stack>
  );
}
