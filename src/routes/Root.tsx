import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SiteHeader, SiteFooter, SelectYearButtons, FooterLastModified, useFixedHeaderBoundary, STICKY_HEADING_TOP } from '../components/Site';
import { YearSwitcher, FUTURE_EVENTS_ANCHOR_ID } from '../components/YearSwitcher';
import { SkeletonEventBody, EmptyEventBody, ErrorEventBody } from '../components/EventBody';
import { EventFilterTabs } from '../components/EventFilterTabs';
import { ActiveFilterBadge } from '../components/ActiveFilterBadge';
import { GroupMoreEventsLink } from '../components/GroupMoreEventsLink';
import { EventListView, type EventListItem } from '../components/EventListView';
import { ViewModeToggle } from '../components/ViewModeToggle';
import { EVENT_LIST_SPACING } from '../components/AnimatedEventItem';
import { EventScrollGutter } from '../components/EventScrollGutter';
import { StructuredData } from '../components/StructuredData';
import '../style.css';
import eyecatch from "../assets/images/eyecatch.png"
import root_bg from "../assets/images/root_bg.png";
import root_top_bg from "../assets/images/root_top_bg.png";
import { useSyncExternalStore } from 'react';
import {
  Container,
  Box,
  Stack,
  HStack,
  Card,
  CardBody,
  Heading,
  Text,
  Image,
  Link,
  Button,
  Spacer,
} from '@chakra-ui/react';
import { ExternalLinkIcon, InfoOutlineIcon } from "@chakra-ui/icons";
import { sortByStartedAtAsc, sortByStartedAtDesc } from '../utils/eventSort';
import { enrichEventsWithGroups, isFutureEvent, isPastEvent, countGroups, filterEventsByGroup } from '../utils/eventGroups';
import { countKeywords, filterEventsByKeyword } from '../utils/eventKeywords';
import { countAreas, filterEventsByArea, AREA_LABELS, type AreaKey } from '../utils/eventAreas';
import { fetchEvents, fetchGroups } from '../utils/api';
import { formatEventDateKey, getEventDateAnchorId } from '../utils/eventAnchors';
import { scrollToCurrentHash } from '../utils/hashScroll';
import { buildEventListJsonLd } from '../utils/structuredData';
import { SITE_URL } from '../utils/site';
import { subscribeViewMode, getViewModeSnapshot } from '../utils/viewModeStore';
import type { ApiGroup, EventWithGroup } from '../types/events';

// 星空レイヤーを上へはみ出させる量(px)。下へ追随したときに生じる領域を
// タイル上端と同色の塗り足しで埋める。ヒーロー上端のページ内オフセット
// (≒ヘッダー高 71px)より大きい値にすること。
const STARFIELD_BLEED = 120;
// 星空タイル(root_top_bg.png)は幅:高さ = 1:2 なので、帯の高さは
// bgSize で指定する幅の2倍になる。
const STARFIELD_HEIGHT = 200;

// コミュニティの並び順は、「直近開催イベント」にイベントがあるコミュニティを
// 直近の開催日時が近い順に並べ、続けて「終了したイベント」にしかイベントが
// ないコミュニティを直近の開催日時が新しい順に並べる。
function orderGroupsForRoot(
  futureGroups: ReturnType<typeof countGroups>,
  pastGroups: ReturnType<typeof countGroups>,
) {
  const pastByKey = new Map(pastGroups.map((group) => [group.key, group]));
  const withFuture = futureGroups
    .map((group) => ({
      key: group.key,
      name: group.name,
      imageUrl: group.imageUrl,
      events: [...group.events, ...(pastByKey.get(group.key)?.events ?? [])],
      sortTime: Math.min(...group.events.map((event) => new Date(event.started_at).getTime())),
    }))
    .sort((a, b) => a.sortTime - b.sortTime);

  const futureKeys = new Set(futureGroups.map((group) => group.key));
  const withoutFuture = pastGroups
    .filter((group) => !futureKeys.has(group.key))
    .map((group) => ({
      key: group.key,
      name: group.name,
      imageUrl: group.imageUrl,
      events: group.events,
      sortTime: Math.max(...group.events.map((event) => new Date(event.started_at).getTime())),
    }))
    .sort((a, b) => b.sortTime - a.sortTime);

  return [...withFuture, ...withoutFuture];
}

