import { useEffect, useState } from 'react';
import { SiteHeader, SiteFooter, FooterLastModified, useFixedHeaderBoundary } from '../components/Site';
import { PageBreadcrumb } from '../components/PageBreadcrumb';
import { YearSummaryCard, YearSummaryCardSkeleton } from '../components/YearSummaryCard';
import { ErrorEventBody } from '../components/EventBody';
import { StructuredData } from '../components/StructuredData';
import '../style.css';
import { Container, Box, Stack, Heading, Text } from '@chakra-ui/react';
import { fetchEventsSummary } from '../utils/api';
import { sortYearsAscending, buildHeatmapGrid, getMaxHeatmapCount } from '../utils/eventsSummary';
import { buildYearArchiveJsonLd } from '../utils/structuredData';
import type { ApiEventsSummary, ApiHeatmapBucket } from '../types/events';

const SKELETON_ROW_COUNT = 8;
const SLOW_LOADING_HINT_DELAY_MS = 5000;

type EventsState = {
  isLoading: boolean;
  summary: ApiEventsSummary | null;
  lastModified: string | null;
  errorMessage: string;
};

function Events() {
  const [data, setData] = useState<EventsState>({
    isLoading: true,
    summary: null,
    lastModified: null,
    errorMessage: '',
  });
  const [isSlowLoading, setIsSlowLoading] = useState(false);

  const headerBoundaryRef = useFixedHeaderBoundary<HTMLHeadingElement>();

  document.title = `イベントアーカイブ - Yamanashi Developer Hub`;

  useEffect(() => {
    let cancelled = false;
    setIsSlowLoading(false);

    const slowLoadingTimer = window.setTimeout(() => {
      if (!cancelled) {
        setIsSlowLoading(true);
      }
    }, SLOW_LOADING_HINT_DELAY_MS);

    fetchEventsSummary()
      .then(({ summary, lastModified }) => {
        if (!cancelled) {
          setData({ isLoading: false, summary, lastModified, errorMessage: '' });
        }
      })
      .catch((err: any) => {
        if (!cancelled) {
          setData({ isLoading: false, summary: null, lastModified: null, errorMessage: err.message });
        }
      })
      .finally(() => {
        window.clearTimeout(slowLoadingTimer);
      });

    return () => {
      cancelled = true;
      window.clearTimeout(slowLoadingTimer);
    };
  }, []);

  const years = data.summary ? sortYearsAscending(data.summary.years) : [];
  const heatmap = data.summary?.heatmap ?? [];
  const maxMonthCount = getMaxHeatmapCount(heatmap);
  const monthsByYear = new Map(buildHeatmapGrid(heatmap).map((row) => [row.year, row.months]));
  const emptyMonths: ApiHeatmapBucket[] = [];

  const structuredData = years.length > 0
    ? buildYearArchiveJsonLd(years.map((year) => year.year))
    : null;

  return (
    <Box bg={'gray.100'} w={'100vw'} minH={'100vh'}>
      <StructuredData id={'structured-data-events'} data={structuredData} />
      <SiteHeader />
      <PageBreadcrumb items={[{ label: 'イベントアーカイブ', href: '/events' }]} />
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
            <Stack spacing={'3'}>
              {data.isLoading && isSlowLoading && (
                <Text fontSize={'xs'}
                      color={'gray.500'}
                      textAlign={'center'}
                      ml={{base: '4', md: '0'}}
                      mr={{base: '4', md: '0'}}
                      >
                  読み込みに時間がかかっています。もうしばらくお待ちください。
                </Text>
              )}
              <Stack spacing={'3'}
                     ml={{base: '4', md: '0'}}
                     mr={{base: '4', md: '0'}}
                     >
                {data.isLoading
                  ? Array.from({length: SKELETON_ROW_COUNT}).map((_, i) => (
                      <YearSummaryCardSkeleton key={i} />
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
              {data.lastModified &&
                <FooterLastModified lastModified={data.lastModified} />
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
