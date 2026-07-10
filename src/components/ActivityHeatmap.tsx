import { useMemo } from 'react';
import { Box, Grid, GridItem, Text, Tooltip, Skeleton, Link, HStack } from '@chakra-ui/react';
import type { ApiHeatmapBucket } from '../types/events';
import {
  buildHeatmapGrid,
  getMaxHeatmapCount,
  getSequentialLevel,
  formatHeatmapPeriodLabel,
  HEATMAP_LEVEL_COLORS,
} from '../utils/eventsSummary';

const MONTH_LABELS = Array.from({ length: 12 }, (_, i) => `${i + 1}月`);
const YEAR_LABEL_WIDTH = '48px';
const CELL_SIZE = { base: '14px', md: '18px' };
const GRID_MIN_WIDTH = '620px';

type ActivityHeatmapProps = {
  heatmap: ApiHeatmapBucket[];
  isLoading: boolean;
};

export function ActivityHeatmap({ heatmap, isLoading }: ActivityHeatmapProps) {
  const rows = useMemo(() => buildHeatmapGrid(heatmap), [heatmap]);
  const max = useMemo(() => getMaxHeatmapCount(heatmap), [heatmap]);

  if (isLoading) {
    return <Skeleton h={'240px'} borderRadius={'md'} />;
  }

  if (rows.length === 0) {
    return null;
  }

  return (
    <Box>
      <Box overflowX={'auto'} pb={'2'}>
        <Box minW={GRID_MIN_WIDTH}>
          <Grid templateColumns={`${YEAR_LABEL_WIDTH} repeat(12, 1fr)`} gap={'1'} mb={'1'}>
            <GridItem />
            {MONTH_LABELS.map((label) => (
              <GridItem key={label}>
                <Text fontSize={'2xs'} color={'gray.500'} textAlign={'center'}>
                  {label}
                </Text>
              </GridItem>
            ))}
          </Grid>
          {rows.map((row) => (
            <Grid key={row.year}
                  templateColumns={`${YEAR_LABEL_WIDTH} repeat(12, 1fr)`}
                  gap={'1'}
                  alignItems={'center'}
                  mb={'1'}
                  >
              <GridItem>
                <Link href={`/events/${row.year}`} fontSize={'xs'} color={'gray.600'} whiteSpace={'nowrap'}>
                  {row.year}
                </Link>
              </GridItem>
              {row.months.map((bucket) => {
                const level = getSequentialLevel(bucket.count, max);
                return (
                  <GridItem key={bucket.period} display={'flex'} justifyContent={'center'}>
                    <Tooltip label={`${formatHeatmapPeriodLabel(bucket.period)}: ${bucket.count}件`}
                             hasArrow
                             fontSize={'xs'}
                             openDelay={150}
                             >
                      <Box w={CELL_SIZE} h={CELL_SIZE} borderRadius={'2px'} bg={HEATMAP_LEVEL_COLORS[level]} />
                    </Tooltip>
                  </GridItem>
                );
              })}
            </Grid>
          ))}
        </Box>
      </Box>
      <HStack spacing={'1'} justifyContent={'flex-end'} mt={'2'}>
        <Text fontSize={'2xs'} color={'gray.500'} mr={'1'}>少ない</Text>
        {HEATMAP_LEVEL_COLORS.map((color) => (
          <Box key={color} w={'12px'} h={'12px'} borderRadius={'2px'} bg={color} />
        ))}
        <Text fontSize={'2xs'} color={'gray.500'} ml={'1'}>多い</Text>
      </HStack>
    </Box>
  );
}
