import { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Heading, HStack, IconButton, Text, Link } from '@chakra-ui/react';
import { ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';
import { MiniEventCalendar } from '../components/MiniEventCalendar';
import { buildCalendarDays, buildEventsByDate, useTodayDate } from '../utils/calendar';
import { formatEventDateKey } from '../utils/eventAnchors';
import { fetchEvents } from '../utils/api';
import { useReportWidgetHeight } from '../utils/widgetResize';

const WIDGET_CALENDAR_FIELDS = ['uid', 'title', 'started_at'].join(',');

type WidgetCalendarEvent = {
  uid: string;
  title: string;
  started_at: string;
};

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

  const [events, setEvents] = useState<WidgetCalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let cancelled = false;
    fetchEvents(WIDGET_CALENDAR_FIELDS)
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

      <MiniEventCalendar calendarDays={calendarDays}
                          todayKey={todayKey}
                          eventsByDate={eventsByDate}
                          isLoading={isLoading}
                          errorMessage={errorMessage}
                          fillHeight
                          />

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