type RootState = {
  isLoading: boolean;
  pastEvents: EventWithGroup[];
  futureEvents: EventWithGroup[];
  groups: ApiGroup[];
  lastModified: string | null;
  errorMessage: string;
};

function Root({startYear}: {startYear: number}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedGroup = searchParams.get('group');
  // keyword と group と area は排他。手入力やブックマークなど、複数の
  // クエリが同時に付いた URL が渡された場合は group > keyword > area の
  // 優先順で扱う。
  const selectedKeyword = selectedGroup ? null : searchParams.get('keyword');
  const selectedArea = (selectedGroup || selectedKeyword) ? null : (searchParams.get('area') as AreaKey | null);
  const [data, setData] = useState<RootState>({
    isLoading: true,
    pastEvents: [],
    futureEvents: [],
    groups: [],
    lastModified: null,
    errorMessage: ''
  });

  const headerBoundaryRef = useFixedHeaderBoundary<HTMLDivElement>();

  document.title = `Yamanashi Developer Hub - 山梨のIT勉強会イベント情報ポータルサイト`;

  useEffect(() => {
    const group = searchParams.get('group');
    const keyword = searchParams.get('keyword');
    const area = searchParams.get('area');
    if ([group, keyword, area].filter(Boolean).length > 1) {
      setSearchParams(group ? { group } : keyword ? { keyword } : { area: area! }, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    const getData = async () => {
      let eventsResponse = null;
      let groups = null;
      try {
        eventsResponse = await fetchEvents();
        groups = await fetchGroups();
      }
      catch (err: any) {
        const data = {
          isLoading: false,
          pastEvents: [],
          futureEvents: [],
          groups: [],
          lastModified: null,
          errorMessage: err.message
        }
        setData(data);
        return;
      }

      const events = enrichEventsWithGroups(
        eventsResponse.events,
        groups,
      );
      const data = {
        isLoading: false,
        pastEvents: events.filter(isPastEvent).sort(sortByStartedAtDesc),
        futureEvents: events.filter(isFutureEvent).sort(sortByStartedAtAsc),
        groups,
        lastModified: eventsResponse.lastModified,
        errorMessage: ''
      }
      setData(data);
    }
    getData();
  }, []);

  useEffect(() => {
    if (data.isLoading || data.errorMessage) {
      return;
    }

    window.requestAnimationFrame(scrollToCurrentHash);
  }, [data.errorMessage, data.isLoading, data.futureEvents, data.pastEvents]);

  const handleKeywordSelect = (keyword: string | null) => {
    window.dispatchEvent(new Event('site-header-hold'));
    setSearchParams(keyword ? { keyword } : {}, { replace: true });
  };
  const handleKeywordClick = (keyword: string) => {
    handleKeywordSelect(selectedKeyword === keyword ? null : keyword);
  };

  const handleGroupSelect = (group: string | null) => {
    window.dispatchEvent(new Event('site-header-hold'));
    setSearchParams(group ? { group } : {}, { replace: true });
  };

  const handleAreaSelect = (area: string | null) => {
    window.dispatchEvent(new Event('site-header-hold'));
    setSearchParams(area ? { area } : {}, { replace: true });
  };

  const keywordCounts = countKeywords([...data.futureEvents, ...data.pastEvents]);
  const areaCounts = countAreas([...data.futureEvents, ...data.pastEvents]);
  const groupSelectorItems = orderGroupsForRoot(
    countGroups(data.futureEvents, data.groups),
    countGroups(data.pastEvents, data.groups),
  );
  const selectedGroupDetail = selectedGroup
    ? data.groups.find((group) => group.key === selectedGroup)
    : null;
  const selectedGroupName = selectedGroup ? (selectedGroupDetail?.title ?? selectedGroup) : null;
  const selectedAreaName = selectedArea ? (AREA_LABELS[selectedArea] ?? selectedArea) : null;
  const futureEvents = filterEventsByArea(filterEventsByGroup(filterEventsByKeyword(data.futureEvents, selectedKeyword), selectedGroup), selectedArea);
  const pastEvents = filterEventsByArea(filterEventsByGroup(filterEventsByKeyword(data.pastEvents, selectedKeyword), selectedGroup), selectedArea);

  const buildEventListItems = (events: EventWithGroup[], anchoredDateKeys: Set<string>): EventListItem[] => {
    return events.map((event, index) => {
      const eventDateKey = formatEventDateKey(new Date(event.started_at));
      const previousEvent = events[index - 1];
      const previousEventDateKey = previousEvent
        ? formatEventDateKey(new Date(previousEvent.started_at))
        : null;
      const shouldAttachAnchor = eventDateKey !== previousEventDateKey
        && !anchoredDateKeys.has(eventDateKey);
      const anchorId = shouldAttachAnchor
        ? getEventDateAnchorId(eventDateKey)
        : undefined;

      if (shouldAttachAnchor) {
        anchoredDateKeys.add(eventDateKey);
      }

      return { event, anchorId };
    });
  };

  const anchoredDateKeys = new Set<string>();
  const viewMode = useSyncExternalStore(subscribeViewMode, getViewModeSnapshot);

  const structuredData = !data.isLoading && !data.errorMessage
    ? buildEventListJsonLd([...futureEvents, ...pastEvents], `${SITE_URL}/`)
    : null;

  return (
    <Box className={'section-bg-pattern'} w={'100vw'} minH={'100vh'}>
      <StructuredData id={'structured-data-events'} data={structuredData} />
      <SiteHeader />
      <EventScrollGutter />
      <Box bg={'#fffafa'}
           p={0}
           position={'relative'}
           overflow={'hidden'}
           >
        {/* 星空レイヤー。視差は style.css の .starfield-parallax が適用し、
            非対応ブラウザでは静的表示になる。塗り足しの #faf0e6 はタイル
            上端と、親背景の #fffafa はタイル下端と同色のため継ぎ目が出ない。 */}
        <Box aria-hidden={true}
             className={'starfield-parallax'}
             position={'absolute'}
             top={`-${STARFIELD_BLEED}px`}
             left={0}
             right={0}
             h={`${STARFIELD_BLEED + STARFIELD_HEIGHT}px`}
             bgColor={'#faf0e6'}
             bgImg={root_top_bg}
             bgPos={'bottom'}
             bgRepeat={'repeat-x'}
             bgSize={'100px'}
             pointerEvents={'none'}
             />
        {/* position: relative で星空レイヤーより手前に重ねる */}
        <Box p={0}
            position={'relative'}
            bgImg={root_bg}
            bgPos={'50% bottom'}
            bgRepeat={'no-repeat'}
            bgSize={{base: '200%', md: '960px'}}
            >
          <Container maxW={'860px'}
                    p={{base: '10', md: '4'}}
                    w={'100%'}
                    h={{md: '380px'}}
                    display={'flex'}
                    alignItems={'center'}
                    position={'relative'}
                    flexDirection={{base: 'column', md: 'row'}}
                    >
            <Image src={eyecatch}
                  boxSize={{base: '80%', md: '320px'}}
                  alt='Yamanashi Developer Hub'
                  position={{md: 'absolute'}}
                  right={{md: '0'}}
                  p={{base: '0', md: '4'}}
                  />
            <Stack pr={{md: '320px'}}>
              <Heading size={{base: 'lg', md: 'xl'}} mb={'4'} textAlign={{base: 'center', md: 'left'}}>
                <Text as={'span'}
                      fontWeight={'100'}
                      whiteSpace={'nowrap'}
                      display={'inline'}
                      color={'impact.500'}
                      >Meet </Text>
                <Text as={'span'}
                      fontWeight={'100'}
                      whiteSpace={'nowrap'}
                      display={'inline'}
                      color={'secondary.700'}
                      >the Engineer </Text>
                <Text as={'span'}
                      fontWeight={'100'}
                      whiteSpace={'nowrap'}
                      display={{ base: 'inline', md: 'block' }}
                      color={'primary.600'}
                      >in Yamanashi</Text>
              </Heading>
              <Text fontSize={{base: 'sm', md: 'md'}}>
                Yamanashi Developer Hub は、山梨県内で開催されるIT勉強会の情報をまとめたサイトです。
              </Text>
              <Text fontSize={{base: 'sm', md: 'md'}}>
                イベント情報は、
                <Link color={'primary.800'} href='https://connpass.com' isExternal>
                  connpass<ExternalLinkIcon mx={'2px'} />
                </Link>
                、コミュニティが提供するイベントカレンダー、過去イベントアーカイブから取得しています。
              </Text>
              <Stack pt={'2'}
                     direction={{base: 'column', sm: 'row'}}
                     spacing={'3'}
                     >
                <Button size={'sm'}
                        colorScheme={'secondary'}
                        bg={'secondary.700'}
                        color={'white'}
                        _hover={{ bg: 'secondary.800' }}
                        _active={{ bg: 'secondary.900' }}
                        leftIcon={<InfoOutlineIcon />}
                        onClick={() => { window.open('/guide', '_self') }}
                        >
                  はじめての方へ
                </Button>
                <Button size={'sm'}
                        variant={'outline'}
                        colorScheme={'impact'}
                        onClick={() => { window.open('/groups', '_self') }}
                        >
                  コミュニティ一覧
                </Button>
                <Button size={'sm'}
                        variant={'outline'}
                        colorScheme={'primary'}
                        onClick={() => { window.open('/events', '_self') }}
                        >
                  イベントアーカイブ
                </Button>
              </Stack>
            </Stack>
          </Container>
        </Box>
      </Box>
      <Container maxW={'980px'} w={'100%'}
                 p={{base: '0', md: '4'}}
                 pt={{base: '6', md: '6'}}
                 >
        <Stack>
          <EventFilterTabs selectedGroup={selectedGroup}
                           selectedKeyword={selectedKeyword}
                           selectedArea={selectedArea}
                           onGroupSelect={handleGroupSelect}
                           onKeywordSelect={handleKeywordSelect}
                           onAreaSelect={handleAreaSelect}
                           groupSelectorItems={groupSelectorItems}
                           keywordCounts={keywordCounts}
                           areaCounts={areaCounts}
                           isLoading={data.isLoading}
                           errorMessage={data.errorMessage}
                           showGroupBadges
                           />
          <HStack justifyContent={'flex-end'} px={{base: '4', md: '0'}}>
            <ViewModeToggle />
          </HStack>
          {/* sticky 化した見出しは座標が動かず境界にできないため、目印として使う */}
          <Box ref={headerBoundaryRef} />
          <Stack>
            <Stack id={FUTURE_EVENTS_ANCHOR_ID}
                   direction={'row'} spacing={'2'}
                   position={'sticky'}
                   top={STICKY_HEADING_TOP}
                   zIndex={'docked'}
                   bg={'gray.100'}
                   px={{base: '4', md: '0'}}
                   mt={'8'}
                   py={'2'}
                   scrollMarginTop={{base: '4.5rem', md: '5.5rem'}}
                   display={'flex'} alignItems={'center'}
                   minH={'2.75rem'}
                   >
              <Heading size={{base: 'sm', md: 'md'}}
                       color={'gray.600'}
                       flexShrink={0}
                       >
                直近開催イベント
              </Heading>
              <ActiveFilterBadge selectedKeyword={selectedKeyword}
                                 selectedGroupName={selectedGroupName}
                                 selectedAreaName={selectedAreaName}
                                 onClearKeyword={() => handleKeywordSelect(null)}
                                 onClearGroup={() => handleGroupSelect(null)}
                                 onClearArea={() => handleAreaSelect(null)}
                                 />
              <Spacer />
              <YearSwitcher startYear={startYear} selectedYear={null} showChevrons={false} />
            </Stack>
            <Card variant={{base: 'unstyled', md: 'outline'}}
                  size={{base: 'sm', md: 'md'}}
                  p={'0'}
                  >
              <CardBody>
                {data.isLoading ? (
                  <SkeletonEventBody />
                ) : data.errorMessage ? (
                  <ErrorEventBody message={ data.errorMessage } />
                ) : futureEvents.length === 0 ? (
                  <EmptyEventBody />
                ) : (
                  <EventListView items={buildEventListItems(futureEvents, anchoredDateKeys)}
                                 viewMode={viewMode}
                                 section={'future'}
                                 selectedKeyword={selectedKeyword}
                                 onKeywordClick={handleKeywordClick}
                                 enableSummarizer
                                 />
                )}
              </CardBody>
            </Card>
            {data.lastModified &&
              <FooterLastModified lastModified={ data.lastModified } />
            }
          </Stack>

          <Stack>
            <Stack direction={'row'} spacing={'2'}
                   position={'sticky'}
                   top={STICKY_HEADING_TOP}
                   zIndex={'docked'}
                   bg={'gray.100'}
                   px={{base: '4', md: '0'}}
                   mt={'8'}
                   py={'2'}
                   display={'flex'} alignItems={'center'}
                   minH={'2.75rem'}
                   >
              <Heading size={{base: 'sm', md: 'md'}}
                       color={'gray.600'}
                       flexShrink={0}
                       >
                終了したイベント
              </Heading>
              <ActiveFilterBadge selectedKeyword={selectedKeyword}
                                 selectedGroupName={selectedGroupName}
                                 selectedAreaName={selectedAreaName}
                                 onClearKeyword={() => handleKeywordSelect(null)}
                                 onClearGroup={() => handleGroupSelect(null)}
                                 onClearArea={() => handleAreaSelect(null)}
                                 />
            </Stack>
            <Card variant={{base: 'unstyled', md: 'outline'}}
                  size={{base: 'sm', md: 'md'}}
                  p={'0'}
                  >
              <CardBody>
                <Stack spacing={EVENT_LIST_SPACING}>
                  {data.isLoading ? (
                    <SkeletonEventBody />
                  ) : data.errorMessage ? (
                    <ErrorEventBody message={ data.errorMessage } />
                  ) : pastEvents.length === 0 ? (
                    <EmptyEventBody />
                  ) : (
                    <EventListView items={buildEventListItems(pastEvents, anchoredDateKeys)}
                                   viewMode={viewMode}
                                   section={'past'}
                                   selectedKeyword={selectedKeyword}
                                   onKeywordClick={handleKeywordClick}
                                   enableSummarizer
                                   />
                  )}
                  {!data.isLoading && !data.errorMessage && selectedGroup && (
                    <GroupMoreEventsLink groupKey={selectedGroup}
                                         groupName={selectedGroupName ?? selectedGroup}
                                         imageUrl={selectedGroupDetail?.image_url}
                                         />
                  )}
                </Stack>
              </CardBody>
            </Card>
            {data.lastModified &&
              <FooterLastModified lastModified={ data.lastModified } />
            }
          </Stack>

          <Card variant={{base: 'unstyled', md: 'outline'}}
                size={{base: 'sm', md: 'md'}}
                padding={{base: '4', md: '0'}}
                >
            <CardBody>
              <SelectYearButtons startYear={startYear}/>
            </CardBody>
          </Card>
        </Stack>
        <SiteFooter />
      </Container>
    </Box>
  );
}

export default Root;
