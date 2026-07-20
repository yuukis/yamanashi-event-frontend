import { useEffect, useRef, useState } from 'react';
import { useParams } from "react-router-dom";
import { SiteHeader, SiteFooter, FooterLastModified, useFixedHeaderBoundary } from '../components/Site';
import { EventBody, SkeletonEventBody, EmptyEventBody, ErrorEventBody } from '../components/EventBody';
import { AnimatedEventItem, EVENT_LIST_SPACING } from '../components/AnimatedEventItem';
import { ShareContextIconRow } from '../components/ShareButtons';
import { WidgetPreviewCard } from '../components/WidgetPreviewCard';
import { StructuredData } from '../components/StructuredData';
import '../style.css';
import {
  Container,
  Box,
  Stack,
  HStack,
  Wrap,
  WrapItem,
  Card,
  CardBody,
  Heading,
  Text,
  Image,
  Button,
  Skeleton,
} from '@chakra-ui/react';
import { ChevronDownIcon, ChevronUpIcon, ExternalLinkIcon } from '@chakra-ui/icons';
import { FiRss } from 'react-icons/fi';
import { People } from '@chakra-icons/bootstrap';
import { sortByStartedAtAsc, sortByStartedAtDesc } from '../utils/eventSort';
import { enrichEventsWithGroups, isVisibleEvent, isFutureEvent, isPastEvent } from '../utils/eventGroups';
import { fetchGroup, fetchGroupEvents } from '../utils/api';
import { buildGroupPageUrl, buildGroupExternalLinks, buildGroupFeedUrl, buildGroupFeedTitle } from '../utils/groupPage';
import { buildGroupPageJsonLd } from '../utils/structuredData';
import { buildListWidgetPath } from '../utils/widgetPaths';
import { sanitizeDescriptionHtml } from '../utils/descriptionHtml';
import type { ApiGroupDetail, EventWithGroup } from '../types/events';

// 過去のイベントは新しい順(order=desc)にこの件数ずつAPIから取得する。
// 未来のイベントは通常この件数を大きく下回るため、1ページ目だけで
// 「今後の開催予定」を取りこぼす心配はない。
const GROUP_EVENTS_PAGE_SIZE = 20;
// 折りたたみ時に見せる説明文の高さ(fontSize sm × lineHeight 1.8 の約5行分)
const DESCRIPTION_COLLAPSED_MAX_H = '8em';

function GroupStat({ label, value, unit, testId }: { label: string; value: number | string; unit: string; testId: string }) {
  return (
    <Box data-testid={testId} minW={'0'}>
      <Text fontSize={'xs'} color={'gray.500'} whiteSpace={'nowrap'}>{label}</Text>
      <Text fontSize={'sm'} color={'gray.700'} whiteSpace={'nowrap'}>
        <Text as={'span'} fontSize={'lg'} fontWeight={'bold'} mr={'1'}>{value}</Text>
        {unit}
      </Text>
    </Box>
  );
}

// sanitizeDescriptionHtml が出力する許可タグと desc-hN(見出し由来の
// 段落)に対するスタイル。見出しは文字の大きさ・太さを変えるだけで、
// 文書のアウトラインには参加させない。
const DESCRIPTION_STYLES = {
  fontSize: 'sm',
  color: 'gray.700',
  lineHeight: '1.8',
  '& > :first-of-type': { marginTop: '0' },
  '& p': { marginBottom: '0.6em' },
  '& .desc-h1, & .desc-h2': { fontSize: 'md', fontWeight: 'bold', marginTop: '1em', marginBottom: '0.4em' },
  '& .desc-h3, & .desc-h4, & .desc-h5, & .desc-h6': { fontWeight: 'bold', marginTop: '1em', marginBottom: '0.4em' },
  '& a': { color: 'primary.800', textDecoration: 'underline' },
  '& ul, & ol': { paddingLeft: '1.6em', marginBottom: '0.6em' },
  '& table': { display: 'block', overflowX: 'auto', maxWidth: '100%', borderCollapse: 'collapse', marginBottom: '0.6em' },
  '& th, & td': { border: '1px solid', borderColor: 'gray.200', padding: '0.25em 0.6em' },
  '& th': { bg: 'gray.50' },
  '& blockquote': { borderLeft: '3px solid', borderLeftColor: 'gray.200', paddingLeft: '0.75em', color: 'gray.600', marginBottom: '0.6em' },
  '& pre': { bg: 'gray.50', padding: '0.5em 0.75em', borderRadius: 'md', overflowX: 'auto', fontSize: 'xs', marginBottom: '0.6em' },
  '& code': { fontFamily: 'mono', fontSize: '0.9em', bg: 'gray.50', paddingX: '0.3em', borderRadius: 'sm' },
  '& hr': { marginY: '0.75em', borderColor: 'gray.200' },
};

