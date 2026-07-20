import { useEffect, useState } from 'react';
import { useParams } from "react-router-dom";
import { SiteHeader, SiteFooter, FooterLastModified, useFixedHeaderBoundary } from '../components/Site';
import { EventBody, SkeletonEventBody, EmptyEventBody, ErrorEventBody } from '../components/EventBody';
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
import { ExternalLinkIcon } from '@chakra-ui/icons';
import { People } from '@chakra-icons/bootstrap';
import { sortByStartedAtAsc, sortByStartedAtDesc } from '../utils/eventSort';
import { enrichEventsWithGroups, isVisibleEvent, isFutureEvent, isPastEvent } from '../utils/eventGroups';
import { fetchGroup, fetchGroupEvents } from '../utils/api';
import { buildGroupPageUrl, buildGroupExternalLinks } from '../utils/groupPage';
import { buildGroupPageJsonLd } from '../utils/structuredData';
import { buildListWidgetPath } from '../utils/widgetPaths';
import { htmlToParagraphs } from '../utils/htmlText';
import type { ApiGroupDetail, EventWithGroup } from '../types/events';

const PAST_EVENTS_INITIAL_COUNT = 10;

type GroupState = {
  isLoading: boolean;
  group: ApiGroupDetail | null;
  events: EventWithGroup[];
  lastModified: string | null;
  errorMessage: string;
  isNotFound: boolean;
};

function Group() {
  const { groupKey } = useParams();

  const [data, setData] = useState<GroupState>({
    isLoading: true,
    group: null,
    events: [],
    lastModified: null,
    errorMessage: '',
    isNotFound: false,
  });
  const [isPastExpanded, setIsPastExpanded] = useState(false);

  const headerBoundaryRef = useFixedHeaderBoundary<HTMLDivElement>();

  useEffect(() => {
    setData({
      isLoading: true,
      group: null,
      events: [],
      lastModified: null,
      errorMessage: '',
      isNotFound: false,
    });
    setIsPastExpanded(false);

    if (!groupKey) {
      return;
    }

    let cancelled = false;
    const getData = async () => {
      try {
        const [group, eventsResponse] = await Promise.all([
          fetchGroup(groupKey),
          fetchGroupEvents(groupKey),
        ]);
        if (cancelled) {
          return;
        }
        setData({
          isLoading: false,
          group,
          events: enrichEventsWithGroups(eventsResponse.events, [group]).filter(isVisibleEvent),
          lastModified: eventsResponse.lastModified,
          errorMessage: '',
          isNotFound: false,
        });
      } catch (err) {
        if (cancelled) {
          return;
        }
        const status = (err as { response?: { status?: number } })?.response?.status;
        const isNotFound = status === 404;
        setData({
          isLoading: false,
          group: null,
          events: [],
          lastModified: null,
          errorMessage: isNotFound ? '' : (err instanceof Error ? err.message : String(err)),
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
  const upcomingEvents = data.events.filter(isFutureEvent).sort(sortByStartedAtAsc);
  const pastEvents = data.events.filter(isPastEvent).sort(sortByStartedAtDesc);
  const visiblePastEvents = isPastExpanded ? pastEvents : pastEvents.slice(0, PAST_EVENTS_INITIAL_COUNT);

  const firstEventYear = data.events.length > 0
    ? Math.min(...data.events.map((event) => new Date(event.started_at).getFullYear()))
    : null;
  const descriptionParagraphs = group?.description ? htmlToParagraphs(group.description) : [];
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
                  <Stack direction={{base: 'column', md: 'row'}} spacing={'6'}>
                    <Box boxSize={'96px'}
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
                    <Stack flex={'1'} spacing={'3'} minW={'0'}>
                      <Box>
                        <Heading as={'h1'} size={{base: 'md', md: 'lg'}} color={'primary.800'}>
                          {group.title}
                        </Heading>
                        {group.sub_title && (
                          <Text fontSize={'sm'} color={'gray.600'} mt={'1'}>
                            {group.sub_title}
                          </Text>
                        )}
                      </Box>
                      <Wrap spacing={'4'} color={'gray.600'} fontSize={'sm'}>
                        {data.events.length > 0 && (
                          <WrapItem>開催イベント {data.events.length}件</WrapItem>
                        )}
                        {firstEventYear && (
                          <WrapItem>{firstEventYear}年から活動</WrapItem>
                        )}
                        {(group.member_users_count ?? 0) > 0 && (
                          <WrapItem>メンバー {group.member_users_count}人</WrapItem>
                        )}
                      </Wrap>
                      {descriptionParagraphs.map((paragraph, index) => (
                        <Text key={index}
                              fontSize={'sm'}
                              color={'gray.700'}
                              lineHeight={'1.8'}
                              whiteSpace={'pre-line'}
                              >
                          {paragraph}
                        </Text>
                      ))}
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
                      <HStack spacing={'2'}>
                        <Text fontSize={'xs'} color={'gray.500'}>このページをシェア</Text>
                        <ShareContextIconRow ctx={{
                                               title: `${group.title} - 山梨のITコミュニティ | Yamanashi Developer Hub`,
                                               url: buildGroupPageUrl(group.key),
                                             }}
                                             nativeShareLabel={'このページを共有'}
                                             />
                      </HStack>
                    </Stack>
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
                <Stack spacing={'8'}>
                  {upcomingEvents.length === 0 ? (
                    <Box px={{base: '4', md: '0'}} py={{base: '2', md: '0'}}>
                      <Text fontSize={'sm'} color={'gray.600'}>
                        現在予定されているイベントはありません。
                      </Text>
                    </Box>
                  ) : (
                    upcomingEvents.map((event) => (
                      <EventBody key={event.uid}
                                 event={event}
                                 enableSummarizer
                                 summaryDescriptionYear={new Date(event.started_at).getFullYear()}
                                 />
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
                <Stack spacing={'8'}>
                  {pastEvents.length === 0 ? (
                    <EmptyEventBody />
                  ) : (
                    visiblePastEvents.map((event) => (
                      <EventBody key={event.uid}
                                 event={event}
                                 enableSummarizer
                                 summaryDescriptionYear={new Date(event.started_at).getFullYear()}
                                 />
                    ))
                  )}
                </Stack>
              </CardBody>
            </Card>
            {!isPastExpanded && pastEvents.length > PAST_EVENTS_INITIAL_COUNT && (
              <Box px={{base: '4', md: '0'}}>
                <Button size={'sm'}
                        variant={'outline'}
                        w={'full'}
                        onClick={() => setIsPastExpanded(true)}
                        >
                  過去のイベントをすべて表示({pastEvents.length}件)
                </Button>
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
