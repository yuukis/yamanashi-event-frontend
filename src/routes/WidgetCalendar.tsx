import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  Heading,
  HStack,
  IconButton,
  Stack,
  Text,
  Link,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
} from '@chakra-ui/react';
import { ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';
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

const MIN_MONTH_OFFSET = -4;
const MAX_MONTH_OFFSET = 4;

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
                    isDisabled={monthOffset <= MIN_MONTH_OFFSET}
                    onClick={() => setMonthOffset((current) => Math.max(current - 1, MIN_MONTH_OFFSET))}
                    />
        <Heading size={'sm'} flex={'1'} textAlign={'center'}>{ monthLabel }</Heading>
        <IconButton aria-label='次月を表示'
                    icon={<ChevronRightIcon />}
                    size={'xs'}
                    variant={'outline'}
                    isDisabled={monthOffset >= MAX_MONTH_OFFSET}
                    onClick={() => setMonthOffset((current) => Math.min(current + 1, MAX_MONTH_OFFSET))}
                    />
      </HStack>

      <Box data-testid={'calendar-fill-wrapper'}
           flex={'1'}
           minH={0}
           display={'flex'}
           flexDirection={'column'}
           >
        <MiniEventCalendar calendarDays={calendarDays}
                            todayKey={todayKey}
                            eventsByDate={eventsByDate}
                            isLoading={isLoading}
                            errorMessage={errorMessage}
                            onDayActivate={(dayEvents, dayKey) => setSelectedDay({ key: dayKey, events: dayEvents })}
                            fillHeight
                            suppressTooltips={!!selectedDay}
                            />
      </Box>

      <Text fontSize={'xs'} color={'gray.400'} textAlign={'right'} mt={'4'} flexShrink={0}>
        Powered by{' '}
        <Link href={'https://hub.yamanashi.dev'} isExternal color={'primary.700'}>
          Yamanashi Developer Hub
        </Link>
      </Text>

      <Modal isOpen={!!selectedDay} onClose={() => setSelectedDay(null)} isCentered>
        <ModalOverlay />
        <ModalContent maxW={{ base: 'calc(100vw - 32px)', sm: '400px' }} maxH={'80vh'} mx={'4'}>
          <ModalHeader fontSize={'sm'} textAlign={'center'} pr={'10'}>
            { selectedDay && formatDayHeading(selectedDay.key) }
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody overflowY={'auto'} pb={'4'}>
            <Stack spacing={'1'} divider={<Box borderBottomWidth={'1px'} borderColor={'gray.100'} />}>
              {(selectedDay?.events ?? []).map((event) => <WidgetEventItem key={event.uid} event={event} />)}
            </Stack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
}

export default WidgetCalendar;
