import { useState, useEffect, useRef, useSyncExternalStore } from 'react';
import {
  Box,
  Stack,
  HStack,
  VStack,
  Spacer,
  Heading,
  Text,
  Image,
  Badge,
  ButtonGroup,
  Button,
  Menu,
  MenuList,
  MenuButton,
  MenuItem,
  IconButton,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  Link,
  Flex,
  Tag,
  Wrap,
  WrapItem,
  Skeleton,
  SkeletonCircle,
  useMediaQuery,
  useDisclosure,
  Show,
  Hide
} from '@chakra-ui/react';
import { FaXTwitter } from "react-icons/fa6";
import { FiArchive, FiExternalLink, FiMap, FiMoreVertical } from "react-icons/fi";
import { ChevronDownIcon, ChevronRightIcon } from '@chakra-ui/icons';
import {
  Hash,
  GeoAlt,
  Person,
  People,
  Tags,
  ChevronRight,
  ExclamationTriangleFill,
} from '@chakra-icons/bootstrap';
import { formatEventDateKey, getEventAnchorId } from '../utils/eventAnchors';
import { EVENT_CARD_HIGHLIGHT_EVENT } from '../utils/hashScroll';
import { ShareIconRow, ShareButton } from './ShareButtons';
import { subscribeNow, getNow } from '../utils/nowTicker';
import { isEventNew } from '../utils/newEventTracking';
import { subscribeTrackingData, getTrackingDataSnapshot } from '../utils/newEventTrackingStore';
import { SummarizerUnavailableError, streamEventDescriptionSummary } from '../utils/summarizer';
import { fetchEventDescription } from '../utils/api';
import type { EventWithGroup } from '../types/events';

type EventBodyProps = {
  event: EventWithGroup;
  anchorId?: string;
  selectedKeyword?: string | null;
  onKeywordClick?: (keyword: string) => void;
  enableSummarizer?: boolean;
};

function buildJstDayScopedSearchPrefix(start_date: Date): string {
  const jst_date_formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const jst_date_parts = jst_date_formatter.formatToParts(start_date);
  const jst_date_part = (type: string) => jst_date_parts.find((part) => part.type === type)?.value;
  const start_date_str = `${jst_date_part('year')}-${jst_date_part('month')}-${jst_date_part('day')}`;
  const since_time = Math.floor(new Date(start_date_str + "T00:00:00+09:00").getTime() / 1000);
  const until_time = Math.floor(new Date(start_date_str + "T23:59:59+09:00").getTime() / 1000);
  return "since_time:" + since_time + " until_time:" + until_time + " ";
}

