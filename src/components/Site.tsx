import icon from "../assets/images/icon.png"
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { NotificationButton } from '../components/Notification';
import { useSyncCodeFromUrl } from '../utils/sync';
import { MiniEventCalendar } from '../components/MiniEventCalendar';
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
  HStack,
  useDisclosure
} from '@chakra-ui/react';
import { isMobile } from 'react-device-detect';
import { ChevronLeftIcon, ChevronRightIcon, RepeatClockIcon } from "@chakra-ui/icons";
import { Github, Calendar3 } from '@chakra-icons/bootstrap';
import { FiCopy, FiCheck, FiCalendar } from 'react-icons/fi';
import { SiGoogle, SiApple } from 'react-icons/si';
import { PiMicrosoftOutlookLogoFill } from 'react-icons/pi';
import { keyframes } from '@emotion/react';
import { formatEventDateKey, getEventDateAnchorId } from '../utils/eventAnchors';
import { fetchEvents } from '../utils/api';
import { subscribeNow, getNow } from '../utils/nowTicker';
import { subscribeHeaderVisibility, getHeaderVisible, getNearPageTop, setFixedHeaderBoundary, HEADER_HEIGHT } from '../utils/headerVisibility';
import { jumpToAnchor } from '../utils/hashScroll';
import { buildCalendarDays, buildEventsByDate, useTodayDate } from '../utils/calendar';
import { SITE_URL } from '../utils/site';
import type { ApiEvent } from '../types/events';

const todayBadgePulse = keyframes`
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.2); }
`;

