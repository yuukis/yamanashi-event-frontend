import { useRef, useSyncExternalStore } from 'react';
import {
  Box,
  HStack,
  Stack,
  Text,
  Badge,
  Link,
  Image,
  Skeleton,
  SkeletonCircle,
} from '@chakra-ui/react';
import { People } from '@chakra-icons/bootstrap';
import { WidgetEventError } from './WidgetEventItem';
import { subscribeNow, getNow } from '../utils/nowTicker';
import { formatEventDateKey } from '../utils/eventAnchors';
import { useReportWidgetHeight } from '../utils/widgetResize';
import type { ApiEvent, ApiGroupDetail } from '../types/events';

const DAY_OF_WEEK = ['日', '月', '火', '水', '木', '金', '土'];

type NextEventBannerProps = {
  isLoading: boolean;
  group: ApiGroupDetail | null;
  nextEvent: ApiEvent | null;
  errorMessage: string;
};

function GroupLogo({ group }: { group: ApiGroupDetail }) {
  return (
    <Box boxSize={'12'}
         bg={'gray.50'}
         borderRadius={'md'}
         border={'1px solid'}
         borderColor={'gray.100'}
         display={'flex'}
         alignItems={'center'}
         justifyContent={'center'}
         flexShrink={0}
         >
      {group.image_url ? (
        <Image src={group.image_url} boxSize={'100%'} fit={'contain'} alt={group.title} />
      ) : (
        <People boxSize={'5'} color={'gray.400'} />
      )}
    </Box>
  );
}

export function NextEventBanner({ isLoading, group, nextEvent, errorMessage }: NextEventBannerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  useReportWidgetHeight(containerRef);
  const now = useSyncExternalStore(subscribeNow, getNow);

  if (isLoading) {
    return (
      <Box ref={containerRef} bg={'white'} p={'3'}>
        <HStack spacing={'3'} align={'center'}>
          <SkeletonCircle size={'12'} />
          <Stack spacing={'1'} flex={'1'}>
            <Skeleton height={'0.75rem'} width={'40%'} />
            <Skeleton height={'0.875rem'} width={'70%'} />
          </Stack>
        </HStack>
      </Box>
    );
  }

  if (errorMessage || !group) {
    return (
      <Box ref={containerRef} bg={'white'} p={'3'}>
        <WidgetEventError message={errorMessage || undefined} />
      </Box>
    );
  }

  const start_date = nextEvent ? new Date(nextEvent.started_at) : null;
  const end_date = nextEvent ? new Date(nextEvent.ended_at) : null;
  const now_year = now.getFullYear();
  const start_year = start_date?.getFullYear();
  const start_month = start_date ? start_date.getMonth() + 1 : null;
  const start_day = start_date?.getDate();
  const start_dow = start_date ? DAY_OF_WEEK[start_date.getDay()] : null;
  const start_time = start_date ? start_date.getHours() + ':' + ('0' + start_date.getMinutes()).slice(-2) : null;
  const is_today = start_date ? formatEventDateKey(start_date) === formatEventDateKey(now) : false;
  const has_ended = end_date ? now.getTime() > end_date.getTime() : false;
  const is_ongoing = start_date ? now.getTime() >= start_date.getTime() && !has_ended : false;

  return (
    <Box ref={containerRef} bg={'white'} p={'3'}>
      <HStack spacing={'3'} align={'center'}>
        <GroupLogo group={group} />
        <Box minW={0} flex={'1'}>
          <Text fontSize={'xs'} color={'gray.500'}>次回のイベント予定</Text>
          {nextEvent ? (
            <>
              <HStack spacing={'1'} align={'baseline'} mt={'1'}>
                {now_year !== start_year && (
                  <Text fontSize={'xs'} fontWeight={'light'} color={'gray.600'}>{ start_year }年</Text>
                )}
                <Text fontSize={'md'} fontWeight={'bold'} color={'gray.700'}>{ start_month }</Text>
                <Text fontSize={'md'} fontWeight={'light'} color={'gray.700'}>/{ start_day }</Text>
                <Text fontSize={'xs'} color={'gray.600'}>({ start_dow }) { start_time }〜</Text>
                {(is_today || is_ongoing) && !has_ended && (
                  <Badge bg={'#f9f1e8'}
                         color={'impact.700'}
                         border={'1px solid'}
                         borderColor={'impact.500'}
                         fontSize={'xs'}
                         fontWeight={'bold'}
                         w={'fit-content'}
                         >
                    { is_ongoing ? '開催中' : '本日開催' }
                  </Badge>
                )}
              </HStack>
              <Text fontSize={'sm'} fontWeight={'bold'} noOfLines={2}>
                <Link href={nextEvent.event_url} color={'primary.800'} isExternal>{ nextEvent.title }</Link>
              </Text>
            </>
          ) : (
            <Text fontSize={'sm'} color={'gray.600'} mt={'1'}>現在予定されているイベントはありません。</Text>
          )}
        </Box>
      </HStack>
    </Box>
  );
}