export function EventBody(data: EventBodyProps) {

  const day_of_week = ['日', '月', '火', '水', '木', '金', '土'];
  const event = data.event;
  const now = useSyncExternalStore(subscribeNow, getNow);
  const trackingData = useSyncExternalStore(subscribeTrackingData, getTrackingDataSnapshot);
  const now_year = now.getFullYear();
  const start_date = new Date(event.started_at);
  const end_date = new Date(event.ended_at);
  const start_year = start_date.getFullYear();
  const start_month = start_date.getMonth() + 1;
  const start_day = start_date.getDate();
  const start_dow = day_of_week[start_date.getDay()];
  const start_time = start_date.getHours() + ':' + ('0' + start_date.getMinutes()).slice(-2);
  const is_today = formatEventDateKey(start_date) === formatEventDateKey(now);
  const has_ended = now.getTime() > end_date.getTime();
  const is_ongoing = now.getTime() >= start_date.getTime() && !has_ended;
  const is_new = isEventNew(trackingData, event, now);

  const title = event.title;
  const sub_title = event.catch;
  const hash_tag = event.hash_tag;
  const hash_tag_url = hash_tag ? "https://x.com/hashtag/" + encodeURIComponent(hash_tag) : "";
  const address = event.address;
  const place = event.place;
  const event_url = event.event_url;
  const owner_name = event.owner_name;
  const group_name = event.group_name;
  const group_url = event.group_url;
  const group_image_url = event.group_image_url;
  const archive_source = event.archive_source;
  const archive_url = event.archive_url;
  const keywords = event.keywords ?? [];
  const x_search_keywords_array = [];
  if (hash_tag) {
    x_search_keywords_array.push("#" + hash_tag);
  }
  x_search_keywords_array.push("\"" + title + "\"");
  if (group_name) {
    x_search_keywords_array.push("\"" + group_name+ "\"");
  }
  const x_search_since_until = has_ended ? buildJstDayScopedSearchPrefix(start_date) : "";
  const x_search_query = x_search_since_until + x_search_keywords_array.join(" OR ");
  const event_x_search_url = "https://x.com/search?q=" + encodeURIComponent(x_search_query) + "&f=live";
  const x_search_label = has_ended
    ? "イベント当日の X(Twitter) 投稿を検索"
    : "イベントに関する X(Twitter) 投稿を検索";

  const address_array = [address, place].filter(Boolean);

  const event_map_url = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(address_array[0] || '');

  const [isDesktopScreenSize] = useMediaQuery("(min-width: 768px)");

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

  const [isLongPress, setIsLongPress] = useState(false);
  const [pressTimer, setPressTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [touchStartPos, setTouchStartPos] = useState<{ x: number; y: number } | null>(null);
  const [moved, setMoved] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [summaryStatus, setSummaryStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [summaryText, setSummaryText] = useState('');
  const [summaryError, setSummaryError] = useState('');
  const isSummaryExpanded = summaryStatus !== 'idle';
  
  const handleMenuButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onOpen();
  };
  const handleMenuButtonTouch = (e: React.TouchEvent) => {
    e.stopPropagation();
  };
  const stopCardNavigation = (e: React.SyntheticEvent) => {
    e.stopPropagation();
  };

  const handleSummaryButtonClick = async (e: React.MouseEvent) => {
    stopCardNavigation(e);
    if (summaryStatus === 'loading') {
      return;
    }

    setSummaryStatus('loading');
    setSummaryText('');
    setSummaryError('');

    try {
      const description = (await fetchEventDescription(event.uid)).trim();
      if (!description) {
        setSummaryError('要約できる説明文がありません');
        setSummaryStatus('error');
        return;
      }

      await streamEventDescriptionSummary(description, title, (chunk) => {
        setSummaryText((current) => current + chunk);
      });
      setSummaryStatus('done');
    } catch (error) {
      setSummaryError(error instanceof SummarizerUnavailableError
        ? error.message
        : '要約の生成に失敗しました');
      setSummaryStatus('error');
    }
  };

  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollTimer, setScrollTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let lastScrollY = window.scrollY;
    
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (Math.abs(currentScrollY - lastScrollY) > 5) {
        setIsScrolling(true);
        
        if (scrollTimer) {
          clearTimeout(scrollTimer);
        }
        
        const timer = setTimeout(() => {
          setIsScrolling(false);
        }, 150); // judge scrolling stopped after 150ms of no scroll events
        
        setScrollTimer(timer);
      }
      
      lastScrollY = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimer) {
        clearTimeout(scrollTimer);
      }
    };
  }, [scrollTimer]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isScrolling) {
      return;
    }
    
    const touch = e.touches[0];
    setTouchStartPos({ x: touch.clientX, y: touch.clientY });
    setMoved(false);

    const timer = setTimeout(() => {
      if (!moved && !isScrolling) {
        setIsLongPress(true);
        onOpen();
      }
    }, 600);
    setPressTimer(timer);
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartPos || isScrolling) return;
    
    const touch = e.touches[0];
    const dx = Math.abs(touch.clientX - touchStartPos.x);
    const dy = Math.abs(touch.clientY - touchStartPos.y);
    
    if (dx > 8 || dy > 8) {
      setMoved(true);
      if (pressTimer) {
        clearTimeout(pressTimer);
        setPressTimer(null);
      }
    }
  };
  const handleTouchEnd = () => {
    if (pressTimer) {
      clearTimeout(pressTimer);
      setPressTimer(null);
    }
    
    if (!isScrolling && !isLongPress && !moved && touchStartPos) {
      window.open(event_url, '_self');
    }
    resetState();
  };
  const resetState = () => {
    setIsLongPress(false);
    setMoved(false);
    setTouchStartPos(null);
    if (pressTimer) {
      clearTimeout(pressTimer);
      setPressTimer(null);
    }
  }

  useEffect(() => {
    if (!isOpen) {
      resetState();
    }
  }, [isOpen]);

  return (
    <>
      <HStack ref={cardRef}
              p={'2'} position={'relative'}
              id={data.anchorId}
              data-event-card
              data-event-date={formatEventDateKey(start_date).replace(/-/g, '')}
              className={isHighlighted ? 'event-card-highlight' : undefined}
              scrollMarginTop={{base: '4.5rem', md: '5.5rem'}}
              {...(!isDesktopScreenSize && {
                onTouchStart: handleTouchStart,
                onTouchMove: handleTouchMove,
                onTouchEnd: handleTouchEnd,
                userSelect: 'none',
                WebkitUserSelect: 'none',
                _active: {bg: 'gray.100'},
              })}>
        {/* 日付単位のanchorIdは同日2件目以降には付かないため、それとは
            独立してイベント単位で常に存在するジャンプ先を用意する。 */}
        <Box id={getEventAnchorId(event.uid)}
             position={'absolute'}
             top={'0'} left={'0'}
             w={'0'} h={'0'}
             overflow={'hidden'}
             scrollMarginTop={{base: '4.5rem', md: '5.5rem'}}
             aria-hidden
             />
        <Flex w={'100%'}
              ml={{base: '2', md: '0'}}
              flexDirection={{base: 'column', md: 'row'}}
              alignItems={{base: 'flex-start', md: 'stretch'}}
              >
          <Stack w={{base: '100%', md: '25%'}}
                direction={{base: 'row', md: 'column'}}
                spacing={'0'}
                alignItems={{base: 'baseline', md: 'center'}}
                mb={{base: '1', md: '0'}}
                color={'gray.600'}
                >
            { now_year !== start_year && (
              <HStack spacing={'0'}
                      justifyContent={{base: 'flex-start', md: 'center'}}
                      >
                <Text fontSize={'sm'}
                      fontWeight={'light'}
                      letterSpacing={{md: '0.1rem'}}
                      mr={{base: '1', md: '0'}}
                      >{ start_year }</Text>
              </HStack>
            )}
            <HStack spacing={'0'}
                    justifyContent={{base: 'flex-start', md: 'center'}}
                    mt={{base: '0', md: '-0.5rem', lg: '-0.8rem'}}
                    >
              <Text fontSize={{base: '2xl', md: '4xl', lg: '5xl'}}
                    fontWeight={'bold'}
                    letterSpacing={{md: '0.1rem'}}
                    >{ start_month }</Text>
              <Text fontSize={{base: '2xl', md: '4xl', lg: '5xl'}}
                    fontWeight={'light'}
                    letterSpacing={{md: '0.1rem'}}
                    >
                /{ start_day }</Text>
            </HStack>
            <Text fontSize={'lg'}
                  mt={{md: '-0.5rem'}}
                  >
              ({ start_dow }) { start_time }-
            </Text>
            {(is_today || is_ongoing) && !has_ended ? (
              <Badge bg={'#f9f1e8'}
                     color={'impact.700'}
                     border={'1px solid'}
                     borderColor={'impact.500'}
                     fontSize={'xs'}
                     fontWeight={'bold'}
                     ml={{base: '2', md: '0'}}
                     mt={{base: '0', md: '1'}}
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
                     ml={{base: '2', md: '0'}}
                     mt={{base: '0', md: '1'}}
                     >
                NEW
              </Badge>
            ) : null}
            <Show above='md'>
              <ShareIconRow event={event} />
            </Show>
          </Stack>
          <Show above='md'>
            <Stack spacing={'2px'} direction={'row'} mr={'4'}>
              <Box w={'1px'} bg={'impact.500'} />
              <Box w={'1px'} bg={'secondary.500'} />
              <Box w={'1px'} bg={'primary.500'} />
            </Stack>
          </Show>
          <Box w={'100%'} minH={{md: '120px'}}>
            <Heading fontSize={{base: 'md', lg: 'lg'}}
                    color={'primary.800'}
                    pr={{
                      base: group_image_url ? '60px' : '0px',
                      md: '140px'
                    }}
                    letterSpacing={{base: '0', md: '0.05rem'}}
                    >
              <Show above='md'><Link href={event_url} isExternal>{ title }</Link></Show>
              <Hide above='md'>{ title }</Hide>
            </Heading>
            <Text fontSize={'sm'}
                  pr={{
                    base: group_image_url ? '60px' : '0px',
                    md: '140px'
                  }}
                  >{ sub_title }</Text>
            {data.enableSummarizer && (
              <Stack mt={'2'} pr={{md: '140px'}} spacing={'2'} alignItems={'flex-start'}>
                <Button size={'sm'}
                        variant={'ghost'}
                        color={'gray.600'}
                        fontWeight={'normal'}
                        leftIcon={isSummaryExpanded ? <ChevronDownIcon /> : <ChevronRightIcon />}
                        px={'1'}
                        h={'auto'}
                        minH={'1.5rem'}
                        _hover={{ bg: 'blackAlpha.50', color: 'gray.700' }}
                        _active={{ bg: 'blackAlpha.100' }}
                        onClick={handleSummaryButtonClick}
                        onTouchStart={stopCardNavigation}
                        onTouchMove={stopCardNavigation}
                        onTouchEnd={stopCardNavigation}
                        >
                  どんなイベント？
                </Button>
                {isSummaryExpanded && (
                  <Box bg={'white'}
                       border={'1px solid'}
                       borderColor={'gray.200'}
                       borderRadius={'md'}
                       p={'3'}
                       w={'100%'}
                       aria-live={'polite'}
                       >
                    {summaryText ? (
                      <Text fontSize={'sm'} whiteSpace={'pre-wrap'}>{summaryText}</Text>
                    ) : summaryStatus === 'error' ? (
                      <Text fontSize={'sm'} color={'impact.600'}>{summaryError}</Text>
                    ) : (
                      <Text fontSize={'sm'} color={'gray.500'}>確認中...</Text>
                    )}
                  </Box>
                )}
              </Stack>
            )}
            {archive_source && (
              <Badge colorScheme="secondary" variant="subtle"
                     display={'block'} w={'fit-content'}
                     >
                アーカイブ
              </Badge>
            )}
            <HStack mt={'2'} pr={{md: '140px'}}>
              <Stack p={{base: '2', md: '2'}} spacing={{base: '0', md: '0.5rem'}}>
                {keywords.length > 0 && (
                  <HStack alignItems={'flex-start'} color={'gray.500'}>
                    <Tags mt={'3px'} />
                    <Wrap spacing={'1'}>
                      {keywords.map((keyword) => (
                        <WrapItem key={keyword}>
                          <Tag size={'sm'}
                               fontSize={'xs'}
                               fontWeight={'normal'}
                               bg={data.selectedKeyword === keyword ? 'gray.500' : 'blackAlpha.100'}
                               color={data.selectedKeyword === keyword ? 'white' : 'gray.500'}
                               {...(isDesktopScreenSize && data.onKeywordClick && {
                                 as: 'button' as const,
                                 cursor: 'pointer',
                                 onClick: () => data.onKeywordClick?.(keyword),
                               })}
                               >
                            {keyword}
                          </Tag>
                        </WrapItem>
                      ))}
                    </Wrap>
                  </HStack>
                )}
                {hash_tag && (
                  <HStack>
                    <Hash />
                    <Show above='md'><Text fontSize={'sm'} noOfLines={1}><Link href={hash_tag_url} isExternal>{ hash_tag }</Link></Text></Show>
                    <Hide above='md'><Text fontSize={'sm'} noOfLines={1}>{ hash_tag }</Text></Hide>
                  </HStack>
                )}
                {address_array.length > 0 && (
                  <HStack>
                    <GeoAlt />
                    <Show above='md'><Text fontSize={'sm'} noOfLines={1}><Link href={event_map_url} isExternal>{ address_array[0] }</Link></Text></Show>
                    <Hide above='md'><Text fontSize={'sm'} noOfLines={1}>{ address_array[0] }</Text></Hide>
                  </HStack>
                )}
                {address_array.length > 1 && (
                  <HStack ml={'24px'} mt={{base: '0', md: '-0.5rem'}}>
                    <Text fontSize={'sm'} noOfLines={1}>{ address_array[1] }</Text>
                  </HStack>
                )}
                {group_name && (
                  <HStack>
                    <People />
                    <Show above='md'>
                      {group_url ? (
                        <Button size={'xs'}
                                onClick={() => window.open(group_url)}
                                >{group_name}</Button>
                      ) : (
                        <Text fontSize={'sm'} noOfLines={1}>{group_name}</Text>
                      )}
                    </Show>
                    <Hide above='md'>
                      <Text fontSize={'sm'}
                            noOfLines={1}
                            >{group_name}</Text>
                    </Hide>
                  </HStack>
                )}
                {group_name == null && owner_name && (
                  <HStack>
                    <Person />
                      <Text fontSize={'sm'} noOfLines={1}>{owner_name}</Text>
                  </HStack>
                )}
              </Stack>
            </HStack>
            <Hide above='md'>
              <IconButton aria-label='More options'
                          icon={<FiMoreVertical />}
                          size='sm'
                          variant='ghost'
                          position='absolute'
                          top='0'
                          right='0'
                          onClick={handleMenuButtonClick}
                          onTouchStart={handleMenuButtonTouch}
                          onTouchMove={handleMenuButtonTouch}
                          onTouchEnd={handleMenuButtonTouch}
                          zIndex={1}
                          />
            </Hide>

            {group_image_url && (
              <Image src={ group_image_url }
                    w={'80px'}
                    h={'54px'}
                    fit={'contain'}
                    position={'absolute'}
                    top={{base: '4', md: '2'}}
                    right={{base: '4', md: '4'}}
                    />
            )}
            <Show above='md'>
              <ButtonGroup isAttached
                          size={'md'}
                          colorScheme={'impact'}
                          position={'absolute'}
                          bottom={'2'}
                          right={'4'}
                          >
                <Button w={'100px'} onClick={() => window.open(event_url)}>
                  <HStack>
                    <Text letterSpacing={'0.2rem'}>詳細</Text>
                  </HStack>
                </Button>
                <Box h="full" w="1px" />
                <Menu placement="bottom-end" isLazy>
                  {({ isOpen: isMenuOpen }) => (
                    <>
                      <MenuButton as={IconButton}
                                  aria-label='Options'
                                  icon={<ChevronDownIcon />}
                                  />
                      <MenuList fontSize={'sm'} display={isMenuOpen ? 'block' : 'none'}>
                        <MenuItem icon={<FiExternalLink />}
                                  onClick={() => window.open(event_url)}
                                  >
                          情報提供元のページを開く
                        </MenuItem>
                        <MenuItem icon={<FaXTwitter />}
                                  onClick={() => window.open(event_x_search_url)}
                                  >
                          { x_search_label }
                        </MenuItem>
                        {archive_url && (
                          <MenuItem icon={<FiArchive />}
                                    onClick={() => window.open(archive_url)}
                                    >
                            アーカイブ元を開く
                          </MenuItem>
                        )}
                      </MenuList>
                    </>
                  )}
                </Menu>
              </ButtonGroup>
            </Show>
          </Box>
        </Flex>
        <Spacer />
        <Hide above='md'><ChevronRight /></Hide>
      </HStack>

      <Drawer placement="bottom"
              isOpen={isOpen}
              onClose={() => {
                resetState();
                onClose();
              }}
              >
        <DrawerOverlay />
        <DrawerContent pb={6}
                       borderTopRadius="xl"
                       animation="slide-up"
                       >
          <DrawerHeader textAlign="center"
                        borderBottomWidth="1px"
                        >
            { title }
          </DrawerHeader>
          <DrawerBody>
            <VStack spacing={2}>
              <Button w="full"
                      leftIcon={<FiExternalLink />}
                      onClick={() => {
                        window.open(event.event_url);
                        onClose();
                      }}
                      >
                情報提供元のページを開く
              </Button>
              {address_array.length > 0 && (
                <Button w="full"
                        leftIcon={<FiMap />}
                        onClick={() => {
                          window.open(event_map_url);
                          onClose();
                        }}
                        >
                  マップで会場を見る
                </Button>
              )}
              <Button w="full"
                      leftIcon={<FaXTwitter />}
                      onClick={() => {
                        window.open(event_x_search_url);
                        onClose();
                      }}
                      >
                { x_search_label }
              </Button>
              {archive_url && (
                <Button w="full"
                        leftIcon={<FiArchive />}
                        onClick={() => {
                          window.open(archive_url);
                          onClose();
                        }}
                        >
                  アーカイブ元を開く
                </Button>
              )}
              <ShareButton event={event} onAfterAction={onClose} />
              <Button w="full"
                      colorScheme="red"
                      onClick={onClose}
                      >
                キャンセル
              </Button>
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  )
}

