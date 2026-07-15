import { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Heading, HStack, IconButton, Stack, Text, Link } from '@chakra-ui/react';
import { ArrowBackIcon, ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';
import { MiniEventCalendar } from '../components/MiniEventCalendar';
import { WidgetEventItem } from '../components/WidgetEventItem';
import { buildCalendarDays, buildEventsByDate, useTodayDate } from '../utils/calendar';
import { formatEventDateKey } from '../utils/eventAnchors';
import { fetchEvents } from '../utils/api';
import { useReportWidgetHeight } from '../utils/widgetResize';
import { WIDGET_EVENT_ITEM_FIELDS } from '../utils/widgetFields';
import type { ApiEvent } from '../types/events';

type SelectedDay = {
  key: string;
  events: ApiEvent[];
};

function formatDayHeading(dayKey: string): string {
  const date = new Date(`${dayKey}T00:00:00`);
  const dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()];
  return `${date.getMonth() + 1}月${date.getDate()}日(${dayOfWeek})`;
}

function WidgetCalendar() {
  const [monthOffset, setMonthOffset] = useState(0);
  const today = useTodayDate();
  const monthStart = useMemo(
    () => new Date(today.getFullYear(), today.getMonth() + monthOffset, 1),
    [today, monthOffset],
  );
  const monthLabel = monthStart.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' });
  const todayKey = formatEventDateKey(today);
  const calendarDays = useMemo(() => buildCalendarDays(monthStart), [monthStart]);

  const [events, setEvents] = useState<ApiEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedDay, setSelectedDay] = useState<SelectedDay | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchEvents(WIDGET_EVENT_ITEM_FIELDS)
      .then((res) => {
        if (cancelled) {
          return;
        }
        setEvents(res.events);
        setErrorMessage('');
      })
      .catch((err) => {
        if (cancelled) {
          return;
        }
        setErrorMessage(err.message);
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedDay) {
      return;
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedDay(null);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedDay]);

  const eventsByDate = useMemo(() => buildEventsByDate(events, calendarDays), [events, calendarDays]);

  const containerRef = useRef<HTMLDivElement>(null);
  useReportWidgetHeight(containerRef);

  document.title = 'Yamanashi Developer Hub - イベントカレンダーウィジェット';

  return (
    <Box ref={containerRef} bg={'white'} p={'4'} minH={'100vh'} display={'flex'} flexDirection={'column'}>
      <HStack spacing={'2'} mb={'3'} flexShrink={0}>
        <IconButton aria-label='前月を表示'
                    icon={<ChevronLeftIcon />}
                    size={'xs'}
                    variant={'outline'}
                    onClick={() => setMonthOffset((current) => current - 1)}
                    />
        <Heading size={'sm'} flex={'1'} textAlign={'center'}>{ monthLabel }</Heading>
        <IconButton aria-label='次月を表示'
                    icon={<ChevronRightIcon />}
                    size={'xs'}
                    variant={'outline'}
                    onClick={() => setMonthOffset((current) => current + 1)}
                    />
      </HStack>

      <Box position={'relative'} flex={'1'} minH={0}>
        <MiniEventCalendar calendarDays={calendarDays}
                            todayKey={todayKey}
                            eventsByDate={eventsByDate}
                            isLoading={isLoading}
                            errorMessage={errorMessage}
                            onDayActivate={(dayEvents, dayKey) => setSelectedDay({ key: dayKey, events: dayEvents })}
                            fillHeight
                            />

        {selectedDay && (
          <Box position={'absolute'}
               inset={'0'}
               bg={'white'}
               display={'flex'}
               flexDirection={'column'}
               borderWidth={'1px'}
               borderColor={'gray.200'}
               borderRadius={'md'}
               >
            <HStack p={'2'} borderBottomWidth={'1px'} borderColor={'gray.100'} flexShrink={0}>
              <IconButton aria-label='カレンダーに戻る'
                          icon={<ArrowBackIcon />}
                          size={'xs'}
                          variant={'ghost'}
                          onClick={() => setSelectedDay(null)}
                          />
              <Heading size={'sm'} flex={'1'} textAlign={'center'}>{ formatDayHeading(selectedDay.key) }</Heading>
              <Box w={'24px'} flexShrink={0} aria-hidden />
            </HStack>
            <Box flex={'1'} minH={0} overflowY={'auto'}>
              <Stack spacing={'1'} divider={<Box borderBottomWidth={'1px'} borderColor={'gray.100'} />}>
                {selectedDay.events.map((event) => <WidgetEventItem key={event.uid} event={event} />)}
              </Stack>
            </Box>
          </Box>
        )}
      </Box>

      <Text fontSize={'xs'} color={'gray.400'} textAlign={'right'} mt={'4'} flexShrink={0}>
        Powered by{' '}
        <Link href={'https://hub.yamanashi.dev'} isExternal color={'primary.700'}>
          Yamanashi Developer Hub
        </Link>
      </Text>
    </Box>
  );
}

export default WidgetCalendar;
