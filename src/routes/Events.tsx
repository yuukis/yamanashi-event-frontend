import { useEffect, useState } from 'react';
import { SiteHeader, SiteFooter, useFixedHeaderBoundary } from '../components/Site';
import { ActivityHeatmap } from '../components/ActivityHeatmap';
import { YearSummaryCard } from '../components/YearSummaryCard';
import { ErrorEventBody } from '../components/EventBody';
import '../style.css';
import { Container, Box, Stack, Heading, Text, SimpleGrid, Skeleton } from '@chakra-ui/react';
import { fetchEventsSummary } from '../utils/api';
import { sortYearsDescending, getMaxEventCount } from '../utils/eventsSummary';
import type { ApiEventsSummary } from '../types/events';

const SKELETON_CARD_COUNT = 8;

type EventsState = {
  isLoading: boolean;
  summary: ApiEventsSummary | null;
  errorMessage: string;
};

function Events() {
  const [data, setData] = useState<EventsState>({
    isLoading: true,
    summary: null,
    errorMessage: '',
  });

  const headerBoundaryRef = useFixedHeaderBoundary<HTMLHeadingElement>();

  document.title = `イベントアーカイブ - Yamanashi Developer Hub`;

  useEffect(() => {
    let cancelled = false;

    fetchEventsSummary()
      .then((summary) => {
        if (!cancelled) {
          setData({ isLoading: false, summary, errorMessage: '' });
        }
      })
      .catch((err: any) => {
        if (!cancelled) {
          setData({ isLoading: false, summary: null, errorMessage: err.message });
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const years = data.summary ? sortYearsDescending(data.summary.years) : [];
  const maxEventCount = data.summary ? getMaxEventCount(data.summary.years) : 0;

  return (
    <Box bg={'gray.100'} w={'100vw'} minH={'100vh'}>
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
              イベントアーカイブ
            </Heading>
            <Text fontSize={{base: 'sm', md: 'md'}} ml={{base: '4', md: '0'}} mr={{base: '4', md: '0'}} color={'gray.600'}>
              2010年から現在まで、山梨県内で開催されたIT勉強会の記録を振り返れます。
            </Text>
          </Box>

          <Box bg={'white'}
               borderRadius={'md'}
               border={{base: 'none', md: '1px solid'}}
               borderColor={'gray.200'}
               p={{base: '4', md: '6'}}
               >
            <Heading size={'sm'} mb={'4'} color={'gray.600'}>
              活動ヒートマップ
            </Heading>
            {data.errorMessage ? (
              <ErrorEventBody message={data.errorMessage} />
            ) : (
              <ActivityHeatmap heatmap={data.summary?.heatmap ?? []} isLoading={data.isLoading} />
            )}
          </Box>

          <Box>
            <Heading size={'sm'} mb={'4'} ml={{base: '4', md: '0'}} color={'gray.600'}>
              年から探す
            </Heading>
            {data.errorMessage ? (
              <Box ml={{base: '4', md: '0'}} mr={{base: '4', md: '0'}}>
                <ErrorEventBody message={data.errorMessage} />
              </Box>
            ) : (
              <SimpleGrid columns={{base: 2, sm: 3, md: 4}}
                          spacing={'3'}
                          ml={{base: '4', md: '0'}}
                          mr={{base: '4', md: '0'}}
                          >
                {data.isLoading
                  ? Array.from({length: SKELETON_CARD_COUNT}).map((_, i) => (
                      <Skeleton key={i} h={'96px'} borderRadius={'md'} />
                    ))
                  : years.map((year) => (
                      <YearSummaryCard key={year.year} summary={year} maxEventCount={maxEventCount} />
                    ))
                }
              </SimpleGrid>
            )}
          </Box>
        </Stack>
        <SiteFooter />
      </Container>
    </Box>
  );
}

export default Events;
