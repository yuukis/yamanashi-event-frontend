import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SiteHeader, SiteFooter, SelectYearButtons, FooterLastModified } from '../components/Site';
import { EventBody, SkeletonEventBody, EmptyEventBody, ErrorEventBody } from '../components/EventBody';
import { ChipBar } from '../components/ChipBar';
import { GroupSelector } from '../components/GroupSelector';
import { ActiveFilterBadge } from '../components/ActiveFilterBadge';
import { AnimatedEventItem, EVENT_LIST_SPACING } from '../components/AnimatedEventItem';
import '../style.css';
import eyecatch from "../assets/images/eyecatch.png"
import root_bg from "../assets/images/root_bg.png";
import root_top_bg from "../assets/images/root_top_bg.png";
import {
  Container,
  Box,
  Stack,
  Card,
  CardBody,
  Heading,
  Text,
  Image,
  Link,
  Button
} from '@chakra-ui/react';
import { AnimatePresence } from 'framer-motion';
import { ExternalLinkIcon, InfoOutlineIcon } from "@chakra-ui/icons";
import { sortByStartedAtAsc, sortByStartedAtDesc } from '../utils/eventSort';
import { enrichEventsWithGroups, isFutureEvent, isPastEvent, countGroups, filterEventsByGroup } from '../utils/eventGroups';
import { countKeywords, filterEventsByKeyword } from '../utils/eventKeywords';
import { fetchEvents, fetchGroups } from '../utils/api';
import { formatEventDateKey, getEventDateAnchorId } from '../utils/eventAnchors';
import { scrollToCurrentHash } from '../utils/hashScroll';
import type { ApiGroup, EventWithGroup } from '../types/events';

