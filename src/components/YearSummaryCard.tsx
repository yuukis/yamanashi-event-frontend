import { LinkBox, LinkOverlay, Box, Flex, Heading, Tooltip, Image, Center, Text } from '@chakra-ui/react';
import { People } from '@chakra-icons/bootstrap';
import type { ApiHeatmapBucket, ApiYearSummary } from '../types/events';
import {
  getGroupVisualWeight,
  splitVisibleGroups,
  formatMonthCountTooltip,
} from '../utils/eventsSummary';

const AVATAR_SIZE = '30px';
const OVERFLOW_BADGE_SIZE = '26px';
const AVATARS_COLUMN_WIDTH = '244px';
const YEAR_COLUMN_WIDTH = '56px';
const CHART_HEIGHT = '48px';

type YearSummaryCardProps = {
  summary: ApiYearSummary;
  months: ApiHeatmapBucket[];
  maxMonthCount: number;
};

export function YearSummaryCard({ summary, months, maxMonthCount }: YearSummaryCardProps) {
  const { visible, overflow } = splitVisibleGroups(summary.groups);
  const overflowNames = overflow.map((group) => group.name ?? group.key).join('、');

  return (
    <LinkBox as={'article'}
             display={'flex'}
             flexWrap={{base: 'wrap', md: 'nowrap'}}
             alignItems={'center'}
             gap={'4'}
             borderRadius={'md'}
             border={'1px solid'}
             borderColor={'gray.200'}
             bg={'white'}
             px={'5'}
             py={'3'}
             _hover={{ borderColor: 'gray.300', shadow: 'sm' }}
             transition={'box-shadow 120ms ease-out, border-color 120ms ease-out'}
             >
      <Box flexShrink={0} w={{base: 'auto', md: YEAR_COLUMN_WIDTH}} order={{base: 1, md: 0}}>
        <Heading size={'sm'} fontWeight={'semibold'} color={'gray.700'} whiteSpace={'nowrap'}>
          <LinkOverlay href={`/events/${summary.year}`}>
            {summary.year}年
          </LinkOverlay>
        </Heading>
      </Box>

      <Box display={{base: 'none', md: 'block'}} alignSelf={'stretch'} w={'1px'} bg={'gray.100'} flexShrink={0} />

      <Flex order={{base: 2, md: 0}}
            flexShrink={0}
            w={{base: '100%', md: AVATARS_COLUMN_WIDTH}}
            align={'center'}
            gap={'2'}
            wrap={'nowrap'}
            overflow={'hidden'}
            >
        {visible.length > 0 ? (
          <>
            {visible.map((group, index) => {
              const { opacity } = getGroupVisualWeight(index, visible.length);
              return (
                <Tooltip key={group.key} label={group.name ?? group.key} hasArrow fontSize={'xs'}>
                  <Center boxSize={AVATAR_SIZE}
                          borderRadius={'full'}
                          bg={'gray.100'}
                          overflow={'hidden'}
                          opacity={opacity}
                          flexShrink={0}
                          >
                    {group.image_url ? (
                      <Image src={group.image_url} boxSize={'100%'} fit={'cover'} alt={group.name ?? group.key} />
                    ) : (
                      <People color={'gray.400'} />
                    )}
                  </Center>
                </Tooltip>
              );
            })}
            {overflow.length > 0 && (
              <Tooltip label={overflowNames} hasArrow fontSize={'xs'}>
                <Center boxSize={OVERFLOW_BADGE_SIZE}
                        borderRadius={'full'}
                        bg={'gray.100'}
                        color={'gray.500'}
                        fontSize={'2xs'}
                        fontWeight={'bold'}
                        flexShrink={0}
                        >
                  {`+${overflow.length}`}
                </Center>
              </Tooltip>
            )}
          </>
        ) : (
          <Text fontSize={'xs'} color={'gray.400'} whiteSpace={'nowrap'}>活動記録なし</Text>
        )}
      </Flex>

      <Box display={{base: 'none', md: 'block'}} alignSelf={'stretch'} w={'1px'} bg={'gray.100'} flexShrink={0} />

      <Flex order={{base: 3, md: 0}} flex={'1 1 100%'} minW={'0'} h={CHART_HEIGHT} align={'flex-end'} gap={'1'}>
        {months.map((bucket) => {
          const heightPct = maxMonthCount > 0
            ? Math.max((bucket.count / maxMonthCount) * 100, bucket.count > 0 ? 4 : 0)
            : 0;
          return (
            <Tooltip key={bucket.period} label={formatMonthCountTooltip(bucket.period, bucket.count)} hasArrow fontSize={'xs'} openDelay={150}>
              <Box flex={'1'}
                   maxW={'22px'}
                   h={`${heightPct}%`}
                   minH={'2px'}
                   borderRadius={'2px 2px 0 0'}
                   bg={bucket.count > 0 ? 'primary.400' : 'gray.100'}
                   _hover={{ bg: bucket.count > 0 ? 'primary.600' : 'gray.300' }}
                   />
            </Tooltip>
          );
        })}
      </Flex>
    </LinkBox>
  );
}
