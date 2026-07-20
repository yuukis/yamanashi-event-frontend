import { Box, Heading, Image, LinkBox, LinkOverlay, Skeleton, SkeletonCircle, SkeletonText, Stack, Text } from '@chakra-ui/react';
import { People } from '@chakra-icons/bootstrap';
import type { ApiGroup } from '../types/events';
import { buildGroupPagePath } from '../utils/groupPage';

const AVATAR_SIZE = '56px';

type GroupCardProps = {
  group: ApiGroup;
};

export function GroupCard({ group }: GroupCardProps) {
  return (
    <LinkBox as={'article'}
             display={'flex'}
             gap={'3'}
             alignItems={'flex-start'}
             borderRadius={'md'}
             border={'1px solid'}
             borderColor={'gray.200'}
             bg={'white'}
             p={'4'}
             _hover={{ borderColor: 'gray.300', shadow: 'sm' }}
             transition={'box-shadow 120ms ease-out, border-color 120ms ease-out'}
             >
      <Box boxSize={AVATAR_SIZE}
           bg={'gray.50'}
           borderRadius={'md'}
           border={'1px solid'}
           borderColor={'gray.100'}
           display={'flex'}
           alignItems={'center'}
           justifyContent={'center'}
           flexShrink={0}
           overflow={'hidden'}
           >
        {group.image_url ? (
          <Image src={group.image_url} boxSize={'100%'} fit={'contain'} alt={group.title} />
        ) : (
          <People boxSize={'6'} color={'gray.400'} />
        )}
      </Box>
      <Box minW={'0'} flex={'1'}>
        <Heading size={'sm'} color={'primary.800'}>
          <LinkOverlay href={buildGroupPagePath(group.key)}>{group.title}</LinkOverlay>
        </Heading>
        {group.sub_title && (
          <Text fontSize={'xs'} color={'gray.600'} mt={'1'} noOfLines={2}>
            {group.sub_title}
          </Text>
        )}
        {(group.member_users_count ?? 0) > 0 && (
          <Text fontSize={'xs'} color={'gray.500'} mt={'2'} noOfLines={1}>
            {`メンバー${group.member_users_count}人`}
          </Text>
        )}
      </Box>
    </LinkBox>
  );
}

export function GroupCardSkeleton() {
  return (
    <Stack direction={'row'}
           gap={'3'}
           alignItems={'flex-start'}
           borderRadius={'md'}
           border={'1px solid'}
           borderColor={'gray.200'}
           bg={'white'}
           p={'4'}
           >
      <SkeletonCircle size={AVATAR_SIZE} flexShrink={0} />
      <Stack flex={'1'} spacing={'2'}>
        <Skeleton h={'1.25rem'} w={'60%'} />
        <SkeletonText noOfLines={2} spacing={'1'} skeletonHeight={'0.6rem'} w={'90%'} />
      </Stack>
    </Stack>
  );
}
