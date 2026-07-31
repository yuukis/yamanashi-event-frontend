import { useSyncExternalStore } from 'react';
import {
  Box,
  HStack,
  Text,
  Badge,
  Link,
  Image,
  Skeleton,
} from '@chakra-ui/react';
import { People } from '@chakra-icons/bootstrap';
import { WidgetEventError } from './WidgetEventItem';
import { subscribeNow, getNow } from '../utils/nowTicker';
import { formatEventDateKey } from '../utils/eventAnchors';
import type { ApiEvent, ApiGroupDetail } from '../types/events';

const DAY_OF_WEEK = ['日', '月', '火', '水', '木', '金', '土'];

type NextEventBannerProps = {
  isLoading: boolean;
  group: ApiGroupDetail | null;
  nextEvent: ApiEvent | null;
  errorMessage: string;
};

const EVENT_THUMBNAIL_HEIGHT = '96px';
const DEFAULT_BORDER_SHADOW = 'inset 0 0 0 1px #e2e8f0';
const STATUS_BORDER_SHADOW = 'inset 0 0 0 2px #ff6e61';

function EventThumbnail({ nextEvent }: { nextEvent: ApiEvent }) {
  return (
    <Box flexShrink={0} h={'100%'} w={'50%'} maxW={'170px'} overflow={'hidden'}>
      {nextEvent.image_url ? (
        <Image src={nextEvent.image_url} w={'100%'} h={'100%'} objectFit={'cover'} alt={''} />
      ) : (
        <Box className={'scroll-row-bg-pattern'} w={'100%'} h={'100%'} />
      )}
    </Box>
  );
}

function GroupLogo({ group }: { group: ApiGroupDetail | null }) {
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
         overflow={'hidden'}
         >
      {group?.image_url ? (
        <Image src={group.image_url} boxSize={'100%'} fit={'contain'} alt={group.title} />
      ) : (
        <People boxSize={'5'} color={'gray.400'} />
      )}
    </Box>
  );
}

export function NextEventBanner({ isLoading, group, nextEvent, errorMessage }: NextEventBannerProps) {
  const now = useSyncExternalStore(subscribeNow, getNow);

  if (isLoading) {
    return (
      <Box bg={'white'} h={EVENT_THUMBNAIL_HEIGHT} borderRadius={'md'} overflow={'hidden'} boxShadow={DEFAULT_BORDER_SHADOW}>
        <HStack spacing={'3'} align={'stretch'} h={'100%'}>
          <Skeleton flexShrink={0} h={'100%'} w={'50%'} maxW={'170px'} />
          <Box minW={0} flex={'1'} py={'3'} pr={'3'} display={'flex'} flexDirection={'column'} justifyContent={'center'}>
            <Skeleton height={'0.75rem'} width={'30%'} mb={'2'} />
            <Skeleton height={'0.875rem'} width={'80%'} />
          </Box>
        </HStack>
      </Box>
    );
  }

  if (errorMessage) {
    return (
      <Box bg={'white'} h={EVENT_THUMBNAIL_HEIGHT} p={'3'} display={'flex'} alignItems={'center'} borderRadius={'md'} overflow={'hidden'} boxShadow={DEFAULT_BORDER_SHADOW}>
        <WidgetEventError message={errorMessage || undefined} />
      </Box>
    );
  }

  if (!nextEvent) {
    return (
      <Box bg={'white'} h={EVENT_THUMBNAIL_HEIGHT} p={'3'} borderRadius={'md'} overflow={'hidden'} boxShadow={DEFAULT_BORDER_SHADOW}>
        <HStack spacing={'3'} align={'center'} h={'100%'}>
          <GroupLogo group={group} />
          <Box minW={0} flex={'1'}>
            <Text fontSize={'sm'} color={'gray.600'}>現在予定されているイベントはありません。</Text>
          </Box>
        </HStack>
      </Box>
    );
  }

  const start_date = new Date(nextEvent.started_at);
  const end_date = new Date(nextEvent.ended_at);
  const now_year = now.getFullYear();
  const start_year = start_date.getFullYear();
  const start_month = start_date.getMonth() + 1;
  const start_day = start_date.getDate();
  const start_dow = DAY_OF_WEEK[start_date.getDay()];
  const start_time = start_date.getHours() + ':' + ('0' + start_date.getMinutes()).slice(-2);
  const is_today = formatEventDateKey(start_date) === formatEventDateKey(now);
  const has_ended = now.getTime() > end_date.getTime();
  const is_ongoing = now.getTime() >= start_date.getTime() && !has_ended;
  const show_status_badge = (is_today || is_ongoing) && !has_ended;

  return (
    <Box bg={'white'}
         h={EVENT_THUMBNAIL_HEIGHT}
         position={'relative'}
         borderRadius={'md'}
         overflow={'hidden'}
         >
      <Link href={nextEvent.event_url}
            isExternal
            aria-label={nextEvent.title}
            display={'block'}
            h={'100%'}
            textDecoration={'none'}
            _hover={{ textDecoration: 'none', bg: 'gray.50' }}
            >
        <HStack spacing={'3'} align={'stretch'} h={'100%'}>
          <EventThumbnail nextEvent={nextEvent} />
          <Box minW={0} flex={'1'} py={'3'} pr={'3'} display={'flex'} flexDirection={'column'} justifyContent={'center'} overflow={'hidden'}>
            {now_year !== start_year && (
              <Text fontSize={'xs'} fontWeight={'light'} color={'gray.600'}>{ start_year }</Text>
            )}
            <HStack spacing={'1'}
                    align={'baseline'}
                    overflow={'hidden'}
                    whiteSpace={'nowrap'}
                    mt={now_year !== start_year ? '-1' : '0'}
                    >
              <HStack spacing={'0'} align={'baseline'} flexShrink={0}>
                <Text fontSize={'md'} fontWeight={'bold'} color={'gray.700'}>{ start_month }</Text>
                <Text fontSize={'md'} fontWeight={'light'} color={'gray.700'}>/{ start_day }</Text>
              </HStack>
              <Text fontSize={'xs'} color={'gray.600'} minW={0} overflow={'hidden'} textOverflow={'ellipsis'}>
                ({ start_dow }) { start_time }-
              </Text>
            </HStack>
            <Text fontSize={'sm'} fontWeight={'bold'} color={'primary.800'} noOfLines={2}>
              { nextEvent.title }
            </Text>
          </Box>
        </HStack>
      </Link>
      <Box position={'absolute'}
           inset={'0'}
           borderRadius={'md'}
           boxShadow={show_status_badge ? STATUS_BORDER_SHADOW : DEFAULT_BORDER_SHADOW}
           pointerEvents={'none'}
           />
      {show_status_badge && (
        <Badge position={'absolute'}
               top={'2'}
               left={'2'}
               pointerEvents={'none'}
               bg={'#f9f1e8'}
               color={'impact.700'}
               border={'1px solid'}
               borderColor={'impact.500'}
               fontSize={'xs'}
               fontWeight={'bold'}
               >
          { is_ongoing ? '開催中' : '本日開催' }
        </Badge>
      )}
    </Box>
  );
}
