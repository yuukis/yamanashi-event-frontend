import { LinkBox, LinkOverlay, Box, Heading, Wrap, WrapItem, Tooltip, Image, Center, Text } from '@chakra-ui/react';
import { People } from '@chakra-icons/bootstrap';
import type { ApiYearSummary } from '../types/events';
import {
  getSequentialLevel,
  getGroupVisualWeight,
  splitVisibleGroups,
  HEATMAP_LEVEL_COLORS,
} from '../utils/eventsSummary';

const AVATAR_BASE_SIZE = 40;
const OVERFLOW_BADGE_SIZE = '28px';

type YearSummaryCardProps = {
  summary: ApiYearSummary;
  maxEventCount: number;
};

export function YearSummaryCard({ summary, maxEventCount }: YearSummaryCardProps) {
  const level = getSequentialLevel(summary.event_count, maxEventCount);
  const { visible, overflow } = splitVisibleGroups(summary.groups);
  const overflowNames = overflow.map((group) => group.name ?? group.key).join('、');

  return (
    <LinkBox as={'article'}
             borderRadius={'md'}
             border={'1px solid'}
             borderColor={'gray.200'}
             bg={'white'}
             overflow={'hidden'}
             _hover={{ borderColor: 'gray.300', shadow: 'sm' }}
             transition={'box-shadow 120ms ease-out, border-color 120ms ease-out'}
             >
      <Box h={'4px'} bg={HEATMAP_LEVEL_COLORS[level]} />
      <Box p={'4'}>
        <Heading size={'md'} mb={'3'} fontWeight={'semibold'} color={'gray.700'}>
          <LinkOverlay href={`/events/${summary.year}`}>
            {summary.year}年
          </LinkOverlay>
        </Heading>
        {visible.length > 0 ? (
          <Wrap spacing={'1'}>
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
          </Wrap>
        ) : (
          <Text fontSize={'xs'} color={'gray.400'}>活動記録なし</Text>
        )}
      </Box>
    </LinkBox>
  );
}