function CollapsibleDescription({ html }: { html: string }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasOverflow, setHasOverflow] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = bodyRef.current;
    if (!el) {
      return;
    }
    const check = () => setHasOverflow(el.scrollHeight > el.clientHeight + 1);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [html, isExpanded]);

  if (!html) {
    return null;
  }

  return (
    <Box>
      <Box position={'relative'}>
        <Box ref={bodyRef}
             data-testid={'group-description'}
             maxH={isExpanded ? undefined : DESCRIPTION_COLLAPSED_MAX_H}
             overflow={'hidden'}
             sx={DESCRIPTION_STYLES}
             dangerouslySetInnerHTML={{ __html: html }}
             />
        {!isExpanded && hasOverflow && (
          <Box position={'absolute'}
               bottom={'0'}
               left={'0'}
               right={'0'}
               h={'3em'}
               bgGradient={'linear(to-t, white, transparent)'}
               pointerEvents={'none'}
               aria-hidden
               />
        )}
      </Box>
      {(hasOverflow || isExpanded) && (
        <Button variant={'link'}
                size={'sm'}
                mt={'2'}
                fontWeight={'normal'}
                color={'primary.800'}
                rightIcon={isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
                onClick={() => setIsExpanded(!isExpanded)}
                >
          {isExpanded ? '閉じる' : '続きを読む'}
        </Button>
      )}
    </Box>
  );
}

type GroupState = {
  isLoading: boolean;
  group: ApiGroupDetail | null;
  events: EventWithGroup[];
  lastModified: string | null;
  errorMessage: string;
  isNotFound: boolean;
  page: number;
  // APIのx-total-count/x-total-pagesヘッダーはAccess-Control-Expose-Headers
  // が設定されておらず、ブラウザからは読めない(curlでは見えるが
  // fetch/axiosではnullになる)。そのため「もっと見る」の表示可否は
  // ヘッダーに頼らず、直前に取得したページの件数がページサイズと
  // 一致するか(=まだ続きがありそうか)で判定する。
  hasMorePastEvents: boolean;
  totalCount: number | null;
  isLoadingMorePastEvents: boolean;
  loadMorePastEventsErrorMessage: string;
};

function initialGroupState(): GroupState {
  return {
    isLoading: true,
    group: null,
    events: [],
    lastModified: null,
    errorMessage: '',
    isNotFound: false,
    page: 0,
    hasMorePastEvents: false,
    totalCount: null,
    isLoadingMorePastEvents: false,
    loadMorePastEventsErrorMessage: '',
  };
}

function extractErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

