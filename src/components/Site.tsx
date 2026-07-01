import icon from "../assets/images/icon.png"
import { useEffect, useMemo, useState } from 'react';
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
import { RepeatClockIcon } from "@chakra-ui/icons";
import { Github, Calendar3, CaretRightFill } from '@chakra-icons/bootstrap';
import { fetchEvents } from '../utils/api';
import type { ApiEvent } from '../types/events';
  
export function SiteHeader() {
  return (
    <Box w={'100%'} bg={'white'}>
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
    </Box>
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
  const today = useMemo(() => new Date(), []);
  const monthStart = useMemo(() => new Date(today.getFullYear(), today.getMonth(), 1), [today]);
  const monthLabel = monthStart.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
  });
  const todayKey = formatDateKey(today);
  const calendarDays = useMemo(() => buildCalendarDays(monthStart), [monthStart]);
  const eventsByDate = useMemo(() => {
    const eventMap = new Map<string, ApiEvent[]>();
    const visibleDateKeys = new Set(calendarDays.map((day) => day.key));

    events.forEach((event) => {
      const eventDate = new Date(event.started_at);
      const key = formatDateKey(eventDate);

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
    if (!isOpen || events.length > 0 || isLoading || errorMessage) {
      return;
    }

    const getData = async () => {
      setIsLoading(true);
      try {
        const res = await fetchEvents();
        setEvents(res.events);
      } catch (err: any) {
        setErrorMessage(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    getData();
  }, [errorMessage, events.length, isLoading, isOpen]);

  return (
    <Popover isOpen={isOpen} onOpen={onOpen} onClose={onClose} placement='bottom-end'>
      <PopoverTrigger>
        <Button variant={'ghost'}
                aria-label='イベントカレンダー'
                px={{base: '2', md: '4'}}
                minW={{base: '10', md: 'auto'}}
                >
          <Calendar3 mr={{base: '0', md: '2'}} />
          <Text display={{base: 'none', md: 'block'}}
                fontWeight={'normal'}
                fontSize={'sm'}
                >
            カレンダー
          </Text>
        </Button>
      </PopoverTrigger>
      <PopoverContent w={{base: 'calc(100vw - 24px)', md: '360px'}}>
        <PopoverArrow />
        <PopoverHeader>
          <Text fontSize={'sm'}>
            {monthLabel}のイベントカレンダー
          </Text>
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
                   >
              <Text fontSize={'sm'}>
                iCalendar で外部のカレンダーに表示する
              </Text>
              <Text fontSize={'xs'}>
                以下の URL をコピーして、Google カレンダーなどのカレンダーに登録すると、
                カレンダー上でイベントが表示されるようになります
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
        <PopoverFooter>
          <Button w={'100%'} variant={'ghost'} size={'sm'}
                  onClick={() => { window.open('https://calendar.google.com/calendar/r/settings/addbyurl', '_blank') }}>
            <CaretRightFill mr={'2'} />
            <Text fontWeight={'normal'}>Google カレンダーに登録する</Text>
            <Spacer />
          </Button>
        </PopoverFooter>
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
          const bg = getCalendarDayBg(isToday, hasEvent);
          const color = day.isCurrentMonth ? 'gray.800' : 'gray.300';
          const dayCell = (
            <Center key={day.key}
                    h={'9'}
                    borderRadius={'md'}
                    border={'1px solid'}
                    borderColor={isToday ? 'impact.500' : 'gray.100'}
                    bg={bg}
                    color={color}
                    fontSize={'sm'}
                    fontWeight={isToday || hasEvent ? 'bold' : 'normal'}
                    tabIndex={hasEvent ? 0 : undefined}
                    cursor={hasEvent ? 'help' : 'default'}
                    aria-label={`${day.date.getDate()}日${isToday ? ' 今日' : ''}${hasEvent ? ' イベントあり' : ''}`}
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
      ) : (
        <HStack spacing={'3'} fontSize={'xs'} color={'gray.600'} flexWrap={'wrap'}>
          <HStack spacing={'1'}>
            <Box boxSize={'3'} borderRadius={'sm'} bg={'impact.100'} border={'1px solid'} borderColor={'impact.500'} />
            <Text>今日</Text>
          </HStack>
          <HStack spacing={'1'}>
            <Box boxSize={'3'} borderRadius={'sm'} bg={'secondary.100'} />
            <Text>イベントあり</Text>
          </HStack>
          <HStack spacing={'1'}>
            <Box boxSize={'3'} borderRadius={'sm'} bg={'primary.100'} border={'1px solid'} borderColor={'impact.500'} />
            <Text>今日のイベント</Text>
          </HStack>
        </HStack>
      )}
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
          {formatEventTime(event.started_at)} {event.title}
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
      key: formatDateKey(date),
      isCurrentMonth: date.getMonth() === monthStart.getMonth(),
    });
  }

  return days;
}

function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function formatEventTime(startedAt: string): string {
  return new Date(startedAt).toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function getCalendarDayBg(isToday: boolean, hasEvent: boolean) {
  if (isToday && hasEvent) {
    return 'primary.100';
  }
  if (isToday) {
    return 'impact.100';
  }
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
