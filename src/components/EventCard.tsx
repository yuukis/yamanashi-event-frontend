import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { AspectRatio, Badge, Box, Button, HStack, Heading, IconButton, Image, Link, Stack, Text } from '@chakra-ui/react';
import { GeoAlt, People, Person, Star, StarFill } from '@chakra-icons/bootstrap';
import { formatEventDateKey, getEventAnchorId } from '../utils/eventAnchors';
import { EVENT_CARD_HIGHLIGHT_EVENT } from '../utils/hashScroll';
import { subscribeNow, getNow } from '../utils/nowTicker';
import { isEventNew } from '../utils/newEventTracking';
import { subscribeTrackingData, getTrackingDataSnapshot } from '../utils/newEventTrackingStore';
import { isEventMarked, markEvent, unmarkEvent } from '../utils/markedEvents';
import { subscribeMarkedEvents, getMarkedEventsSnapshot, updateMarkedEventsData } from '../utils/markedEventsStore';
import { buildGroupPagePath } from '../utils/groupPage';
import type { EventWithGroup } from '../types/events';

const DAY_OF_WEEK = ['日', '月', '火', '水', '木', '金', '土'];

const GROUP_BADGE_STYLE = {
  position: 'absolute',
  bottom: '0',
  right: '3',
  transform: 'translateY(50%)',
  w: '48px',
  h: '48px',
  borderRadius: 'lg',
  overflow: 'hidden',
  border: '1px solid',
  borderColor: 'gray.200',
  boxShadow: 'sm',
  zIndex: 1,
} as const;

