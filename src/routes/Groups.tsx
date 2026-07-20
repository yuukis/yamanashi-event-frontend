import { useEffect, useState } from 'react';
import { SiteHeader, SiteFooter, FooterLastModified, useFixedHeaderBoundary } from '../components/Site';
import { ErrorEventBody } from '../components/EventBody';
import { GroupCard, GroupCardSkeleton } from '../components/GroupCard';
import { StructuredData } from '../components/StructuredData';
import '../style.css';
import { Box, Container, Heading, Input, InputGroup, InputLeftElement, SimpleGrid, Stack, Text } from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';
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
      .catch((err: any) => {
        if (!cancelled) {
          setData({ ...initialGroupsState(), isLoading: false, errorMessage: err.message });
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredGroups = data.groups.filter((group) => matchesQuery(group, query));
  const { activeGroups, inactiveGroups } = splitGroupsByActivity(filteredGroups, data.activeGroupKeys);

  const structuredData = data.groups.length > 0 ? buildGroupsIndexJsonLd(data.groups) : null;

  return (
    <Box bg={'gray.100'} w={'100vw'} minH={'100vh'}>
      <StructuredData id={'structured-data-groups'} data={structuredData} />
      <SiteHeader />
      <Container maxW={'980px'} w={'100%'}
                 mt={'4'}
                 p={{base: '0', md: '4'}}
                 >
        <Stack spacing={'8'}>
          <Box>
            <Heading ref={headerBoundaryRef}
                     size={{base: 'sm', md: 'md'}}
                     ml={{base: '4', md: '0'}}
                     mb={'2'}
                     color={'gray.600'}
                     >
              コミュニティ一覧
            </Heading>
            <Text fontSize={{base: 'sm', md: 'md'}} ml={{base: '4', md: '0'}} mr={{base: '4', md: '0'}} color={'gray.600'}>
              山梨県内で活動するITコミュニティを紹介しています。気になるコミュニティを見つけたら、ページから過去の活動やイベント情報を確認できます。
            </Text>
          </Box>

          {data.errorMessage ? (
            <Box ml={{base: '4', md: '0'}} mr={{base: '4', md: '0'}}>
              <ErrorEventBody message={data.errorMessage} />
            </Box>
          ) : (
            <Stack spacing={'8'}>
              <Box ml={{base: '4', md: '0'}} mr={{base: '4', md: '0'}}>
                <InputGroup>
                  <InputLeftElement pointerEvents={'none'}>
                    <SearchIcon color={'gray.400'} />
                  </InputLeftElement>
                  <Input bg={'white'}
                         placeholder={'コミュニティ名で検索'}
                         value={query}
                         onChange={(e) => setQuery(e.target.value)}
                         aria-label={'コミュニティ名で検索'}
                         />
                </InputGroup>
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
                    <Box>
                      <Heading size={{base: 'sm', md: 'md'}} ml={{base: '4', md: '0'}} mb={'4'} color={'gray.600'}>
                        イベント情報のあるコミュニティ
                      </Heading>
                      <SimpleGrid columns={{base: 1, sm: 2, md: 3}} spacing={'4'} ml={{base: '4', md: '0'}} mr={{base: '4', md: '0'}}>
                        {activeGroups.map((group) => (
                          <GroupCard key={group.key} group={group} />
                        ))}
                      </SimpleGrid>
                    </Box>
                  )}
                  {inactiveGroups.length > 0 && (
                    <Box>
                      <Heading size={{base: 'sm', md: 'md'}} ml={{base: '4', md: '0'}} mb={'4'} color={'gray.600'}>
                        その他のコミュニティ
                      </Heading>
                      <SimpleGrid columns={{base: 1, sm: 2, md: 3}} spacing={'4'} ml={{base: '4', md: '0'}} mr={{base: '4', md: '0'}}>
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