const ICAL_URL = `${SITE_URL}/event.ics`;
const ICAL_CALENDAR_NAME = 'ITイベント - 山梨県';
const ICAL_WEBCAL_URL = ICAL_URL.replace(/^https:\/\//, 'webcal://');
const GOOGLE_CALENDAR_ADD_URL = `https://calendar.google.com/calendar/render?cid=${encodeURIComponent(ICAL_WEBCAL_URL)}`;
const OUTLOOK_CALENDAR_ADD_URL = `https://outlook.live.com/calendar/0/addfromweb?url=${encodeURIComponent(ICAL_URL)}&name=${encodeURIComponent(ICAL_CALENDAR_NAME)}`;
const APPLE_CALENDAR_URL = ICAL_WEBCAL_URL;

// 固定ヘッダーの表示境界をマークする ref を返す。各ページの本文先頭の
// 見出しに付ける。
export function useFixedHeaderBoundary<T extends HTMLElement>() {
  const boundaryRef = useRef<T>(null);

  useEffect(() => {
    setFixedHeaderBoundary(boundaryRef.current);
    return () => setFixedHeaderBoundary(null);
  }, []);

  return boundaryRef;
}

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

// ヘッダーは2枚構成。最上部ヘッダーは通常フローでページと一緒にスクロール
// して消え、固定ヘッダーは上スクロール時にスライドインする。ページ上端付近
// では両者の位置ずれが8px未満に収まるため、固定ヘッダーは動かさず・
// アニメーションなしでその場で非表示にして入れ替えを悟らせない。translateY
// で画面外へ逃がすと、ヘッダー内のふきだし(Popover)だけが自身の
// visibility 指定で見え続けたまま一緒にずれてしまう。
export function SiteHeader() {
  useSyncCodeFromUrl();
  const isFixedHeaderVisible = useSyncExternalStore(subscribeHeaderVisibility, getHeaderVisible);
  const isNearPageTop = useSyncExternalStore(subscribeHeaderVisibility, getNearPageTop);
  const staticHeaderRef = useRef<HTMLDivElement>(null);

  // 同一内容のヘッダーが2枚あるため、操作可能・支援技術に可視なのは常に
  // 1枚だけにする。固定ヘッダーが非表示の間は visibility: hidden がタブ順と
  // アクセシビリティツリーから除外する。固定ヘッダーの表示中は、その下に
  // 覆われて操作できない最上部ヘッダーを inert にして重複を消す。
  // (inert は React 18 が属性として未対応のため ref で付与する)
  useEffect(() => {
    const staticHeader = staticHeaderRef.current;
    if (!staticHeader) {
      return;
    }
    if (isFixedHeaderVisible) {
      staticHeader.setAttribute('inert', '');
    } else {
      staticHeader.removeAttribute('inert');
    }
  }, [isFixedHeaderVisible]);

  return (
    <>
      {/* 上端付近では最上部ヘッダーを固定ヘッダーより前面にする。慣性
          スクロールの上端到達時、固定ヘッダーの非表示化が処理される前に
          ラバーバンドが始まっても、前面の最上部ヘッダーがページと一緒に
          引っ張られ、背面の固定ヘッダーが上端の隙間を埋める。 */}
      <Box ref={staticHeaderRef}
           w={'100%'}
           bg={'white'}
           h={HEADER_HEIGHT}
           position={'relative'}
           zIndex={isNearPageTop ? 'banner' : undefined}
           aria-hidden={isFixedHeaderVisible ? true : undefined}
           >
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
  const [isIcalExpanded, setIsIcalExpanded] = useState(false);
  const [isUrlCopied, setIsUrlCopied] = useState(false);
  const icalUrlInputRef = useRef<HTMLInputElement>(null);
  const copyFeedbackTimeoutRef = useRef<number | null>(null);
  const firstServiceLinkRef = useRef<HTMLAnchorElement>(null);
  const today = useTodayDate();
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
  const eventsByDate = useMemo(() => buildEventsByDate(events, calendarDays), [calendarDays, events]);

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

  useEffect(() => {
    return () => {
      if (copyFeedbackTimeoutRef.current !== null) {
        window.clearTimeout(copyFeedbackTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isIcalExpanded) {
      firstServiceLinkRef.current?.focus();
    }
  }, [isIcalExpanded]);

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
    setIsIcalExpanded(false);
    setIsUrlCopied(false);
    if (copyFeedbackTimeoutRef.current !== null) {
      window.clearTimeout(copyFeedbackTimeoutRef.current);
      copyFeedbackTimeoutRef.current = null;
    }
    onClose();
  };

  const handleCopyIcalUrl = () => {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(ICAL_URL)
        .then(() => {
          setIsUrlCopied(true);
          if (copyFeedbackTimeoutRef.current !== null) {
            window.clearTimeout(copyFeedbackTimeoutRef.current);
          }
          copyFeedbackTimeoutRef.current = window.setTimeout(() => {
            setIsUrlCopied(false);
            copyFeedbackTimeoutRef.current = null;
          }, 1500);
        })
        .catch(() => {
          if (copyFeedbackTimeoutRef.current !== null) {
            window.clearTimeout(copyFeedbackTimeoutRef.current);
            copyFeedbackTimeoutRef.current = null;
          }
          setIsUrlCopied(false);
          icalUrlInputRef.current?.select();
        });
    } else {
      setIsUrlCopied(false);
      icalUrlInputRef.current?.select();
    }
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
            {hasOngoingEvent && (
              <Box data-testid={'header-ongoing-dot'}
                   position={'absolute'}
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
              onDayActivate={(_dayEvents, dayKey) => {
                jumpToAnchor(getEventDateAnchorId(dayKey));
                if (isMobile) {
                  closePopover();
                }
              }}
            />
            {!isIcalExpanded ? (
              <Box borderTop={'1px solid'} borderColor={'gray.100'} pt={'2'}>
                <Button variant={'link'}
                        size={'xs'}
                        fontWeight={'normal'}
                        color={'gray.500'}
                        leftIcon={<FiCalendar />}
                        _hover={{color: 'gray.700'}}
                        onClick={() => setIsIcalExpanded(true)}
                        >
                  お使いのカレンダーアプリでも見られます
                </Button>
              </Box>
            ) : (
              <Stack borderTop={'1px solid'} borderColor={'gray.100'} pt={'3'} spacing={'3'}>
                <Stack spacing={'2'}>
                  <Text fontSize={'xs'} fontWeight={'bold'} color={'gray.600'}>
                    外部カレンダーに登録
                  </Text>
                  <HStack spacing={'2'} align={'stretch'}>
                    <Link ref={firstServiceLinkRef}
                          href={GOOGLE_CALENDAR_ADD_URL}
                          isExternal
                          flex={'1'}
                          aria-label={'Google カレンダーに登録する'}
                          style={{textDecoration: 'none'}}
                          >
                      <Stack align={'center'}
                             spacing={'1'}
                             border={'1px solid'}
                             borderColor={'gray.200'}
                             borderRadius={'md'}
                             py={'2'}
                             _hover={{bg: 'gray.50', borderColor: 'gray.300'}}
                             >
                        <Center boxSize={'26px'} borderRadius={'md'} bg={'rgba(66,133,244,.12)'}>
                          <SiGoogle color={'#4285F4'} size={13} />
                        </Center>
                        <Text fontSize={'10px'} color={'gray.600'}>Google</Text>
                      </Stack>
                    </Link>
                    <Link href={OUTLOOK_CALENDAR_ADD_URL}
                          isExternal
                          flex={'1'}
                          aria-label={'Outlook に登録する'}
                          style={{textDecoration: 'none'}}
                          >
                      <Stack align={'center'}
                             spacing={'1'}
                             border={'1px solid'}
                             borderColor={'gray.200'}
                             borderRadius={'md'}
                             py={'2'}
                             _hover={{bg: 'gray.50', borderColor: 'gray.300'}}
                             >
                        <Center boxSize={'26px'} borderRadius={'md'} bg={'rgba(0,120,212,.12)'}>
                          <PiMicrosoftOutlookLogoFill color={'#0078D4'} size={15} />
                        </Center>
                        <Text fontSize={'10px'} color={'gray.600'}>Outlook</Text>
                      </Stack>
                    </Link>
                    <Link href={APPLE_CALENDAR_URL}
                          flex={'1'}
                          aria-label={'Apple カレンダーに登録する'}
                          style={{textDecoration: 'none'}}
                          >
                      <Stack align={'center'}
                             spacing={'1'}
                             border={'1px solid'}
                             borderColor={'gray.200'}
                             borderRadius={'md'}
                             py={'2'}
                             _hover={{bg: 'gray.50', borderColor: 'gray.300'}}
                             >
                        <Center boxSize={'26px'} borderRadius={'md'} bg={'gray.800'}>
                          <SiApple color={'white'} size={13} />
                        </Center>
                        <Text fontSize={'10px'} color={'gray.600'}>Apple</Text>
                      </Stack>
                    </Link>
                  </HStack>
                </Stack>
                <Stack spacing={'2'} borderTop={'1px solid'} borderColor={'gray.100'} pt={'3'}>
                  <Text fontSize={'xs'} fontWeight={'bold'} color={'gray.600'}>
                    iCalendar URL
                  </Text>
                  <Text fontSize={'xs'} color={'gray.500'}>
                    URLを直接お使いになりたい方はこちらをご利用ください。
                  </Text>
                  <HStack spacing={'2'}>
                    <Input ref={icalUrlInputRef}
                          value={ICAL_URL}
                          size={'sm'}
                          isReadOnly
                          onSelect={(e) => {
                            const inputElement = e.target as HTMLInputElement;
                            inputElement.select();
                          }}
                          />
                    <IconButton aria-label={'iCalendar URLをコピー'}
                                icon={isUrlCopied ? <FiCheck /> : <FiCopy />}
                                size={'sm'}
                                variant={isUrlCopied ? 'solid' : 'outline'}
                                colorScheme={isUrlCopied ? 'green' : undefined}
                                onClick={handleCopyIcalUrl}
                                />
                  </HStack>
                </Stack>
              </Stack>
            )}
          </Stack>
        </PopoverBody>
      </PopoverContent>
    </Popover>
  )
}

export function GithubButton() {

  return (
    <Popover placement='bottom-end'>
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
                  onClick={() => { window.open('https://github.com/yuukis/yamanashi-event-archive', '_blank') }}>
            <Github mr={'2'} />
            <Text fontWeight={'normal'}>yuukis/yamanashi-event-archive</Text>
            <Spacer />
          </Button>
          <Button w={'100%'} variant={'ghost'} size={'sm'}
                  onClick={() => { window.open('https://github.com/yuukis/yamanashi-event-notify-backend', '_blank') }}>
            <Github mr={'2'} />
            <Text fontWeight={'normal'}>yuukis/yamanashi-event-notify-backend</Text>
            <Spacer />
          </Button>
          <Button w={'100%'} variant={'ghost'} size={'sm'}
                  onClick={() => { window.open('https://github.com/yuukis/yamanashi-event-feed', '_blank') }}>
            <Github mr={'2'} />
            <Text fontWeight={'normal'}>yuukis/yamanashi-event-feed</Text>
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
      <Box w={'100%'}>
        <Button size={'sm'} m={'1'}
                variant={'outline'}
                colorScheme={'primary'}
                rightIcon={<ChevronRightIcon />}
                onClick={() => { window.open('/events', '_self'); }}
                >
          イベントアーカイブを見る
        </Button>
      </Box>
      {years.map((year) => (
        <Button key={year} size={'sm'} m={'1'}
                onClick={() => { window.open(`/events/${year}`, '_self'); }}
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
