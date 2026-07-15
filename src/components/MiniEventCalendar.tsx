import { Grid, SimpleGrid, Center, Stack, Text, Tooltip } from '@chakra-ui/react';
import type { CalendarDay } from '../utils/calendar';

type MiniEventCalendarEvent = {
  uid: string;
  title: string;
  started_at: string;
};

type MiniEventCalendarProps<T extends MiniEventCalendarEvent> = {
  calendarDays: CalendarDay[];
  todayKey: string;
  eventsByDate: Map<string, T[]>;
  isLoading: boolean;
  errorMessage: string;
  onDayActivate?: (dayEvents: T[], dayKey: string) => void;
  // trueの場合、親が確保した縦幅いっぱいまで日付マスを伸ばす。
  // ヘッダーのポップオーバー(コンパクト表示)ではfalseのまま使う。
  fillHeight?: boolean;
  // trueの場合、全マスのツールチップを無効化する。onDayActivateで
  // モーダル等を開いた直後、遅延オープン中だったツールチップが
  // モーダルの裏で後から表示されてしまうのを防ぐために使う。
  suppressTooltips?: boolean;
};

const WEEK_DAYS = ['日', '月', '火', '水', '木', '金', '土'];
const WEEK_COUNT = 6;

export function MiniEventCalendar<T extends MiniEventCalendarEvent>({
  calendarDays,
  todayKey,
  eventsByDate,
  isLoading,
  errorMessage,
  onDayActivate,
  fillHeight = false,
  suppressTooltips = false,
}: MiniEventCalendarProps<T>) {
  return (
    <Stack spacing={'2'} flex={fillHeight ? '1' : undefined} minH={0}>
      <SimpleGrid columns={7} spacing={'1'} flexShrink={0}>
        {WEEK_DAYS.map((day, index) => (
          <Center key={day}
                  h={'6'}
                  fontSize={'xs'}
                  color={index === 0 ? 'impact.700' : index === 6 ? 'primary.800' : 'gray.500'}
                  >
            {day}
          </Center>
        ))}
      </SimpleGrid>
      <Grid templateColumns={'repeat(7, 1fr)'}
            templateRows={fillHeight ? `repeat(${WEEK_COUNT}, 1fr)` : undefined}
            gap={'1'}
            flex={fillHeight ? '1' : undefined}
            minH={0}
            >
        {calendarDays.map((day) => {
          const dayEvents = eventsByDate.get(day.key) ?? [];
          const hasEvent = dayEvents.length > 0;
          const isActivatable = hasEvent && !!onDayActivate;
          const isToday = day.key === todayKey;
          const bg = hasEvent ? 'secondary.100' : 'white';
          const color = isToday ? 'impact.700' : day.isCurrentMonth ? 'gray.800' : 'gray.300';
          const dayLabel = `${day.date.getMonth() + 1}月${day.date.getDate()}日`;
          const activateDay = () => {
            if (!isActivatable) {
              return;
            }
            onDayActivate(dayEvents, day.key);
          };
          const dayCell = (
            <Center key={day.key}
                    h={fillHeight ? '100%' : '9'}
                    borderRadius={'md'}
                    border={isToday ? '2px solid' : '1px solid'}
                    borderColor={isToday ? 'impact.500' : 'gray.100'}
                    bg={bg}
                    color={color}
                    fontSize={isToday ? 'md' : 'sm'}
                    fontWeight={isToday || hasEvent ? 'bold' : 'normal'}
                    tabIndex={hasEvent ? 0 : undefined}
                    cursor={isActivatable ? 'pointer' : 'default'}
                    role={isActivatable ? 'link' : undefined}
                    onClick={isActivatable ? activateDay : undefined}
                    onKeyDown={isActivatable ? (e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        activateDay();
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
                     isDisabled={suppressTooltips}
                     >
              {dayCell}
            </Tooltip>
          );
        })}
      </Grid>
      {isLoading ? (
        <Text fontSize={'xs'} color={'gray.500'}>イベント日を読み込み中です</Text>
      ) : errorMessage ? (
        <Text fontSize={'xs'} color={'impact.700'}>イベント日を取得できませんでした</Text>
      ) : null}
    </Stack>
  );
}

function EventDayTooltip<T extends MiniEventCalendarEvent>({ events }: { events: T[] }) {
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

function formatEventTime(startedAt: string): string {
  const startedAtDate = new Date(startedAt);
  const hours = startedAtDate.getHours();
  const minutes = `${startedAtDate.getMinutes()}`.padStart(2, '0');

  return `${hours}:${minutes}-`;
}
