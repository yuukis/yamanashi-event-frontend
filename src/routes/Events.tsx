import { useEffect, useState } from 'react';
import { SiteHeader, SiteFooter, FooterLastModified, useFixedHeaderBoundary } from '../components/Site';
import { PageBreadcrumb } from '../components/PageBreadcrumb';
import { YearSummaryCard, YearSummaryCardSkeleton } from '../components/YearSummaryCard';
import { ErrorEventBody } from '../components/EventBody';
import { StructuredData } from '../components/StructuredData';
import '../style.css';
import { Container, Box, Stack, Heading, Text, Flex } from '@chakra-ui/react';
import { fetchEventsSummary } from '../utils/api';
import { sortYearsAscending, buildHeatmapGrid, getMaxHeatmapCount } from '../utils/eventsSummary';
import { buildYearArchiveJsonLd } from '../utils/structuredData';
import type { ApiEventsSummary, ApiHeatmapBucket } from '../types/events';

const SKELETON_ROW_COUNT = 8;
const SLOW_LOADING_HINT_DELAY_MS = 5000;
const ARCHIVE_HERO_BAR_HEIGHTS = [24, 42, 30, 64, 48, 78, 58, 86, 52, 70, 38, 60];

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
      .catch((err: unknown) => {
        if (!cancelled) {
          const errorMessage = err instanceof Error ? err.message : String(err);
          setData({ isLoading: false, summary: null, lastModified: null, errorMessage });
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
    <Box className={'section-bg-pattern events-archive-page'} w={'100vw'} minH={'100vh'}>
      <StructuredData id={'structured-data-events'} data={structuredData} />
      <SiteHeader />
      <PageBreadcrumb items={[{ label: 'イベントアーカイブ', href: '/events' }]} />
      <Container maxW={'980px'} w={'100%'}
                 mt={'4'}
                 p={{base: '0', md: '4'}}
                 >
        <Stack spacing={'8'}>
          <Box className={'events-archive-hero'}>
            <Box className={'events-archive-hero-copy'}>
              <Text className={'events-archive-eyebrow'}>EVENT ARCHIVE</Text>
              <Heading ref={headerBoundaryRef}
                       as={'h1'}
                       className={'events-archive-title'}
                       >
                山梨のITイベントを、<br />年ごとにたどる。
              </Heading>
              <Text className={'events-archive-description'}>
                2010年から現在まで、山梨県内で開催されたIT勉強会の記録を振り返れます。気になる年を選んで、その頃のイベントやコミュニティをのぞいてみましょう。
              </Text>
              <Text className={'events-archive-hint'}>年のカードを選ぶと、その年のイベント一覧へ移動します。</Text>
            </Box>
            <Box className={'events-archive-hero-visual'} aria-hidden={'true'}>
              <Flex className={'events-archive-range'} align={'baseline'} justify={'space-between'}>
                <Text>2010</Text>
                <Text>→</Text>
                <Text>NOW</Text>
              </Flex>
              <Flex className={'events-archive-hero-bars'} align={'flex-end'}>
                {ARCHIVE_HERO_BAR_HEIGHTS.map((height, index) => (
                  <Box key={index} h={`${height}%`} />
                ))}
              </Flex>
              <Flex className={'events-archive-hero-communities'}>
                <Box /><Box /><Box /><Box /><Box />
              </Flex>
            </Box>
          </Box>

          <Box as={'section'} className={'events-archive-legend'} aria-label={'カードの見方'}>
            <Box><Text>YEAR</Text><Text>年を選ぶ</Text></Box>
            <Box><Text>COMMUNITIES</Text><Text>その年に活動したコミュニティ</Text></Box>
            <Box><Text>MONTHLY ACTIVITY</Text><Text>月ごとの開催傾向</Text></Box>
          </Box>

          {data.errorMessage ? (
            <Box ml={{base: '4', md: '0'}} mr={{base: '4', md: '0'}}>
              <ErrorEventBody message={data.errorMessage} />
            </Box>
          ) : (
            <Stack spacing={'3'} className={'events-archive-results'}>
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
                     className={'events-archive-list'}
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
