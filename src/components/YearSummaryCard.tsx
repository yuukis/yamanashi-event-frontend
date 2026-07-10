import { LinkBox, LinkOverlay, Box, Flex, Heading, Wrap, WrapItem, Tooltip, Image, Center, Text } from '@chakra-ui/react';
import { People } from '@chakra-icons/bootstrap';
import type { ApiHeatmapBucket, ApiYearSummary } from '../types/events';
import {
  getGroupVisualWeight,
  splitVisibleGroups,
  formatMonthCountTooltip,
} from '../utils/eventsSummary';

const AVATAR_BASE_SIZE = 30;
const OVERFLOW_BADGE_SIZE = '26px';
const CHART_HEIGHT = '56px';
const MONTH_TICK_LABELS = ['1', '', '', '4', '', '', '7', '', '', '10', '', ''];

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
             borderRadius={'md'}
             border={'1px solid'}
             borderColor={'gray.200'}
             bg={'white'}
             p={'4'}
             _hover={{ borderColor: 'gray.300', shadow: 'sm' }}
             transition={'box-shadow 120ms ease-out, border-color 120ms ease-out'}
             >
      <Heading size={'md'} mb={'3'} fontWeight={'semibold'} color={'gray.700'}>
        <LinkOverlay href={`/events/${summary.year}`}>
          {summary.year}年
        </LinkOverlay>
      </Heading>

      <Wrap spacing={'1'} mb={'4'} minH={'30px'}>
        {visible.length > 0 ? (
          <>
            {visible.map((group, index) => {
              const { opacity, scale } = getGroupVisualWeight(index, visible.length);
              const size = `${Math.round(AVATAR_BASE_SIZE * scale)}px`;
              return (
                <WrapItem key={group.key}>
                  <Tooltip label={group.name ?? group.key} hasArrow fontSize={'xs'}>
                    <Center boxSize={size}
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
                </WrapItem>
              );
            })}
            {overflow.length > 0 && (
              <WrapItem>
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
              </WrapItem>
            )}
          </>
        ) : (
          <Text fontSize={'xs'} color={'gray.400'}>活動記録なし</Text>
        )}
      </Wrap>

      <Flex h={CHART_HEIGHT} align={'flex-end'} gap={'1'} borderBottom={'1px solid'} borderColor={'gray.100'} pb={'1'}>
        {months.map((bucket) => {
          const heightPct = maxMonthCount > 0
            ? Math.max((bucket.count / maxMonthCount) * 100, bucket.count > 0 ? 4 : 0)
            : 0;
          return (
            <Tooltip key={bucket.period} label={formatMonthCountTooltip(bucket.period, bucket.count)} hasArrow fontSize={'xs'} openDelay={150}>
              <Box flex={'1'}
                   maxW={'14px'}
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
      <Flex gap={'1'} mt={'1'}>
        {MONTH_TICK_LABELS.map((label, index) => (
          <Text key={index} flex={'1'} textAlign={'center'} fontSize={'2xs'} color={'gray.400'}>
            {label}
          </Text>
        ))}
      </Flex>
    </LinkBox>
  );
}
