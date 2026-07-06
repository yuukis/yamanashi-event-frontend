import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from "react-router-dom";
import axios from 'axios';
import { SiteHeader, SiteFooter, SelectYearButtons, FooterLastModified } from '../components/Site';
import { EventBody, SkeletonEventBody, EmptyEventBody, ErrorEventBody } from '../components/EventBody';
import { ChipBar } from '../components/ChipBar';
import { GroupSelector } from '../components/GroupSelector';
import { ActiveFilterBadge } from '../components/ActiveFilterBadge';
import '../style.css';
import {
  Container,
  Box,
  Stack,
  StackDivider,
  Card,
  CardBody,
  Heading,
  Button,
  Spacer
} from '@chakra-ui/react';
import { sortByStartedAtAsc } from '../utils/eventSort';
import { enrichEventsWithGroups, isVisibleEvent, countGroups, filterEventsByGroup } from '../utils/eventGroups';
import { countKeywords, filterEventsByKeyword } from '../utils/eventKeywords';
import type { ApiEvent, ApiGroup, EventWithGroup } from '../types/events';

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
  const selectedKeyword = searchParams.get('keyword');
  const selectedGroup = searchParams.get('group');
  const [data, setData] = useState<ListState>({
    isLoading: true,
    events: [],
    groups: [],
    lastModified: null,
    errorMessage: ''
  });

  const handleKeywordSelect = (keyword: string | null) => {
    window.dispatchEvent(new Event('site-header-hold'));
    setSearchParams(keyword ? { keyword } : {});
  };
  const handleKeywordClick = (keyword: string) => {
    handleKeywordSelect(selectedKeyword === keyword ? null : keyword);
  };

  const handleGroupSelect = (group: string | null) => {
    window.dispatchEvent(new Event('site-header-hold'));
    setSearchParams(group ? { group } : {});
  };

  const keywordCounts = countKeywords(data.events);
  const knownGroupKeys = new Set(data.groups.map((group) => group.key));
  const groupCounts = countGroups(data.events, knownGroupKeys);
  const groupSelectorItems = groupCounts.map((group) => ({ key: group.key, name: group.name, imageUrl: group.imageUrl, events: group.events }));
  const selectedGroupName = groupCounts.find((group) => group.key === selectedGroup)?.name ?? null;
  const events = filterEventsByGroup(filterEventsByKeyword(data.events, selectedKeyword), selectedGroup);

  document.title = `${year}年 開催イベント - Yamanashi Developer Hub`;

  useEffect(() => {
    const getData = async () => {
      let res = null;
      let group_res = null;
      try {
        res = await axios.get(`https://api.event.yamanashi.dev/events/in/${year}`);
        group_res = await axios.get('https://api.event.yamanashi.dev/groups');
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

      const groups = group_res.data as ApiGroup[];
      const events = enrichEventsWithGroups(
        res.data as ApiEvent[],
        groups,
      );
      const data = {
        isLoading: false,
        events: events.filter(isVisibleEvent).sort(sortByStartedAtAsc),
        groups,
        lastModified: res.headers['last-modified'],
        errorMessage: ''
      }
      setData(data);
    }
    getData();
  }, []);

  return (
    <Box bg={'gray.100'} w={'100vw'} minH={'100vh'}>
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
          <Stack direction={'row'} spacing={'2'}
                 ml={{base: '4', md: '0'}}
                 mr={{base: '4', md: '0'}}
                 mb={'2'}
                 display={'flex'} alignItems={'flex-end'}
                 >
            <Heading size={{base: 'sm', md: 'md'}}
                     mt={'4'}
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
                            onClick={() => {window.open('/' + prev_year, '_self')}}
                    >← { prev_year }年</Button>
                )
            }
            <Button size={'xs'}
                    variant={'ghost'}
                    colorScheme={'impact'}
                    onClick={() => {window.open('/' + next_year, '_self')}}
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
              <Stack spacing={{base: '0', md: '0.5em'}} divider={<StackDivider />}>
              {data.isLoading ? (
                  <SkeletonEventBody />
                ) : data.errorMessage ? (
                  <ErrorEventBody message={ data.errorMessage } />
                ) : events.length === 0 ? (
                  <EmptyEventBody />
                ) : (
                  events.map((event) => {
                    return <EventBody key={event.uid}
                                      event={event}
                                      selectedKeyword={selectedKeyword}
                                      onKeywordClick={handleKeywordClick}
                                      />
                  }
                ))}
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
