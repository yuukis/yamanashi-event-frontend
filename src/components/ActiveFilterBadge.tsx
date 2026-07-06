import { Box, Container, HStack, IconButton, Text } from '@chakra-ui/react';
import { SmallCloseIcon } from '@chakra-ui/icons';

type ActiveFilterBadgeProps = {
  selectedKeyword: string | null;
  selectedGroupName: string | null;
  onClearKeyword: () => void;
  onClearGroup: () => void;
};

// ヘッダーはスクロールで自動的に隠れるため、絞り込み中であることに気づかず
// スクロールしてしまわないよう、ヘッダーの表示状態に関係なく常に見える位置に
// 独立して固定表示する。
export function ActiveFilterBadge({
  selectedKeyword,
  selectedGroupName,
  onClearKeyword,
  onClearGroup,
}: ActiveFilterBadgeProps) {
  if (!selectedKeyword && !selectedGroupName) {
    return null;
  }

  const label = selectedGroupName
    ? `コミュニティ「${selectedGroupName}」で絞り込み中`
    : `キーワード「${selectedKeyword}」で絞り込み中`;
  const onClear = selectedGroupName ? onClearGroup : onClearKeyword;

  return (
    <Box position={'fixed'}
         top={{base: 'calc(3rem + 7px)', md: 'calc(4rem + 7px)'}}
         left={'0'} right={'0'}
         zIndex={'banner'}
         pointerEvents={'none'}
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
