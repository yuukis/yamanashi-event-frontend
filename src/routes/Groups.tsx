import { useEffect, useMemo, useState } from 'react';
import { SiteHeader, SiteFooter, FooterLastModified, useFixedHeaderBoundary } from '../components/Site';
import { PageBreadcrumb } from '../components/PageBreadcrumb';
import { ErrorEventBody } from '../components/EventBody';
import { GroupCard, GroupCardSkeleton } from '../components/GroupCard';
import { StructuredData } from '../components/StructuredData';
import '../style.css';
import { Box, Container, Heading, HStack, Image, Input, InputGroup, InputLeftElement, SimpleGrid, Stack, Text } from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';
import { People } from '@chakra-icons/bootstrap';
import { fetchGroups, fetchEvents, GROUPS_SUMMARY_FIELDS } from '../utils/api';
import { collectActiveGroupKeys, splitGroupsByActivity } from '../utils/groupActivity';
import { buildGroupsIndexJsonLd } from '../utils/structuredData';
import type { ApiGroup } from '../types/events';

const SKELETON_COUNT = 6;

type GroupsState = {
  isLoading: boolean;
  groups: ApiGroup[];
  activeGroupKeys: Set<string>;
  lastModified: string | null;
  errorMessage: string;
};

function initialGroupsState(): GroupsState {
  return {
    isLoading: true,
    groups: [],
    activeGroupKeys: new Set(),
    lastModified: null,
    errorMessage: '',
  };
}

function matchesQuery(group: ApiGroup, query: string): boolean {
  if (!query) {
    return true;
  }
  const haystack = `${group.title} ${group.sub_title ?? ''}`.toLowerCase();
  return haystack.includes(query.toLowerCase());
}