// 星空レイヤーをヒーロー上端より上へはみ出させる量(px)。レイヤーが下へ
// 追随したときにヒーロー上端との間に生じる領域をタイル上端と同色の
// 塗り足しで埋め、星のない空が続いているように見せる。はみ出しの上端が
// ビューポートに入らないよう、ヒーロー上端のページ内オフセット
// (≒ヘッダー高 71px)より大きい値にすること。
const STARFIELD_BLEED = 120;
// 星空タイル(root_top_bg.png)は幅:高さ = 1:2 なので、帯の高さは
// bgSize で指定する幅の2倍になる。
const STARFIELD_HEIGHT = 200;

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
  // keyword と group は排他。手入力やブックマークなど、両方のクエリが
  // 同時に付いた URL が渡された場合は group を優先する。
  const selectedKeyword = selectedGroup ? null : searchParams.get('keyword');
  const [data, setData] = useState<RootState>({
    isLoading: true,
    pastEvents: [],
    futureEvents: [],
    groups: [],
    lastModified: null,
    errorMessage: ''
  });

  document.title = `Yamanashi Developer Hub - 山梨のIT勉強会イベント情報ポータルサイト`;

  useEffect(() => {
    if (searchParams.get('keyword') && searchParams.get('group')) {
      setSearchParams({ group: searchParams.get('group')! });
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
    setSearchParams(keyword ? { keyword } : {});
  };
  const handleKeywordClick = (keyword: string) => {
    handleKeywordSelect(selectedKeyword === keyword ? null : keyword);
  };

  const handleGroupSelect = (group: string | null) => {
    window.dispatchEvent(new Event('site-header-hold'));
    setSearchParams(group ? { group } : {});
  };

  const futureKeywordCounts = countKeywords(data.futureEvents);
  const pastKeywordCounts = countKeywords(data.pastEvents);
  const groupCounts = countGroups([...data.futureEvents, ...data.pastEvents], data.groups);
  const groupSelectorItems = groupCounts.map((group) => ({ key: group.key, name: group.name, imageUrl: group.imageUrl, events: group.events }));
  const selectedGroupName = selectedGroup
    ? (data.groups.find((group) => group.key === selectedGroup)?.title ?? selectedGroup)
    : null;
  const futureEvents = filterEventsByGroup(filterEventsByKeyword(data.futureEvents, selectedKeyword), selectedGroup);
  const pastEvents = filterEventsByGroup(filterEventsByKeyword(data.pastEvents, selectedKeyword), selectedGroup);

  const renderEventBodies = (events: EventWithGroup[], anchoredDateKeys: Set<string>) => {
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

      return <AnimatedEventItem key={event.uid}>
              <EventBody event={event}
                        anchorId={anchorId}
                        selectedKeyword={selectedKeyword}
                        onKeywordClick={handleKeywordClick}
                        />
            </AnimatedEventItem>;
    });
  };

  const anchoredDateKeys = new Set<string>();

  return (
    <Box bg={'gray.100'} w={'100vw'} minH={'100vh'}>
      <SiteHeader />
      <ActiveFilterBadge selectedKeyword={selectedKeyword}
                         selectedGroupName={selectedGroupName}
                         onClearKeyword={() => handleKeywordSelect(null)}
                         onClearGroup={() => handleGroupSelect(null)}
                         />
      <Box bg={'#fffafa'}
           p={0}
           position={'relative'}
           overflow={'hidden'}
           >
        {/* 星空レイヤー。スクロールに追随して translateY で動かすため、親の
            背景プロパティではなく専用の絶対配置レイヤーとして持つ。視差は
            style.css の .starfield-parallax(スクロール駆動アニメーション)が
            適用する。非対応ブラウザではアニメーションが無効になり、視差なしの
            静的表示になる。上へはみ出させた分をタイル上端と同じ色 (#faf0e6) で
            塗り、下へ追随したときに継ぎ目が見えないようにする。タイル下端は
            親の背景色 (#fffafa) と同色なので下側の境界はそのまま馴染む。 */}
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
                    p={{base: '8', md: '4'}}
                    w={'100%'}
                    h={{md: '320px'}}
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
              <Box pt={'2'} textAlign={{base: 'center', md: 'left'}}>
                <Button size={{base: 'sm', md: 'md'}}
                        variant={'outline'}
                        colorScheme={'primary'}
                        leftIcon={<InfoOutlineIcon />}
                        onClick={() => { window.open('/guide', '_self') }}
                        >
                  はじめての方へ
                </Button>
              </Box>
            </Stack>          
          </Container>
        </Box>
      </Box>
      <Container maxW={'980px'} w={'100%'}
                 p={{base: '0', md: '4'}}
                 >
        <Stack>
          <GroupSelector groups={groupSelectorItems}
                          selected={selectedGroup}
                          onSelect={handleGroupSelect}
                          isLoading={data.isLoading}
                          />
          <Heading size={{base: 'sm', md: 'md'}}
                   ml={{base: '4', md: '0'}}
                   mt={'8'}
                   mb={'2'}
                   color={'gray.600'}
                   >
            直近開催イベント
          </Heading>
          {!data.isLoading && !data.errorMessage && (
            <ChipBar items={futureKeywordCounts.map(([keyword]) => ({ value: keyword, label: keyword }))}
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
                ) : futureEvents.length === 0 ? (
                  <EmptyEventBody />
                ) : (
                  <AnimatePresence initial={false}>
                    {renderEventBodies(futureEvents, anchoredDateKeys)}
                  </AnimatePresence>
                )}
              </Stack>
            </CardBody>
          </Card>
          {data.lastModified &&
            <FooterLastModified lastModified={ data.lastModified } />
          }

          <Heading size={{base: 'sm', md: 'md'}}
                   ml={{base: '4', md: '0'}}
                   mt={'8'}
                   mb={'2'}
                   color={'gray.600'}
                   >
            終了したイベント
          </Heading>
          {!data.isLoading && !data.errorMessage && (
            <ChipBar items={pastKeywordCounts.map(([keyword]) => ({ value: keyword, label: keyword }))}
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
                ) : pastEvents.length === 0 ? (
                  <EmptyEventBody />
                ) : (
                  <AnimatePresence initial={false}>
                    {renderEventBodies(pastEvents, anchoredDateKeys)}
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
