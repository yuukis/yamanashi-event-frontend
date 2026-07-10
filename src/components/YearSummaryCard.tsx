import { LinkBox, LinkOverlay, Box, Flex, Tooltip, Image, Center, Text } from '@chakra-ui/react';
import { People } from '@chakra-icons/bootstrap';
import type { ApiHeatmapBucket, ApiYearSummary } from '../types/events';
import { formatMonthCountTooltip } from '../utils/eventsSummary';

const AVATAR_SIZE = { base: '24px', md: '30px' };
const CHART_HEIGHT = '32px';
const BAR_WIDTH = '4px';
const BAR_GAP = '1px';

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
             gap={{base: '2', md: '4'}}
             borderRadius={'md'}
             border={'1px solid'}
             borderColor={'gray.200'}
             bg={'white'}
             px={{base: '3', md: '5'}}
             py={'3'}
             _hover={{ borderColor: 'gray.300', shadow: 'sm' }}
             transition={'box-shadow 120ms ease-out, border-color 120ms ease-out'}
             >
      <Box flexShrink={0}>
        <LinkOverlay href={`/events/${summary.year}`}>
          <Text fontSize={{base: 'xl', md: '2xl'}} fontWeight={'bold'} lineHeight={1} color={'gray.700'} whiteSpace={'nowrap'}>
            {summary.year}
          </Text>
        </LinkOverlay>
      </Box>

      <Box alignSelf={'stretch'} w={'1px'} bg={'gray.100'} flexShrink={0} />

      <Flex flex={'1'}
            minW={'0'}
            align={'center'}
            gap={{base: '1', md: '2'}}
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
