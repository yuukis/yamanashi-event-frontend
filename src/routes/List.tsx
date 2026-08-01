import { useEffect, useState, useSyncExternalStore } from 'react';
import { useParams, useSearchParams } from "react-router-dom";
import { SiteHeader, SiteFooter, SelectYearButtons, FooterLastModified, useFixedHeaderBoundary, useIsHeadingStuck, STICKY_HEADING_TOP, STICKY_HEADING_STUCK_SHADOW } from '../components/Site';
import { PageBreadcrumb } from '../components/PageBreadcrumb';
import { YearSwitcher, YEAR_HEADING_ANCHOR_ID } from '../components/YearSwitcher';
import { EmptyEventBody, ErrorEventBody } from '../components/EventBody';
import { EventFilterTabs } from '../components/EventFilterTabs';
import { ActiveFilterBadge } from '../components/ActiveFilterBadge';
import { EventListView, SkeletonEventListView } from '../components/EventListView';
import { ViewModeToggle } from '../components/ViewModeToggle';
import { EventScrollGutter } from '../components/EventScrollGutter';
import { StructuredData } from '../components/StructuredData';
import '../style.css';
import {
  Container,
  Box,
  Stack,
  Card,
  CardBody,
  Heading,
  Text,
  Spacer,
} from '@chakra-ui/react';
import { sortByStartedAtAsc } from '../utils/eventSort';
import { enrichEventsWithGroups, isVisibleEvent, countGroups, filterEventsByGroup } from '../utils/eventGroups';
import { countKeywords, filterEventsByKeyword } from '../utils/eventKeywords';
import { countAreas, filterEventsByArea, AREA_LABELS, type AreaKey } from '../utils/eventAreas';
import { scrollToCurrentHash } from '../utils/hashScroll';
import { fetchEventsByYear, fetchGroups } from '../utils/api';
import { buildEventListJsonLd } from '../utils/structuredData';
import { SITE_URL } from '../utils/site';
import { subscribeViewMode, getViewModeSnapshot } from '../utils/viewModeStore';
import type { ApiGroup, EventWithGroup } from '../types/events';

type ListState = {
  isLoading: boolean;
  events: EventWithGroup[];
  groups: ApiGroup[];
  lastModified: string | null;
  errorMessage: string;
};