export function SkeletonEventBody() {

  return (
    <HStack p={{base: '4', md: '2'}}>
      <Flex w={'100%'}
          flexDirection={{base: 'column', md: 'row'}}
          alignItems={{base: 'flex-start', md: 'stretch'}}
          >
        <Stack w={{base: '100%', md: '180px'}}
              direction={{base: 'row', md: 'column'}}
              alignItems={{base: 'baseline', md: 'center'}}
              mb={'0.5rem'}
              >
          <Skeleton height={{base: '1.2rem', md: '2rem'}}
                    width={{base: '4rem', md: '5rem'}}
                    />
          <Skeleton height={{base: '0.875rem', md: '1.2rem'}}
                    width={{base: '3rem', md: '6rem'}}
                    />
        </Stack>
        <Show above='md'>
          <Stack spacing={'2px'} direction={'row'} mr={'4'}>
            <Box w={'1px'} bg={'gray.200'} />
            <Box w={'1px'} bg={'gray.200'} />
            <Box w={'1px'} bg={'gray.200'} />
          </Stack>
        </Show>
        <Box w={'100%'}>
          <Skeleton height={{base: '0.875rem', md: '1rem'}}
                    width={{base: '12rem', md: '12rem'}}
                    />
          <HStack mt={'2'}>
            <Stack p={'2'} spacing={{base: '0.2rem', md: '0.5rem'}}>
              <HStack>
                <SkeletonCircle size={'1rem'} />
                <Skeleton height={'0.875rem'} width={'6rem'} />
              </HStack>
              <HStack>
                <SkeletonCircle size={'1rem'} />
                <Skeleton height={'0.875rem'} width={'4rem'} />
              </HStack>
            </Stack>
          </HStack>
        </Box>
      </Flex>
    </HStack>
  )
}

export function EmptyEventBody() {

  return (
    <Box p={{base: '4', md: '2'}}>
      <Text fontSize={'sm'}>イベントはありません</Text>
    </Box>
  )
}

export function ErrorEventBody(prop: any) {

  const message = prop.message;

  return (
    <Stack direction={'row'} p={{base: '4', md: '2'}} spacing={'4'} color={'impact.500'}>
      <ExclamationTriangleFill boxSize={'2rem'} />
      <Stack>
        <Text fontSize={'sm'} fontWeight={'bold'}>イベント情報の取得に失敗しました</Text>
        {message && (
          <Text fontSize={'sm'}>{ message }</Text>
        )}
      </Stack>
    </Stack>
  )
}
