import { LinkBox, LinkOverlay, Box, Flex, Tooltip, Image, Center, Text, Skeleton, SkeletonCircle } from '@chakra-ui/react';
import { People } from '@chakra-icons/bootstrap';
import type { ApiHeatmapBucket, ApiYearSummary } from '../types/events';
import { formatMonthCountTooltip } from '../utils/eventsSummary';

const AVATAR_SIZE = { base: '24px', md: '30px', lg: '36px' };
const CHART_HEIGHT = { base: '32px', md: '32px', lg: '40px' };
const BAR_WIDTH = { base: '4px', md: '4px', lg: '5px' };
const BAR_GAP = '1px';
const ROW_GAP = {base: '2', md: '4', lg: '6'};
const ROW_PX = {base: '3', md: '5', lg: '6'};
const ROW_PY = {base: '3', md: '3', lg: '4'};
// 実データが届く前の見た目の目安として、それらしい高さのばらつきを
// 持たせた固定のダミー系列(12ヶ月分)。データの意味は持たない。
const SKELETON_BAR_HEIGHTS = [35, 55, 40, 70, 50, 85, 60, 45, 65, 30, 50, 40];
const SKELETON_AVATAR_COUNT = 5;

type YearSummaryCardProps = {
  summary: ApiYearSummary;
  months: ApiHeatmapBucket[];
  maxMonthCount: number;
};

export function YearSummaryCard({ summary, months, maxMonthCount }: YearSummaryCardProps) {
  return (
    <LinkBox as={'article'}
             display={'flex'}
             flexWrap={'nowrap'}
             alignItems={'center'}
             gap={ROW_GAP}
             borderRadius={'md'}
             border={'1px solid'}
             borderColor={'gray.200'}
             bg={'white'}
             px={ROW_PX}
             py={ROW_PY}
             _hover={{ borderColor: 'gray.300', shadow: 'sm' }}
             transition={'box-shadow 120ms ease-out, border-color 120ms ease-out'}
             >
      <Box flexShrink={0}>
        <LinkOverlay href={`/events/${summary.year}`}>
          <Text fontSize={{base: '2xl', md: '3xl', lg: '4xl'}} fontWeight={'100'} lineHeight={1} color={'gray.700'} whiteSpace={'nowrap'}>
            {summary.year}
          </Text>
        </LinkOverlay>
      </Box>

      <Box alignSelf={'stretch'} w={'1px'} bg={'gray.100'} flexShrink={0} />

      <Flex flex={'1'}
            minW={'0'}
            align={'center'}
            gap={{base: '1', md: '2', lg: '3'}}
            wrap={'wrap'}
            >
        {summary.groups.length > 0 ? (
          summary.groups.map((group) => (
            <Tooltip key={group.key} label={group.name ?? group.key} hasArrow fontSize={'xs'}>
              <Center position={'relative'}
                      boxSize={AVATAR_SIZE}
                      borderRadius={'full'}
                      bg={'gray.100'}
                      overflow={'hidden'}
                      flexShrink={0}
                      >
                {group.image_url ? (
                  <Image src={group.image_url} boxSize={'100%'} fit={'cover'} alt={group.name ?? group.key} />
                ) : (
                  <People color={'gray.400'} />
                )}
              </Center>
            </Tooltip>
          ))
        ) : (
          <Text fontSize={'xs'} color={'gray.400'} whiteSpace={'nowrap'}>活動記録なし</Text>
        )}
      </Flex>

      <Box alignSelf={'stretch'} w={'1px'} bg={'gray.100'} flexShrink={0} />

      <Flex flexShrink={0} h={CHART_HEIGHT} align={'flex-end'} gap={BAR_GAP}>
        {months.map((bucket) => {
          const heightPct = maxMonthCount > 0
            ? Math.max((bucket.count / maxMonthCount) * 100, bucket.count > 0 ? 8 : 0)
            : 0;
          return (
            <Tooltip key={bucket.period} label={formatMonthCountTooltip(bucket.period, bucket.count)} hasArrow fontSize={'xs'} openDelay={150}>
              <Box position={'relative'}
                   w={BAR_WIDTH}
                   h={`${heightPct}%`}
                   minH={'1px'}
                   borderRadius={'1px 1px 0 0'}
                   bg={bucket.count > 0 ? 'primary.300' : 'gray.100'}
                   _hover={{ bg: bucket.count > 0 ? 'primary.500' : 'gray.300' }}
                   />
            </Tooltip>
          );
        })}
      </Flex>
    </LinkBox>
  );
}

// YearSummaryCard と同じ寸法・配置のプレースホルダー。データ取得中に
// レイアウトのがたつきを出さず、何が読み込まれつつあるかが伝わるように
// 実際のカードの形(年・アイコン列・棒グラフ)をなぞる。
export function YearSummaryCardSkeleton() {
  return (
    <Flex alignItems={'center'}
          gap={ROW_GAP}
          borderRadius={'md'}
          border={'1px solid'}
          borderColor={'gray.200'}
          bg={'white'}
          px={ROW_PX}
          py={ROW_PY}
          >
      <Skeleton flexShrink={0}
                h={{base: '7', md: '8', lg: '9'}}
                w={{base: '10', md: '12', lg: '14'}}
                borderRadius={'sm'}
                />

      <Box alignSelf={'stretch'} w={'1px'} bg={'gray.100'} flexShrink={0} />

      <Flex flex={'1'} minW={'0'} align={'center'} gap={{base: '1', md: '2', lg: '3'}} overflow={'hidden'}>
        {Array.from({length: SKELETON_AVATAR_COUNT}).map((_, i) => (
          <SkeletonCircle key={i} size={AVATAR_SIZE} flexShrink={0} />
        ))}
      </Flex>

      <Box alignSelf={'stretch'} w={'1px'} bg={'gray.100'} flexShrink={0} />

      <Flex flexShrink={0} h={CHART_HEIGHT} align={'flex-end'} gap={BAR_GAP}>
        {SKELETON_BAR_HEIGHTS.map((heightPct, i) => (
          <Skeleton key={i} w={BAR_WIDTH} h={`${heightPct}%`} borderRadius={'1px 1px 0 0'} />
        ))}
      </Flex>
    </Flex>
  );
}