function shuffledGroups(groups: ApiGroup[]): ApiGroup[] {
  const shuffled = [...groups];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function Groups() {
  const [data, setData] = useState<GroupsState>(initialGroupsState);
  const [query, setQuery] = useState('');

  const headerBoundaryRef = useFixedHeaderBoundary<HTMLHeadingElement>();

  document.title = 'コミュニティ一覧 - Yamanashi Developer Hub';

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      fetchGroups(GROUPS_SUMMARY_FIELDS),
      fetchEvents('group_key'),
    ])
      .then(([groups, eventsRes]) => {
        if (cancelled) {
          return;
        }
        setData({
          isLoading: false,
          groups,
          activeGroupKeys: collectActiveGroupKeys(eventsRes.events),
          lastModified: eventsRes.lastModified,
          errorMessage: '',
        });
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const errorMessage = err instanceof Error ? err.message : String(err);
          setData({ ...initialGroupsState(), isLoading: false, errorMessage });
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const { activeGroups: allActiveGroups, inactiveGroups: allInactiveGroups } = splitGroupsByActivity(data.groups, data.activeGroupKeys);
  const activeGroups = allActiveGroups.filter((group) => matchesQuery(group, query));
  const inactiveGroups = allInactiveGroups.filter((group) => matchesQuery(group, query));
  const visibleGroupCount = activeGroups.length + inactiveGroups.length;
  const heroGroups = useMemo(() => {
    const { activeGroups: heroActiveGroups, inactiveGroups: heroInactiveGroups } = splitGroupsByActivity(data.groups, data.activeGroupKeys);
    return [...shuffledGroups(heroActiveGroups), ...shuffledGroups(heroInactiveGroups)].slice(0, 6);
  }, [data.groups, data.activeGroupKeys]);

  // 構造化データは検索欄の入力(一時的なUI状態)に左右されず、ページの
  // 正規のコミュニティ一覧を表す必要があるため、フィルタ前の全件から
  // 表示と同じ順序(アクティブ→その他)で組み立てる。
  const structuredData = data.groups.length > 0 ? buildGroupsIndexJsonLd([...allActiveGroups, ...allInactiveGroups]) : null;

  return (
    <Box className={'section-bg-pattern groups-page'} w={'100vw'} minH={'100vh'}>
      <StructuredData id={'structured-data-groups'} data={structuredData} />
      <SiteHeader />
      <PageBreadcrumb items={[{ label: 'コミュニティ一覧', href: '/groups' }]} />
      <Container maxW={'980px'} w={'100%'}
                 mt={'4'}
                 p={{base: '0', md: '4'}}
                 >
        <Stack spacing={{base: '7', md: '10'}}>
          <Box className={'groups-hero'} mx={{base: '4', md: '0'}}>
            <Box className={'groups-hero-copy'}>
              <Text className={'groups-eyebrow'}>COMMUNITY DIRECTORY</Text>
              <Heading ref={headerBoundaryRef}
                       as={'h1'}
                       className={'groups-hero-title'}
                       size={{base: 'xl', md: '2xl'}}
                       >
                山梨で、<Box as={'span'}>仲間とつながる。</Box>
              </Heading>
              <Text className={'groups-hero-description'} fontSize={{base: 'sm', md: 'md'}}>
                山梨県内で活動するITコミュニティを紹介しています。興味のある分野や新しい仲間を見つけて、これまでの活動や次のイベントをのぞいてみませんか。
              </Text>
              {!data.isLoading && !data.errorMessage && (
                <HStack className={'groups-hero-stats'} spacing={'2'} flexWrap={'wrap'}>
                  <Text><Box as={'strong'}>{data.groups.length}</Box> コミュニティ</Text>
                </HStack>
              )}
            </Box>

            <Box className={'groups-orbit'} aria-hidden={'true'}>
              <Box className={'groups-orbit-line groups-orbit-line-outer'} />
              <Box className={'groups-orbit-line groups-orbit-line-inner'} />
              <Box className={'groups-orbit-center'}>
                <People />
              </Box>
              {heroGroups.map((group, index) => (
                <Box className={`groups-orbit-avatar groups-orbit-avatar-${index + 1}`} key={group.key}>
                  {group.image_url ? (
                    <Image src={group.image_url} alt={''} />
                  ) : (
                    <Text>{group.title.slice(0, 1)}</Text>
                  )}
                </Box>
              ))}
            </Box>
          </Box>

          {data.errorMessage ? (
            <Box ml={{base: '4', md: '0'}} mr={{base: '4', md: '0'}}>
              <ErrorEventBody message={data.errorMessage} />
            </Box>
          ) : (
            <Stack spacing={{base: '7', md: '10'}}>
              <Box className={'groups-search-panel'} mx={{base: '4', md: '0'}}>
                <Box>
                  <Text className={'groups-eyebrow'} mb={'1'}>FIND YOUR COMMUNITY</Text>
                  <Heading as={'h2'} size={{base: 'sm', md: 'md'}} color={'gray.700'}>
                    気になるコミュニティを探す
                  </Heading>
                </Box>
                <InputGroup>
                  <InputLeftElement pointerEvents={'none'}>
                    <SearchIcon color={'primary.700'} />
                  </InputLeftElement>
                  <Input bg={'white'}
                         placeholder={'コミュニティ名で検索'}
                         value={query}
                         onChange={(e) => setQuery(e.target.value)}
                         aria-label={'コミュニティ名で検索'}
                         />
                </InputGroup>
                {!data.isLoading && (
                  <Text className={'groups-search-count'} aria-live={'polite'}>
                    {query ? `${visibleGroupCount}件見つかりました` : `${data.groups.length}件を掲載中`}
                  </Text>
                )}
              </Box>

              {data.isLoading ? (
                <Stack spacing={'8'} ml={{base: '4', md: '0'}} mr={{base: '4', md: '0'}}>
                  <SimpleGrid columns={{base: 1, sm: 2, md: 3}} spacing={'4'}>
                    {Array.from({length: SKELETON_COUNT}).map((_, i) => (
                      <GroupCardSkeleton key={i} />
                    ))}
                  </SimpleGrid>
                </Stack>
              ) : activeGroups.length === 0 && inactiveGroups.length === 0 ? (
                <Box ml={{base: '4', md: '0'}} mr={{base: '4', md: '0'}}>
                  <Text fontSize={'sm'} color={'gray.600'} textAlign={'center'} py={'8'}>
                    該当するコミュニティが見つかりませんでした。
                  </Text>
                </Box>
              ) : (
                <Stack spacing={'8'}>
                  {activeGroups.length > 0 && (
                    <Box className={'groups-section groups-section-active'}>
                      <HStack className={'groups-section-heading'} mx={{base: '4', md: '0'}} mb={'4'}>
                        <Box>
                          <Text className={'groups-eyebrow'}>UPCOMING &amp; RECENT</Text>
                          <Heading as={'h2'} size={{base: 'md', md: 'lg'}} color={'gray.700'}>
                            最近イベントを開催したコミュニティ
                          </Heading>
                          <Text className={'groups-section-description'}>
                            最近開催されたイベントの情報があるコミュニティです。
                          </Text>
                        </Box>
                        <Text className={'groups-count-badge'}>{activeGroups.length}</Text>
                      </HStack>
                      <SimpleGrid columns={{base: 1, sm: 2, md: 3}} spacing={{base: '3', md: '4'}} mx={{base: '4', md: '0'}}>
                        {activeGroups.map((group) => (
                          <GroupCard key={group.key} group={group} isActive />
                        ))}
                      </SimpleGrid>
                    </Box>
                  )}
                  {inactiveGroups.length > 0 && (
                    <Box className={'groups-section'}>
                      <HStack className={'groups-section-heading'} mx={{base: '4', md: '0'}} mb={'4'}>
                        <Box>
                          <Text className={'groups-eyebrow'}>MORE COMMUNITIES</Text>
                          <Heading as={'h2'} size={{base: 'md', md: 'lg'}} color={'gray.700'}>
                            このほかのコミュニティ
                          </Heading>
                          <Text className={'groups-section-description'}>
                            各コミュニティのページから、これまでのイベント情報をご覧いただけます。
                          </Text>
                        </Box>
                        <Text className={'groups-count-badge groups-count-badge-muted'}>{inactiveGroups.length}</Text>
                      </HStack>
                      <SimpleGrid columns={{base: 1, sm: 2, md: 3}} spacing={{base: '3', md: '4'}} mx={{base: '4', md: '0'}}>
                        {inactiveGroups.map((group) => (
                          <GroupCard key={group.key} group={group} />
                        ))}
                      </SimpleGrid>
                    </Box>
                  )}
                </Stack>
              )}
              {data.lastModified &&
                <Box mt={'-5'}>
                  <FooterLastModified lastModified={data.lastModified} />
                </Box>
              }
            </Stack>
          )}
        </Stack>
        <SiteFooter />
      </Container>
    </Box>
  );
}

export default Groups;