function Group() {
  const { groupKey } = useParams();

  const [data, setData] = useState<GroupState>(initialGroupState);

  const headerBoundaryRef = useFixedHeaderBoundary<HTMLDivElement>();

  useEffect(() => {
    setData(initialGroupState());

    if (!groupKey) {
      return;
    }

    let cancelled = false;
    const getData = async () => {
      try {
        const [group, eventsPage] = await Promise.all([
          fetchGroup(groupKey),
          fetchGroupEvents(groupKey, { perPage: GROUP_EVENTS_PAGE_SIZE, order: 'desc' }),
        ]);
        if (cancelled) {
          return;
        }
        setData({
          ...initialGroupState(),
          isLoading: false,
          group,
          events: enrichEventsWithGroups(eventsPage.events, [group]).filter(isVisibleEvent),
          lastModified: eventsPage.lastModified,
          page: eventsPage.page ?? 1,
          hasMorePastEvents: eventsPage.events.length >= GROUP_EVENTS_PAGE_SIZE,
          totalCount: eventsPage.totalCount,
        });
      } catch (err) {
        if (cancelled) {
          return;
        }
        const status = (err as { response?: { status?: number } })?.response?.status;
        const isNotFound = status === 404;
        setData({
          ...initialGroupState(),
          isLoading: false,
          errorMessage: isNotFound ? '' : extractErrorMessage(err),
          isNotFound,
        });
      }
    };
    getData();
    return () => {
      cancelled = true;
    };
  }, [groupKey]);

  const group = data.group;

  const handleLoadMorePastEvents = async () => {
    if (!groupKey || !group || data.isLoadingMorePastEvents || !data.hasMorePastEvents) {
      return;
    }

    setData((previous) => ({ ...previous, isLoadingMorePastEvents: true, loadMorePastEventsErrorMessage: '' }));

    const nextPage = data.page + 1;
    try {
      const eventsPage = await fetchGroupEvents(groupKey, { page: nextPage, perPage: GROUP_EVENTS_PAGE_SIZE, order: 'desc' });
      const newEvents = enrichEventsWithGroups(eventsPage.events, [group]).filter(isVisibleEvent);
      setData((previous) => ({
        ...previous,
        events: [...previous.events, ...newEvents],
        page: eventsPage.page ?? nextPage,
        hasMorePastEvents: eventsPage.events.length >= GROUP_EVENTS_PAGE_SIZE,
        totalCount: eventsPage.totalCount ?? previous.totalCount,
        isLoadingMorePastEvents: false,
      }));
    } catch (err) {
      setData((previous) => ({
        ...previous,
        isLoadingMorePastEvents: false,
        loadMorePastEventsErrorMessage: extractErrorMessage(err),
      }));
    }
  };

  useEffect(() => {
    if (!group) {
      return;
    }
    const link = document.createElement('link');
    link.rel = 'alternate';
    link.type = 'application/rss+xml';
    link.title = buildGroupFeedTitle(group.title);
    link.href = buildGroupFeedUrl(group.key);
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, [group]);

  const upcomingEvents = data.events.filter(isFutureEvent).sort(sortByStartedAtAsc);
  const pastEvents = data.events.filter(isPastEvent).sort(sortByStartedAtDesc);
  // 開催イベント数はAPIの総件数ヘッダーが取得できればそれを、できなければ
  // 読み込み済み件数を使う。ヘッダーが読めず、かつまだ続きがある場合は
  // 「N件以上」として、まだ全体の数ではないことを示す。
  const eventCount = data.totalCount ?? data.events.length;
  const eventCountUnit = data.totalCount === null && data.hasMorePastEvents ? '件以上' : '件';
  // 活動開始年は「最も古いイベント」から求めるため、過去ページを
  // すべて読み込み終えるまでは不正確(実際より新しい年になる)。
  // 全ページ読み込み完了後にのみ表示する。
  const firstEventYear = !data.hasMorePastEvents && data.events.length > 0
    ? Math.min(...data.events.map((event) => new Date(event.started_at).getFullYear()))
    : null;
  const descriptionHtml = group?.description ? sanitizeDescriptionHtml(group.description) : '';
  const externalLinks = group ? buildGroupExternalLinks(group) : [];

  document.title = group
    ? `${group.title} - 山梨のITコミュニティ | Yamanashi Developer Hub`
    : data.isNotFound
      ? 'コミュニティが見つかりません - Yamanashi Developer Hub'
      : 'コミュニティ - Yamanashi Developer Hub';

  const structuredData = group
    ? buildGroupPageJsonLd(group, [...upcomingEvents, ...pastEvents])
    : null;

  return (
    <Box bg={'gray.100'} w={'100vw'} minH={'100vh'}>
      <StructuredData id={'structured-data-group'} data={structuredData} />
      <SiteHeader />
      <Container maxW={'980px'} w={'100%'}
                 mt={'4'}
                 p={{base: '0', md: '4'}}
                 >
        <Box ref={headerBoundaryRef} />
        <Stack px={{base: '4', md: '0'}}>
          {data.isLoading ? (
            <Card variant={'outline'}>
              <CardBody>
                <Stack direction={{base: 'column', md: 'row'}} spacing={'6'}>
                  <Skeleton boxSize={'96px'} borderRadius={'md'} flexShrink={0} />
                  <Stack flex={'1'} spacing={'3'}>
                    <Skeleton h={'1.5rem'} w={'40%'} />
                    <Skeleton h={'1rem'} w={'60%'} />
                    <Skeleton h={'1rem'} w={'90%'} />
                    <Skeleton h={'1rem'} w={'80%'} />
                  </Stack>
                </Stack>
              </CardBody>
            </Card>
          ) : data.isNotFound ? (
            <Card variant={'outline'}>
              <CardBody>
                <Stack alignItems={'center'} py={'8'} spacing={'4'}>
                  <Text color={'gray.600'}>コミュニティが見つかりませんでした</Text>
                  <Button as={'a'} href={'/'} size={'sm'} colorScheme={'primary'} variant={'outline'}>
                    トップページでイベントを見る
                  </Button>
                </Stack>
              </CardBody>
            </Card>
          ) : data.errorMessage ? (
            <Card variant={'outline'}>
              <CardBody>
                <ErrorEventBody message={data.errorMessage} />
              </CardBody>
            </Card>
          ) : group && (
            <>
              <Card variant={'outline'}>
                <CardBody>
                  <Stack spacing={'4'}>
                    <Stack direction={'row'} spacing={{base: '4', md: '6'}} alignItems={'center'}>
                      <Box boxSize={{base: '72px', md: '96px'}}
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
                          <People boxSize={'8'} color={'gray.400'} />
                        )}
                      </Box>
                      <Box minW={'0'}>
                        <Heading as={'h1'} size={{base: 'md', md: 'lg'}} color={'primary.800'}>
                          {group.title}
                        </Heading>
                        {group.sub_title && (
                          <Text fontSize={'sm'} color={'gray.600'} mt={'1'}>
                            {group.sub_title}
                          </Text>
                        )}
                      </Box>
                    </Stack>
                    <Wrap spacing={{base: '6', md: '10'}}
                          borderTop={'1px solid'}
                          borderBottom={'1px solid'}
                          borderColor={'gray.100'}
                          py={'3'}
                          >
                      {eventCount > 0 && (
                        <WrapItem>
                          <GroupStat label={'開催イベント'} value={eventCount} unit={eventCountUnit} testId={'group-stat-events'} />
                        </WrapItem>
                      )}
                      {firstEventYear && (
                        <WrapItem>
                          <GroupStat label={'活動開始'} value={firstEventYear} unit={'年'} testId={'group-stat-since'} />
                        </WrapItem>
                      )}
                      {(group.member_users_count ?? 0) > 0 && (
                        <WrapItem>
                          <GroupStat label={'メンバー'} value={group.member_users_count!} unit={'人'} testId={'group-stat-members'} />
                        </WrapItem>
                      )}
                    </Wrap>
                    <CollapsibleDescription html={descriptionHtml} />
                    {externalLinks.length > 0 && (
                      <Wrap spacing={'2'}>
                        {externalLinks.map((link) => (
                          <WrapItem key={link.id}>
                            <Button as={'a'}
                                    href={link.url}
                                    target={'_blank'}
                                    rel={'noopener'}
                                    size={'xs'}
                                    variant={'outline'}
                                    fontWeight={'normal'}
                                    rightIcon={<ExternalLinkIcon />}
                                    >
                              {link.label}
                            </Button>
                          </WrapItem>
                        ))}
                      </Wrap>
                    )}
                    <Wrap spacing={'4'} align={'center'}>
                      <WrapItem>
                        <Button as={'a'}
                                href={buildGroupFeedUrl(group.key)}
                                target={'_blank'}
                                rel={'noopener'}
                                size={'xs'}
                                variant={'outline'}
                                fontWeight={'normal'}
                                leftIcon={<FiRss color={'#f26522'} />}
                                >
                          新着イベントをRSSで購読
                        </Button>
                      </WrapItem>
                      <WrapItem>
                        <HStack spacing={'2'}>
                          <Text fontSize={'xs'} color={'gray.500'}>このページをシェア</Text>
                          <ShareContextIconRow ctx={{
                                                 title: `${group.title} - 山梨のITコミュニティ | Yamanashi Developer Hub`,
                                                 url: buildGroupPageUrl(group.key),
                                               }}
                                               nativeShareLabel={'このページを共有'}
                                               />
                        </HStack>
                      </WrapItem>
                    </Wrap>
                  </Stack>
                </CardBody>
              </Card>
            </>
          )}
        </Stack>
        {!data.isLoading && !data.isNotFound && !data.errorMessage && group && (
          <Stack>
            <Box px={{base: '4', md: '0'}}>
              <Heading size={{base: 'sm', md: 'md'}} color={'gray.600'} mt={'4'} mb={'2'}>
                今後の開催予定
              </Heading>
            </Box>
            <Card variant={{base: 'unstyled', md: 'outline'}}
                  size={{base: 'sm', md: 'md'}}
                  p={'0'}
                  >
              <CardBody>
                <Stack spacing={EVENT_LIST_SPACING}>
                  {upcomingEvents.length === 0 ? (
                    <Box px={{base: '4', md: '0'}} py={{base: '2', md: '0'}}>
                      <Text fontSize={'sm'} color={'gray.600'}>
                        現在予定されているイベントはありません。
                      </Text>
                    </Box>
                  ) : (
                    upcomingEvents.map((event) => (
                      <AnimatedEventItem key={event.uid}>
                        <EventBody event={event}
                                   enableSummarizer
                                   summaryDescriptionYear={new Date(event.started_at).getFullYear()}
                                   />
                      </AnimatedEventItem>
                    ))
                  )}
                </Stack>
              </CardBody>
            </Card>

            <Box px={{base: '4', md: '0'}}>
              <Heading size={{base: 'sm', md: 'md'}} color={'gray.600'} mt={'4'} mb={'2'}>
                過去のイベント
              </Heading>
            </Box>
            <Card variant={{base: 'unstyled', md: 'outline'}}
                  size={{base: 'sm', md: 'md'}}
                  p={'0'}
                  >
              <CardBody>
                <Stack spacing={EVENT_LIST_SPACING}>
                  {pastEvents.length === 0 ? (
                    <EmptyEventBody />
                  ) : (
                    pastEvents.map((event) => (
                      <AnimatedEventItem key={event.uid}>
                        <EventBody event={event}
                                   enableSummarizer
                                   summaryDescriptionYear={new Date(event.started_at).getFullYear()}
                                   />
                      </AnimatedEventItem>
                    ))
                  )}
                </Stack>
              </CardBody>
            </Card>
            {data.hasMorePastEvents && (
              <Box px={{base: '4', md: '0'}}>
                <Button size={'sm'}
                        variant={'outline'}
                        w={'full'}
                        onClick={handleLoadMorePastEvents}
                        isLoading={data.isLoadingMorePastEvents}
                        loadingText={'読み込み中…'}
                        >
                  過去のイベントをもっと見る
                </Button>
                {data.loadMorePastEventsErrorMessage && (
                  <Text fontSize={'xs'} color={'impact.600'} mt={'2'} textAlign={'center'}>
                    読み込みに失敗しました({data.loadMorePastEventsErrorMessage})
                  </Text>
                )}
              </Box>
            )}
            {data.lastModified && (
              <FooterLastModified lastModified={data.lastModified} />
            )}

            <Box px={{base: '4', md: '0'}} mt={'4'}>
              <Heading size={{base: 'sm', md: 'md'}} color={'gray.600'} mb={'4'}>
                コミュニティ運営者の方へ
              </Heading>
              <WidgetPreviewCard title={'イベント一覧を埋め込む'}
                                 description={`${group.title} のイベント一覧をブログやWebサイトに埋め込めます。プレビューを確認して、下のスニペットをコピーしてお使いください。`}
                                 previewPath={buildListWidgetPath(group.key)}
                                 embedPath={buildListWidgetPath(group.key)}
                                 iframeTitle={`${group.title} イベント情報`}
                                 elementId={`yamanashi-hub-widget-events-${group.key}`}
                                 />
            </Box>
          </Stack>
        )}
        {data.isLoading && (
          <Card variant={{base: 'unstyled', md: 'outline'}}
                size={{base: 'sm', md: 'md'}}
                p={'0'}
                mt={'4'}
                >
            <CardBody>
              <SkeletonEventBody />
            </CardBody>
          </Card>
        )}
        <SiteFooter />
      </Container>
    </Box>
  );
}

export default Group;