function List({ startYear} : {startYear: number}) {
  const { year: paramYear } = useParams();
  const year = parseInt(paramYear as string);

  const [searchParams, setSearchParams] = useSearchParams();
  const selectedGroup = searchParams.get('group');
  // keyword と group と area は排他。手入力やブックマークなど、複数の
  // クエリが同時に付いた URL が渡された場合は group > keyword > area の
  // 優先順で扱う。
  const selectedKeyword = selectedGroup ? null : searchParams.get('keyword');
  const selectedArea = (selectedGroup || selectedKeyword) ? null : (searchParams.get('area') as AreaKey | null);
  const [data, setData] = useState<ListState>({
    isLoading: true,
    events: [],
    groups: [],
    lastModified: null,
    errorMessage: ''
  });

  useEffect(() => {
    const group = searchParams.get('group');
    const keyword = searchParams.get('keyword');
    const area = searchParams.get('area');
    if ([group, keyword, area].filter(Boolean).length > 1) {
      setSearchParams(group ? { group } : keyword ? { keyword } : { area: area! }, { replace: true });
    }
  }, [searchParams, setSearchParams]);

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

  const keywordCounts = countKeywords(data.events);
  const areaCounts = countAreas(data.events);
  const groupCounts = countGroups(data.events, data.groups);
  const groupSelectorItems = groupCounts.map((group) => ({ key: group.key, name: group.name, imageUrl: group.imageUrl, events: group.events }));
  const selectedGroupName = selectedGroup
    ? (data.groups.find((group) => group.key === selectedGroup)?.title ?? selectedGroup)
    : null;
  const selectedAreaName = selectedArea ? (AREA_LABELS[selectedArea] ?? selectedArea) : null;
  const hasActiveFilter = Boolean(selectedGroup || selectedKeyword || selectedArea);
  const events = filterEventsByArea(filterEventsByGroup(filterEventsByKeyword(data.events, selectedKeyword), selectedGroup), selectedArea);
  const viewMode = useSyncExternalStore(subscribeViewMode, getViewModeSnapshot);

  const headerBoundaryRef = useFixedHeaderBoundary<HTMLDivElement>();
  const { ref: yearHeadingRef, isStuck: isYearHeadingStuck } = useIsHeadingStuck<HTMLDivElement>();

  document.title = `${year}年 開催イベント - Yamanashi Developer Hub`;

  useEffect(() => {
    const getData = async () => {
      let eventsResponse = null;
      let groups = null;
      try {
        eventsResponse = await fetchEventsByYear(year);
        groups = await fetchGroups();
      }
      catch (err: unknown) {
        const data = {
          isLoading: false,
          events: [],
          groups: [],
          lastModified: null,
          errorMessage: err instanceof Error ? err.message : String(err)
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
        events: events.filter(isVisibleEvent).sort(sortByStartedAtAsc),
        groups,
        lastModified: eventsResponse.lastModified,
        errorMessage: ''
      }
      setData(data);
    }
    getData();
  }, [year]);

  useEffect(() => {
    if (data.isLoading || data.errorMessage) {
      return;
    }

    window.requestAnimationFrame(scrollToCurrentHash);
  }, [data.errorMessage, data.isLoading, data.events]);

  const structuredData = !data.isLoading && !data.errorMessage
    ? buildEventListJsonLd(events, `${SITE_URL}/events/${year}`)
    : null;

  return (
    <Box className={'section-bg-pattern groups-page events-year-page'} w={'100vw'} minH={'100vh'}>
      <StructuredData id={'structured-data-events'} data={structuredData} />
      <SiteHeader />
      <EventScrollGutter />
      <PageBreadcrumb items={[
                        { label: 'イベントアーカイブ', href: '/events' },
                        { label: `${year}年`, href: `/events/${year}` },
                      ]}
                      />
      <Container className={'events-year-shell'} maxW={'980px'} w={'100%'}
                 mt={'4'}
                 p={{base: '0', md: '4'}}
                 >
        <Stack spacing={'0'}>
          {/* sticky 化した見出しバーは座標が動かず境界にできないため、目印として使う */}
          <Box ref={headerBoundaryRef} />
          <Stack>
            <Card variant={'outline'} className={'group-detail-hero events-year-hero'} mx={{base: '4', md: '0'}}>
              <CardBody className={'group-detail-hero-body'}>
                <Box className={'group-detail-hero-layout group-detail-hero-layout--profile-only'}>
                  <Box className={'group-detail-profile'}>
                    <Text className={'groups-eyebrow'}>YEAR ARCHIVE</Text>
                    <Stack className={'group-detail-identity'} direction={'row'} spacing={{base: '4', md: '6'}} alignItems={'center'}>
                      <Box className={'group-detail-logo events-year-hero-calendar'}
                           display={'flex'}
                           flexDirection={'column'}
                           alignItems={'center'}
                           justifyContent={'center'}
                           flexShrink={0}
                           >
                        <Text className={'events-year-hero-calendar-label'}>YEAR</Text>
                        <Text className={'events-year-hero-calendar-number'}>{year}</Text>
                      </Box>
                      <Box minW={'0'}>
                        <Heading as={'h1'} className={'group-detail-title'} size={{base: 'lg', md: 'xl'}}>
                          {year}年のイベント
                        </Heading>
                        <Text className={'group-detail-subtitle'} fontSize={'sm'} mt={'2'}>
                          山梨県内で開催されたITイベントを、開催月やコミュニティから振り返れます。
                        </Text>
                      </Box>
                    </Stack>
                  </Box>
                </Box>
              </CardBody>
            </Card>
            <Stack id={YEAR_HEADING_ANCHOR_ID}
                   ref={yearHeadingRef}
                   className={'group-detail-section-heading events-year-toolbar'}
                   data-has-active-filter={hasActiveFilter}
                   direction={'row'} spacing={'2'}
                   position={'sticky'}
                   top={STICKY_HEADING_TOP}
                   zIndex={'docked'}
                   bg={'gray.100'}
                   px={{base: '4', md: '0'}}
                   py={'2'}
                   scrollMarginTop={{base: '4.5rem', md: '5.5rem'}}
                   display={'flex'} alignItems={'center'}
                   minH={'2.75rem'}
                   boxShadow={isYearHeadingStuck ? STICKY_HEADING_STUCK_SHADOW : 'none'}
                   transition={'box-shadow 150ms ease-out'}
                   >
              <Heading as={'h2'}
                       size={{base: 'sm', md: 'md'}}
                       color={'gray.600'}
                       flexShrink={0}
                       >
                <span className={'events-year-toolbar-year'}>{year}年</span>イベント一覧
              </Heading>
              <ActiveFilterBadge selectedKeyword={selectedKeyword}
                                 selectedGroupName={selectedGroupName}
                                 selectedAreaName={selectedAreaName}
                                 onClearKeyword={() => handleKeywordSelect(null)}
                                 onClearGroup={() => handleGroupSelect(null)}
                                 onClearArea={() => handleAreaSelect(null)}
                                 />
              <Spacer />
              <Box display={hasActiveFilter ? { base: 'none', md: 'block' } : 'block'} flexShrink={0}>
                <YearSwitcher startYear={startYear} selectedYear={year} />
              </Box>
              <Box flexShrink={0}>
                <ViewModeToggle />
              </Box>
            </Stack>
            <Box className={'events-year-filters'}>
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
                               showGroupBadges={false}
                               />
            </Box>
            <Card variant={viewMode === 'grid' && (data.isLoading || (!data.errorMessage && events.length > 0)) ? 'unstyled' : {base: 'unstyled', md: 'outline'}}
                  className={'events-year-content'}
                  size={{base: 'sm', md: 'md'}}
                  p={'0'}
                  bg={viewMode === 'grid' && (data.isLoading || (!data.errorMessage && events.length > 0)) ? 'gray.100' : undefined}
                  >
              <CardBody>
                {data.isLoading ? (
                  <SkeletonEventListView viewMode={viewMode} />
                ) : data.errorMessage ? (
                  <ErrorEventBody message={ data.errorMessage } />
                ) : events.length === 0 ? (
                  <EmptyEventBody />
                ) : (
                  <EventListView items={events.map((event) => ({ event }))}
                                 viewMode={viewMode}
                                 selectedKeyword={selectedKeyword}
                                 onKeywordClick={handleKeywordClick}
                                 enableSummarizer
                                 summaryDescriptionYear={year}
                                 />
                )}
              </CardBody>
            </Card>
            {data.lastModified &&
              <FooterLastModified lastModified={ data.lastModified } />
            }
          </Stack>

          <Card variant={{base: 'unstyled', md: 'outline'}}
                className={'events-year-footer-nav'}
                size={{base: 'sm', md: 'md'}}
                p={{base: '4', md: '0'}}
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

export default List;
