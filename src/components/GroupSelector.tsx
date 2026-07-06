import { useMemo } from 'react';
import { Box, SimpleGrid, Button, Image, Text, Skeleton } from '@chakra-ui/react';
import { People } from '@chakra-icons/bootstrap';

export type GroupSelectorItem = {
  key: string;
  name: string;
  imageUrl?: string | null;
};

type GroupSelectorProps = {
  groups: GroupSelectorItem[];
  selected: string | null;
  onSelect: (key: string | null) => void;
  isLoading: boolean;
};

const COLUMNS = { base: 3, sm: 4, md: 6, lg: 8 };
const IMAGE_SIZE = { base: '48px', md: '56px' };
const BLOCK_MIN_H = { base: '92px', md: '104px' };
const SKELETON_COUNT = 8;

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function GroupSelector({ groups, selected, onSelect, isLoading }: GroupSelectorProps) {
  const groupsKey = groups.map((group) => group.key).sort().join('|');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const shuffledGroups = useMemo(() => shuffle(groups), [groupsKey]);

  if (!isLoading && groups.length === 0) {
    return null;
  }

  return (
    <SimpleGrid className={'group-selector'} columns={COLUMNS} spacing={{base: '2', md: '3'}} mb={'2'}>
      {isLoading ? (
        Array.from({length: SKELETON_COUNT}).map((_, i) => (
          <Box key={i}
               display={'flex'}
               flexDirection={'column'}
               alignItems={'center'}
               gap={'1'}
               p={'2'}
               minH={BLOCK_MIN_H}
               borderRadius={'md'}
               border={'1px solid'}
               borderColor={'gray.100'}
               >
            <Skeleton boxSize={IMAGE_SIZE} borderRadius={'full'} />
            <Skeleton h={'0.75rem'} w={'80%'} />
            <Skeleton h={'0.75rem'} w={'60%'} />
          </Box>
        ))
      ) : (
        shuffledGroups.map((group) => (
          <Button key={group.key}
                  variant={'unstyled'}
                  display={'flex'}
                  flexDirection={'column'}
                  alignItems={'center'}
                  justifyContent={'flex-start'}
                  gap={'1'}
                  p={'2'}
                  h={'100%'}
                  minH={BLOCK_MIN_H}
                  borderRadius={'md'}
                  border={'1px solid'}
                  borderColor={selected === group.key ? 'gray.600' : 'gray.200'}
                  bg={selected === group.key ? 'gray.100' : 'white'}
                  _hover={{ bg: selected === group.key ? 'gray.100' : 'gray.50' }}
                  onClick={() => onSelect(selected === group.key ? null : group.key)}
                  >
            <Box boxSize={IMAGE_SIZE}
                 borderRadius={'full'}
                 overflow={'hidden'}
                 bg={'gray.100'}
                 display={'flex'}
                 alignItems={'center'}
                 justifyContent={'center'}
                 flexShrink={0}
                 >
              {group.imageUrl ? (
                <Image src={group.imageUrl} boxSize={'100%'} fit={'contain'} alt={group.name} />
              ) : (
                <People color={'gray.400'} />
              )}
            </Box>
            <Text fontSize={'xs'}
                  fontWeight={'normal'}
                  textAlign={'center'}
                  noOfLines={2}
                  color={selected === group.key ? 'gray.700' : 'gray.600'}
                  >
              {group.name}
            </Text>
          </Button>
        ))
      )}
    </SimpleGrid>
  );
}
