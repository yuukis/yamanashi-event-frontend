import { LinkBox, LinkOverlay, Box, Image, Text } from '@chakra-ui/react';
import { ChevronRightIcon } from '@chakra-ui/icons';
import { People } from '@chakra-icons/bootstrap';
import { buildGroupPagePath } from '../utils/groupPage';

const IMAGE_SIZE = '40px';

type GroupMoreEventsLinkProps = {
  groupKey: string;
  groupName: string;
  imageUrl?: string | null;
};

export function GroupMoreEventsLink({ groupKey, groupName, imageUrl }: GroupMoreEventsLinkProps) {
  return (
    <LinkBox as={'div'}
             role={'group'}
             display={'flex'}
             alignItems={'center'}
             gap={'3'}
             w={'fit-content'}
             maxW={'100%'}
             borderRadius={'md'}
             border={'1px solid'}
             borderColor={'impact.500'}
             bg={'#f9f1e8'}
             px={'4'} py={'3'}
             mx={{base: '4', md: '0'}}
             mt={{base: '4', md: '2'}}
             mb={{base: '4', md: '0'}}
             _hover={{ borderColor: 'impact.600', shadow: 'sm' }}
             transition={'border-color 120ms ease-out, box-shadow 120ms ease-out'}
             >
      <Box boxSize={IMAGE_SIZE}
           bg={'white'}
           border={'1px solid'}
           borderColor={'impact.100'}
           borderRadius={'md'}
           display={'flex'}
           alignItems={'center'}
           justifyContent={'center'}
           flexShrink={0}
           overflow={'hidden'}
           >
        {imageUrl ? (
          <Image src={imageUrl} boxSize={'100%'} fit={'contain'} alt={groupName} />
        ) : (
          <People color={'impact.400'} />
        )}
      </Box>
      <LinkOverlay href={buildGroupPagePath(groupKey)}
                   textDecoration={'none'}
                   display={'flex'}
                   alignItems={'center'}
                   gap={'2'}
                   minW={'0'}
                   >
        <Box minW={'0'}>
          <Text fontSize={'sm'} fontWeight={'bold'} color={'impact.700'} noOfLines={1}>
            {groupName}
          </Text>
          <Text fontSize={'xs'} color={'gray.600'}>
            全イベントを見る
          </Text>
        </Box>
        <ChevronRightIcon color={'impact.600'}
                           flexShrink={0}
                           transition={'transform 120ms ease-out'}
                           _groupHover={{ transform: 'translateX(2px)' }}
                           />
      </LinkOverlay>
    </LinkBox>
  );
}
