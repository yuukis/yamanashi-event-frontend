import { useSyncExternalStore } from 'react';
import {
  Box,
  HStack,
  Stack,
  Text,
  Badge,
  Link,
  Skeleton,
  SkeletonCircle,
} from '@chakra-ui/react';
import { subscribeNow, getNow } from '../utils/nowTicker';
import { isEventNew } from '../utils/newEventTracking';
import { subscribeTrackingData, getTrackingDataSnapshot } from '../utils/newEventTrackingStore';
import { formatEventDateKey } from '../utils/eventAnchors';
import type { ApiEvent } from '../types/events';

const DAY_OF_WEEK = ['日', '月', '火', '水', '木', '金', '土'];

type WidgetEventItemProps = {
  event: ApiEvent;
};

export function WidgetEventItem({ event }: WidgetEventItemProps) {
  const now = useSyncExternalStore(subscribeNow, getNow);
  const trackingData = useSyncExternalStore(subscribeTrackingData, getTrackingDataSnapshot);

  const start_date = new Date(event.started_at);
  const end_date = new Date(event.ended_at);
  const now_year = now.getFullYear();
  const start_year = start_date.getFullYear();
  const start_month = start_date.getMonth() + 1;
  const start_day = start_date.getDate();
  const start_dow = DAY_OF_WEEK[start_date.getDay()];
  const start_time = start_date.getHours() + ':' + ('0' + start_date.getMinutes()).slice(-2);
  const is_today = formatEventDateKey(start_date) === formatEventDateKey(now);
  const has_ended = now.getTime() > end_date.getTime();
  const is_ongoing = now.getTime() >= start_date.getTime() && !has_ended;
  const is_new = isEventNew(trackingData, event, now);

  const address_array = [event.address, event.place].filter(Boolean);

  return (
    <HStack p={'2'} align={'flex-start'} spacing={'3'} data-widget-event-item>
      <Stack spacing={'0'} minW={'3.2rem'} flexShrink={0} color={'gray.600'}>
        {now_year !== start_year && (
          <Text fontSize={'xs'} fontWeight={'light'}>{ start_year }</Text>
        )}
        <HStack spacing={'0'}>
          <Text fontSize={'xl'} fontWeight={'bold'}>{ start_month }</Text>
          <Text fontSize={'xl'} fontWeight={'light'}>/{ start_day }</Text>
        </HStack>
        <Text fontSize={'xs'}>({ start_dow }) { start_time }〜</Text>
        {(is_today || is_ongoing) && !has_ended ? (
          <Badge bg={'#f9f1e8'}
                 color={'impact.700'}
                 border={'1px solid'}
                 borderColor={'impact.500'}
                 fontSize={'xs'}
                 fontWeight={'bold'}
                 w={'fit-content'}
                 mt={'1'}
                 >
            { is_ongoing ? '開催中' : '本日開催' }
          </Badge>
        ) : is_new ? (
          <Badge bg={'#f3e8fb'}
                 color={'purple.700'}
                 border={'1px solid'}
                 borderColor={'purple.500'}
                 fontSize={'xs'}
                 fontWeight={'bold'}
                 w={'fit-content'}
                 mt={'1'}
                 >
            NEW
          </Badge>
        ) : null}
      </Stack>
      <Box minW={0} flex={'1'}>
        <Text fontSize={'sm'} fontWeight={'bold'} noOfLines={2}>
          <Link href={event.event_url} color={'primary.800'} isExternal>{ event.title }</Link>
        </Text>
        {address_array.length > 0 && (
          <Text fontSize={'xs'} color={'gray.600'} noOfLines={1}>{ address_array.join(' ') }</Text>
        )}
        {event.group_name ? (
          <Text fontSize={'xs'} color={'gray.500'} noOfLines={1}>{ event.group_name }</Text>
        ) : event.owner_name ? (
          <Text fontSize={'xs'} color={'gray.500'} noOfLines={1}>{ event.owner_name }</Text>
        ) : null}
      </Box>
    </HStack>
  );
}

export function WidgetEventSkeleton() {
  return (
    <HStack p={'2'} spacing={'3'}>
      <Stack spacing={'1'} minW={'3.2rem'}>
        <Skeleton height={'1.5rem'} width={'2.5rem'} />
        <Skeleton height={'0.75rem'} width={'3rem'} />
      </Stack>
      <Stack spacing={'1'} flex={'1'}>
        <Skeleton height={'0.875rem'} width={'80%'} />
        <HStack>
          <SkeletonCircle size={'0.75rem'} />
          <Skeleton height={'0.75rem'} width={'40%'} />
        </HStack>
      </Stack>
    </HStack>
  );
}

export function WidgetEventEmpty() {
  return (
    <Box p={'2'}>
      <Text fontSize={'sm'} color={'gray.500'}>イベントはありません</Text>
    </Box>
  );
}

export function WidgetEventError({ message }: { message?: string }) {
  return (
    <Box p={'2'} color={'impact.500'}>
      <Text fontSize={'sm'} fontWeight={'bold'}>イベント情報の取得に失敗しました</Text>
      {message && (
        <Text fontSize={'xs'}>{ message }</Text>
      )}
    </Box>
  );
}
