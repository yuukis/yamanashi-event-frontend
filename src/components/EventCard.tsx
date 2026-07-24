import { useSyncExternalStore } from 'react';
import { Badge, Box, HStack, Heading, IconButton, Image, LinkBox, LinkOverlay, Stack, Text } from '@chakra-ui/react';
import { GeoAlt, People, Person, Star, StarFill } from '@chakra-icons/bootstrap';
import { formatEventDateKey, getEventAnchorId } from '../utils/eventAnchors';
import { subscribeNow, getNow } from '../utils/nowTicker';
import { isEventNew } from '../utils/newEventTracking';
import { subscribeTrackingData, getTrackingDataSnapshot } from '../utils/newEventTrackingStore';
import { isEventMarked, markEvent, unmarkEvent } from '../utils/markedEvents';
import { subscribeMarkedEvents, getMarkedEventsSnapshot, updateMarkedEventsData } from '../utils/markedEventsStore';
import { isArchiveEvent } from '../utils/eventGroups';
import type { EventWithGroup } from '../types/events';

const DAY_OF_WEEK = ['日', '月', '火', '水', '木', '金', '土'];

type EventCardProps = {
  event: EventWithGroup;
  anchorId?: string;
};

export function EventCard({ event, anchorId }: EventCardProps) {
  const now = useSyncExternalStore(subscribeNow, getNow);
  const trackingData = useSyncExternalStore(subscribeTrackingData, getTrackingDataSnapshot);
  const markedEventsData = useSyncExternalStore(subscribeMarkedEvents, getMarkedEventsSnapshot);
  const isMarked = isEventMarked(markedEventsData, event.uid);

  const start_date = new Date(event.started_at);
  const end_date = new Date(event.ended_at);
  const start_month = start_date.getMonth() + 1;
  const start_day = start_date.getDate();
  const start_dow = DAY_OF_WEEK[start_date.getDay()];
  const start_time = start_date.getHours() + ':' + ('0' + start_date.getMinutes()).slice(-2);
  const has_ended = now.getTime() > end_date.getTime();
  const is_today = formatEventDateKey(start_date) === formatEventDateKey(now);
  const is_ongoing = now.getTime() >= start_date.getTime() && !has_ended;
  const is_new = isEventNew(trackingData, event, now);
  const is_archive_event = isArchiveEvent(event);

  const address = [event.address, event.place].filter(Boolean)[0];

  const markLabel = has_ended
    ? (isMarked ? '気になる解除' : '気になる')
    : (isMarked ? '行きたいから外す' : '行きたいに追加');

  const handleMarkClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    updateMarkedEventsData((previous) =>
      isMarked ? unmarkEvent(previous, event.uid) : markEvent(previous, event.uid, new Date())
    );
  };

  return (
    <LinkBox as={'article'}
             id={anchorId}
             data-event-card
             data-event-date={formatEventDateKey(start_date).replace(/-/g, '')}
             position={'relative'}
             h={'100%'}
             borderRadius={'md'}
             border={'1px solid'}
             borderColor={'gray.200'}
             bg={'white'}
             p={'3'}
             _hover={{ borderColor: 'gray.300', shadow: 'sm' }}
             transition={'box-shadow 120ms ease-out, border-color 120ms ease-out'}
             >
      <Box id={getEventAnchorId(event.uid)}
           position={'absolute'}
           top={'0'} left={'0'}
           w={'0'} h={'0'}
           overflow={'hidden'}
           aria-hidden
           />
      <HStack justify={'space-between'} align={'flex-start'} mb={'1'} pr={event.group_image_url ? '52px' : '0'}>
        <HStack spacing={'1'} color={'gray.600'} fontSize={'sm'} flexShrink={0}>
          <Text fontWeight={'bold'}>{start_month}/{start_day}</Text>
          <Text whiteSpace={'nowrap'}>({start_dow}) {start_time}-</Text>
        </HStack>
        {(is_today || is_ongoing) && !has_ended ? (
          <Badge bg={'#f9f1e8'}
                 color={'impact.700'}
                 border={'1px solid'}
                 borderColor={'impact.500'}
                 fontSize={'xs'}
                 fontWeight={'bold'}
                 flexShrink={0}
                 >
            {is_ongoing ? '開催中' : '本日開催'}
          </Badge>
        ) : is_new ? (
          <Badge bg={'#f3e8fb'}
                 color={'purple.700'}
                 border={'1px solid'}
                 borderColor={'purple.500'}
                 fontSize={'xs'}
                 fontWeight={'bold'}
                 flexShrink={0}
                 >
            NEW
          </Badge>
        ) : null}
      </HStack>
      <Heading size={'sm'}
                color={'primary.800'}
                noOfLines={2}
                pr={event.group_image_url ? '52px' : '0'}
                >
        <LinkOverlay href={event.event_url} isExternal>{ event.title }</LinkOverlay>
      </Heading>
      {is_archive_event && (
        <Badge colorScheme={'secondary'} variant={'subtle'} mt={'1'}>アーカイブ</Badge>
      )}
      {event.group_image_url && (
        <Image src={event.group_image_url}
               alt={''}
               w={'44px'} h={'30px'}
               fit={'contain'}
               position={'absolute'}
               top={'3'} right={'3'}
               />
      )}
      <Stack spacing={'0.5'} mt={'2'} fontSize={'xs'} color={'gray.500'}>
        {address && (
          <HStack spacing={'1'}>
            <GeoAlt />
            <Text noOfLines={1}>{ address }</Text>
          </HStack>
        )}
        {event.group_name ? (
          <HStack spacing={'1'}>
            <People />
            <Text noOfLines={1}>{ event.group_name }</Text>
          </HStack>
        ) : event.owner_name ? (
          <HStack spacing={'1'}>
            <Person />
            <Text noOfLines={1}>{ event.owner_name }</Text>
          </HStack>
        ) : null}
      </Stack>
      <IconButton aria-label={markLabel}
                  icon={isMarked ? <StarFill /> : <Star />}
                  size={'xs'}
                  variant={isMarked ? 'solid' : 'ghost'}
                  colorScheme={isMarked ? 'yellow' : 'gray'}
                  position={'absolute'}
                  bottom={'2'} right={'2'}
                  zIndex={1}
                  onClick={handleMarkClick}
                  />
    </LinkBox>
  );
}

export function EventCardSkeleton() {
  return (
    <Stack spacing={'2'}
           borderRadius={'md'}
           border={'1px solid'}
           borderColor={'gray.200'}
           bg={'white'}
           p={'3'}
           h={'100%'}
           >
      <Box h={'0.875rem'} w={'40%'} bg={'gray.100'} borderRadius={'sm'} />
      <Box h={'1rem'} w={'80%'} bg={'gray.100'} borderRadius={'sm'} />
      <Box h={'0.75rem'} w={'60%'} bg={'gray.100'} borderRadius={'sm'} />
    </Stack>
  );
}
