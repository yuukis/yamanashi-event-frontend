import { useEffect, useState } from 'react';
import { SiteHeader, SiteFooter, useFixedHeaderBoundary } from '../components/Site';
import { YearSummaryCard } from '../components/YearSummaryCard';
import { ErrorEventBody } from '../components/EventBody';
import '../style.css';
import { Container, Box, Stack, Heading, Text, Skeleton } from '@chakra-ui/react';
import { fetchEventsSummary } from '../utils/api';
import { sortYearsAscending, buildHeatmapGrid, getMaxHeatmapCount } from '../utils/eventsSummary';
import type { ApiEventsSummary, ApiHeatmapBucket } from '../types/events';

const SKELETON_ROW_COUNT = 8;

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

  const years = data.summary ? sortYearsAscending(data.summary.years) : [];
  const heatmap = data.summary?.heatmap ?? [];
  // カード内バーチャートの高さは全期間で共通のスケールにするため、
  // 表示年に関わらず全体の最大値を基準にする。
  const maxMonthCount = getMaxHeatmapCount(heatmap);
  const monthsByYear = new Map(buildHeatmapGrid(heatmap).map((row) => [row.year, row.months]));
  const emptyMonths: ApiHeatmapBucket[] = [];

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
              2010年から現在まで、山梨県内で開催されたIT勉強会の記録を振り返れます。各カードの棒グラフは月ごとの開催件数で、全年で共通のスケールです。
            </Text>
          </Box>

          {data.errorMessage ? (
            <Box ml={{base: '4', md: '0'}} mr={{base: '4', md: '0'}}>
              <ErrorEventBody message={data.errorMessage} />
            </Box>
          ) : (
            <Stack spacing={'3'}
                   ml={{base: '4', md: '0'}}
                   mr={{base: '4', md: '0'}}
                   >
              {data.isLoading
                ? Array.from({length: SKELETON_ROW_COUNT}).map((_, i) => (
                    <Skeleton key={i} h={'76px'} borderRadius={'md'} />
                  ))
                : years.map((year) => (
                    <YearSummaryCard key={year.year}
                                      summary={year}
                                      months={monthsByYear.get(year.year) ?? emptyMonths}
                                      maxMonthCount={maxMonthCount}
                                      />
                  ))
              }
            </Stack>
          )}
        </Stack>
        <SiteFooter />
      </Container>
    </Box>
  );
}

export default Events;
