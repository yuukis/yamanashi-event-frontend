import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from "react-router-dom";
import { SiteHeader, SiteFooter, SelectYearButtons, FooterLastModified, useFixedHeaderBoundary, STICKY_HEADING_TOP } from '../components/Site';
import { EventBody, SkeletonEventBody, EmptyEventBody, ErrorEventBody } from '../components/EventBody';
import { ChipBar } from '../components/ChipBar';
import { GroupSelector } from '../components/GroupSelector';
import { ActiveFilterBadge } from '../components/ActiveFilterBadge';
import { AnimatedEventItem, EVENT_LIST_SPACING } from '../components/AnimatedEventItem';
import { StructuredData } from '../components/StructuredData';
import '../style.css';
import {
  Container,
  Box,
  Stack,
  Card,
  CardBody,
  Heading,
  Button,
  Spacer
} from '@chakra-ui/react';
import { AnimatePresence } from 'framer-motion';
import { sortByStartedAtAsc } from '../utils/eventSort';
import { enrichEventsWithGroups, isVisibleEvent, countGroups, filterEventsByGroup } from '../utils/eventGroups';
import { countKeywords, filterEventsByKeyword } from '../utils/eventKeywords';
import { scrollToCurrentHash } from '../utils/hashScroll';
import { fetchEventsByYear, fetchGroups } from '../utils/api';
import { buildEventListJsonLd } from '../utils/structuredData';
import { SITE_URL } from '../utils/site';
import type { ApiGroup, EventWithGroup } from '../types/events';

type ListState = {
  isLoading: boolean;
  events: EventWithGroup[];
  groups: ApiGroup[];
  lastModified: string | null;
  errorMessage: string;
};

function List({ startYear} : {startYear: number}) {
  let { year: param_year } = useParams();
  const year = parseInt(param_year as string);
  const prev_year = year - 1;
  const next_year = year + 1;

  const [searchParams, setSearchParams] = useSearchParams();
  const selectedGroup = searchParams.get('group');
  // keyword と group は排他。手入力やブックマークなど、両方のクエリが
  // 同時に付いた URL が渡された場合は group を優先する。
  const selectedKeyword = selectedGroup ? null : searchParams.get('keyword');
  const [data, setData] = useState<ListState>({
    isLoading: true,
    events: [],
    groups: [],
    lastModified: null,
    errorMessage: ''
  });

  useEffect(() => {
    if (searchParams.get('keyword') && searchParams.get('group')) {
      setSearchParams({ group: searchParams.get('group')! }, { replace: true });
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

  const keywordCounts = countKeywords(data.events);
  const groupCounts = countGroups(data.events, data.groups);
  const groupSelectorItems = groupCounts.map((group) => ({ key: group.key, name: group.name, imageUrl: group.imageUrl, events: group.events }));
  const selectedGroupName = selectedGroup
    ? (data.groups.find((group) => group.key === selectedGroup)?.title ?? selectedGroup)
    : null;
  const events = filterEventsByGroup(filterEventsByKeyword(data.events, selectedKeyword), selectedGroup);

  const headerBoundaryRef = useFixedHeaderBoundary<HTMLDivElement>();

  document.title = `${year}年 開催イベント - Yamanashi Developer Hub`;

  useEffect(() => {
    const getData = async () => {
      let eventsResponse = null;
      let groups = null;
      try {
        eventsResponse = await fetchEventsByYear(year);
        groups = await fetchGroups();
      }
      catch (err: any) {
        const data = {
          isLoading: false,
          events: [],
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
        events: events.filter(isVisibleEvent).sort(sortByStartedAtAsc),
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
  }, [data.errorMessage, data.isLoading, data.events]);

  const structuredData = !data.isLoading && !data.errorMessage
    ? buildEventListJsonLd(events, `${SITE_URL}/events/${year}`)
    : null;

  return (
    <Box bg={'gray.100'} w={'100vw'} minH={'100vh'}>
      <StructuredData id={'structured-data-events'} data={structuredData} />
      <SiteHeader />
      <ActiveFilterBadge selectedKeyword={selectedKeyword}
                         selectedGroupName={selectedGroupName}
                         onClearKeyword={() => handleKeywordSelect(null)}
                         onClearGroup={() => handleGroupSelect(null)}
                         />
      <Container maxW={'980px'} w={'100%'}
                 mt={'4'}
                 p={{base: '0', md: '4'}}
                 >
        <Stack>
          <GroupSelector groups={groupSelectorItems}
                          selected={selectedGroup}
                          onSelect={handleGroupSelect}
                          isLoading={data.isLoading}
                          />
          {/* sticky 化した見出しバーは座標が動かず境界にできないため、目印として使う */}
          <Box ref={headerBoundaryRef} />
          <Stack direction={'row'} spacing={'2'}
                 position={'sticky'}
                 top={STICKY_HEADING_TOP}
                 zIndex={'docked'}
                 bg={'gray.100'}
                 px={{base: '4', md: '0'}}
                 mt={'4'}
                 mb={'2'}
                 py={'2'}
                 display={'flex'} alignItems={'flex-end'}
                 >
            <Heading size={{base: 'sm', md: 'md'}}
                     color={'gray.600'}
                     >
              { year }年 開催イベント
            </Heading>
            <Spacer />
            {
              prev_year >= startYear && (
                    <Button size={'xs'}
                            variant={'ghost'}
                            colorScheme={'impact'}
                            onClick={() => {window.open('/events/' + prev_year, '_self')}}
                    >← { prev_year }年</Button>
                )
            }
            <Button size={'xs'}
                    variant={'ghost'}
                    colorScheme={'impact'}
                    onClick={() => {window.open('/events/' + next_year, '_self')}}
                    >{ next_year }年 →</Button>
          </Stack>
          {!data.isLoading && !data.errorMessage && (
            <ChipBar items={keywordCounts.map(([keyword]) => ({ value: keyword, label: keyword }))}
                     selected={selectedKeyword}
                     onSelect={handleKeywordSelect}
                     expandAriaLabel={'すべてのキーワードを表示'}
                     collapseAriaLabel={'キーワードを折りたたむ'}
                     />
          )}
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
                ) : events.length === 0 ? (
                  <EmptyEventBody />
                ) : (
                  <AnimatePresence initial={false}>
                    {events.map((event) => (
                      <AnimatedEventItem key={event.uid}>
                        <EventBody event={event}
                                   selectedKeyword={selectedKeyword}
                                   onKeywordClick={handleKeywordClick}
                                   enableSummarizer
                                   summaryDescriptionYear={year}
                                   />
                      </AnimatedEventItem>
                    ))}
                  </AnimatePresence>
                )}
              </Stack>
            </CardBody>
          </Card>
          {data.lastModified &&
            <FooterLastModified lastModified={ data.lastModified } />
          }

          <Card variant={{base: 'unstyled', md: 'outline'}}
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