const STATUS_BADGE_STYLE = {
  position: 'absolute',
  top: '0',
  left: '3',
  transform: 'translateY(-50%)',
  boxShadow: 'sm',
  zIndex: 1,
  fontWeight: 'bold',
  fontSize: { base: 'xs', sm: 'sm', md: 'md', lg: 'lg' },
  borderStyle: 'solid',
  borderWidth: { base: '1px', sm: '1px', md: '1.5px', lg: '2px' },
} as const;

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
  const now_year = now.getFullYear();
  const start_year = start_date.getFullYear();
  const start_month = start_date.getMonth() + 1;
  const start_day = start_date.getDate();
  const start_dow = DAY_OF_WEEK[start_date.getDay()];
  const start_time = start_date.getHours() + ':' + ('0' + start_date.getMinutes()).slice(-2);
  const has_ended = now.getTime() > end_date.getTime();
  const is_today = formatEventDateKey(start_date) === formatEventDateKey(now);
  const is_ongoing = now.getTime() >= start_date.getTime() && !has_ended;
  const is_new = isEventNew(trackingData, event, now);
  const has_group_page = Boolean(event.group_key) && event.is_registered_group !== false;
  const group_page_aria_label = `${event.group_name ?? 'コミュニティ'}のページを見る`;
  const show_ongoing_badge = (is_today || is_ongoing) && !has_ended;
  const show_new_badge = !show_ongoing_badge && is_new;
  const card_border_color = show_ongoing_badge ? 'impact.500' : show_new_badge ? 'purple.500' : 'gray.200';

  const address = [event.address, event.place].filter(Boolean)[0];
  const event_map_url = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(address || '');

  const cardRef = useRef<HTMLDivElement>(null);
  const [isHighlighted, setIsHighlighted] = useState(false);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) {
      return;
    }

    let timer: ReturnType<typeof setTimeout> | undefined;

    const handleHighlight = () => {
      setIsHighlighted(true);
      clearTimeout(timer);
      timer = setTimeout(() => setIsHighlighted(false), 2000);
    };

    card.addEventListener(EVENT_CARD_HIGHLIGHT_EVENT, handleHighlight);
    return () => {
      card.removeEventListener(EVENT_CARD_HIGHLIGHT_EVENT, handleHighlight);
      clearTimeout(timer);
    };
  }, []);

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

  const handleGroupLogoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (event.group_key) {
      window.open(buildGroupPagePath(event.group_key), '_self');
    }
  };

  return (
    <Box as={'article'}
         ref={cardRef}
         id={anchorId}
         data-event-card
         data-event-date={formatEventDateKey(start_date).replace(/-/g, '')}
         className={isHighlighted ? 'event-card-ring-pulse' : undefined}
         scrollMarginTop={{ base: '4.5rem', md: '5.5rem' }}
         position={'relative'}
         display={'flex'}
         flexDirection={'column'}
         h={'100%'}
         borderRadius={'md'}
         borderStyle={'solid'}
         borderWidth={show_ongoing_badge || show_new_badge ? STATUS_BADGE_STYLE.borderWidth : '1px'}
         borderColor={card_border_color}
         bg={'white'}
         p={'3'}
         _hover={{
           borderColor: show_ongoing_badge ? 'impact.600' : show_new_badge ? 'purple.600' : 'gray.300',
           shadow: 'sm',
         }}
         transition={'box-shadow 120ms ease-out, border-color 120ms ease-out'}
         >
      <Box id={getEventAnchorId(event.uid)}
           position={'absolute'}
           top={'0'} left={'0'}
           w={'0'} h={'0'}
           overflow={'hidden'}
           scrollMarginTop={{ base: '4.5rem', md: '5.5rem' }}
           aria-hidden
           />
      <Box position={'relative'} mt={'-3'} mx={'-3'} mb={'3'}>
        <Box borderTopRadius={'md'} overflow={'hidden'}>
          <Link href={event.event_url} isExternal display={'block'}>
            <AspectRatio ratio={16 / 9} borderBottom={'1px solid'} borderColor={'gray.200'}>
              {event.image_url ? (
                <Image src={event.image_url} alt={''} fit={'cover'} />
              ) : (
                <Box className={'scroll-row-bg-pattern'} />
              )}
            </AspectRatio>
          </Link>
        </Box>
        {show_ongoing_badge ? (
          <Badge bg={'#f9f1e8'}
                 color={'impact.700'}
                 borderColor={'impact.500'}
                 {...STATUS_BADGE_STYLE}
                 >
            {is_ongoing ? '開催中' : '本日開催'}
          </Badge>
        ) : show_new_badge ? (
          <Badge bg={'#f3e8fb'}
                 color={'purple.700'}
                 borderColor={'purple.500'}
                 {...STATUS_BADGE_STYLE}
                 >
            NEW
          </Badge>
        ) : null}
        {event.group_image_url ? (
          event.group_key ? (
            <Button variant={'unstyled'}
                    aria-label={group_page_aria_label}
                    onClick={handleGroupLogoClick}
                    minW={'auto'}
                    p={'0'}
                    bg={'#ffffff'}
                    {...GROUP_BADGE_STYLE}
                    >
              <Image src={event.group_image_url}
                     alt={''}
                     w={'100%'} h={'100%'}
                     fit={'contain'}
                     pointerEvents={'none'}
                     />
            </Button>
          ) : (
            <Box bg={'#ffffff'} pointerEvents={'none'} {...GROUP_BADGE_STYLE}>
              <Image src={event.group_image_url}
                     alt={''}
                     w={'100%'} h={'100%'}
                     fit={'contain'}
                     />
            </Box>
          )
        ) : has_group_page && (
          <Button variant={'unstyled'}
                  aria-label={group_page_aria_label}
                  onClick={handleGroupLogoClick}
                  minW={'auto'}
                  p={'0'}
                  display={'flex'}
                  alignItems={'center'}
                  justifyContent={'center'}
                  bg={'gray.50'}
                  {...GROUP_BADGE_STYLE}
                  >
            <People color={'gray.400'} />
          </Button>
        )}
      </Box>
      <Stack spacing={'0'} color={'gray.600'} fontSize={'sm'} mb={'1'}>
        {now_year !== start_year && (
          <Text fontSize={'xs'} fontWeight={'light'} lineHeight={'1'}>{start_year}</Text>
        )}
        <HStack spacing={'1'} align={'baseline'} mt={now_year !== start_year ? '-1' : '0'}>
          <HStack spacing={'0'} fontSize={{ base: 'sm', sm: 'lg', md: 'xl', lg: '2xl' }}>
            <Text as={'span'} fontWeight={'bold'}>{start_month}</Text>
            <Text as={'span'} fontWeight={'light'}>/{start_day}</Text>
          </HStack>
          <Text whiteSpace={'nowrap'}>({start_dow}) {start_time}-</Text>
        </HStack>
      </Stack>
      <Heading size={'sm'}
                color={'primary.800'}
                noOfLines={2}
                >
        <Link href={event.event_url} isExternal>{ event.title }</Link>
      </Heading>
      <Stack spacing={'0.5'} mt={'auto'} pt={'2'} pr={'6'} fontSize={'xs'} color={'gray.500'}>
        {address && (
          <HStack spacing={'1'}>
            <GeoAlt />
            <Text noOfLines={1}><Link href={event_map_url} isExternal>{ address }</Link></Text>
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
    </Box>
  );
}

