import { useSyncExternalStore } from 'react';
import { Box, Container, HStack, IconButton, Text } from '@chakra-ui/react';
import { SmallCloseIcon } from '@chakra-ui/icons';
import { subscribeHeaderVisibility, getHeaderVisible, HEADER_HEIGHT } from '../utils/headerVisibility';

type ActiveFilterBadgeProps = {
  selectedKeyword: string | null;
  selectedGroupName: string | null;
  onClearKeyword: () => void;
  onClearGroup: () => void;
};

// 下スクロールでヘッダーが隠れている間はバッジもヘッダーに追随して画面上端まで
// 詰め、隠れても絞り込み中であることに気づけるよう常に画面内に留める。
export function ActiveFilterBadge({
  selectedKeyword,
  selectedGroupName,
  onClearKeyword,
  onClearGroup,
}: ActiveFilterBadgeProps) {
  const isHeaderVisible = useSyncExternalStore(subscribeHeaderVisibility, getHeaderVisible);

  if (!selectedKeyword && !selectedGroupName) {
    return null;
  }

  const label = selectedGroupName
    ? `コミュニティ「${selectedGroupName}」で絞り込み中`
    : `キーワード「${selectedKeyword}」で絞り込み中`;
  const onClear = selectedGroupName ? onClearGroup : onClearKeyword;

  return (
    <Box position={'fixed'}
         top={isHeaderVisible ? HEADER_HEIGHT : '0'}
         left={'0'} right={'0'}
         zIndex={'banner'}
         pointerEvents={'none'}
         transition={'top 180ms ease-out'}
         >
      <Container maxW={'980px'} px={{base: '4', md: '4'}}>
        <HStack w={'fit-content'}
                maxW={'100%'}
                mt={'2'}
                px={'3'} py={'1'}
                spacing={'2'}
                bg={'#f9f1e8'}
                border={'1px solid'}
                borderColor={'impact.500'}
                borderRadius={'full'}
                boxShadow={'sm'}
                pointerEvents={'auto'}
                >
          <Text fontSize={'xs'}
                fontWeight={'bold'}
                color={'impact.700'}
                noOfLines={1}
                >
            {label}
          </Text>
          <IconButton aria-label={'絞り込みを解除'}
                      icon={<SmallCloseIcon />}
                      size={'xs'}
                      variant={'ghost'}
                      color={'impact.700'}
                      minW={'auto'}
                      h={'auto'}
                      p={'0.5'}
                      _hover={{bg: 'impact.100'}}
                      onClick={onClear}
                      />
        </HStack>
      </Container>
    </Box>
  );
}
