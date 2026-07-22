import { useSyncExternalStore } from 'react';
import { Box, Container, HStack, IconButton, Link, Text } from '@chakra-ui/react';
import { ChevronRightIcon, SmallCloseIcon } from '@chakra-ui/icons';
import { subscribeHeaderVisibility, getHeaderAreaOccupied, HEADER_HEIGHT } from '../utils/headerVisibility';
import { buildGroupPagePath } from '../utils/groupPage';

type ActiveFilterBadgeProps = {
  selectedKeyword: string | null;
  selectedGroupName: string | null;
  selectedGroupKey?: string | null;
  onClearKeyword: () => void;
  onClearGroup: () => void;
};

// 画面上端がヘッダー(最上部 or 固定)に覆われている間はその下に退避し、
// ヘッダーがない間は画面上端まで詰めて、絞り込み中であることに常に気づける
// よう画面内に留める。
export function ActiveFilterBadge({
  selectedKeyword,
  selectedGroupName,
  selectedGroupKey,
  onClearKeyword,
  onClearGroup,
}: ActiveFilterBadgeProps) {
  const isHeaderAreaOccupied = useSyncExternalStore(subscribeHeaderVisibility, getHeaderAreaOccupied);

  if (!selectedKeyword && !selectedGroupName) {
    return null;
  }

  const label = selectedGroupName
    ? `コミュニティ「${selectedGroupName}」で絞り込み中`
    : `キーワード「${selectedKeyword}」で絞り込み中`;
  const onClear = selectedGroupName ? onClearGroup : onClearKeyword;

  return (
    <Box position={'fixed'}
         top={isHeaderAreaOccupied ? HEADER_HEIGHT : '0'}
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
          {selectedGroupName && selectedGroupKey && (
            <Link href={buildGroupPagePath(selectedGroupKey)}
                  fontSize={'xs'}
                  fontWeight={'bold'}
                  color={'impact.700'}
                  whiteSpace={'nowrap'}
                  display={'inline-flex'}
                  alignItems={'center'}
                  >
              コミュニティページ<ChevronRightIcon />
            </Link>
          )}
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
