import { useState, useSyncExternalStore } from 'react';
import { Box, Container, HStack, IconButton, Text } from '@chakra-ui/react';
import { SmallCloseIcon } from '@chakra-ui/icons';
import { subscribeHeaderVisibility, getHeaderAreaOccupied, HEADER_HEIGHT } from '../utils/headerVisibility';
import '../style.css';

// style.css の .active-filter-badge-pulse と揃える。
const PULSE_ANIMATION_MS = 220;

type ActiveFilterBadgeProps = {
  selectedKeyword: string | null;
  selectedGroupName: string | null;
  onClearKeyword: () => void;
  onClearGroup: () => void;
};

// 画面上端がヘッダー(最上部 or 固定)に覆われている間はその下に退避し、
// ヘッダーがない間は画面上端まで詰めて、絞り込み中であることに常に気づける
// よう画面内に留める。
export function ActiveFilterBadge({
  selectedKeyword,
  selectedGroupName,
  onClearKeyword,
  onClearGroup,
}: ActiveFilterBadgeProps) {
  const isHeaderAreaOccupied = useSyncExternalStore(subscribeHeaderVisibility, getHeaderAreaOccupied);
  const [isPressed, setIsPressed] = useState(false);

  if (!selectedKeyword && !selectedGroupName) {
    return null;
  }

  const highlightedText = selectedGroupName ?? selectedKeyword;
  const onClear = selectedGroupName ? onClearGroup : onClearKeyword;
  const colors = selectedGroupName
    ? { bg: '#f9f1e8', border: 'impact.500', text: 'impact.700', hoverBg: 'impact.100' }
    : { bg: '#eaf6fb', border: 'primary.500', text: 'primary.800', hoverBg: 'primary.100' };

  // クリックすると同時にバッジ自体が消えるため、押した瞬間のアニメーションが
  // 描画される間もなく unmount してしまう。アニメーションが目に見える分だけ
  // 実際のクリア処理を遅らせる。prefers-reduced-motion ではアニメーション
  // 自体をCSS側で無効化しているため、見えない遅延を残さず即クリアする。
  const handlePress = () => {
    if (isPressed) {
      return;
    }
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      onClear();
      return;
    }
    setIsPressed(true);
    window.setTimeout(onClear, PULSE_ANIMATION_MS);
  };

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
                mx={'auto'}
                mt={'2'}
                px={'4'} py={'2'}
                spacing={'2'}
                bg={colors.bg}
                border={'1px solid'}
                borderColor={colors.border}
                borderRadius={'full'}
                boxShadow={'sm'}
                pointerEvents={'auto'}
                cursor={'pointer'}
                transition={'box-shadow 100ms ease-out'}
                _hover={{boxShadow: 'md'}}
                className={isPressed ? 'active-filter-badge-pulse' : undefined}
                onAnimationEnd={() => setIsPressed(false)}
                onClick={handlePress}
                >
          <Text fontSize={'sm'}
                color={colors.text}
                noOfLines={1}
                >
            <Text as={'span'} fontWeight={'bold'}>{highlightedText}</Text>
            <Text as={'span'} fontWeight={'normal'}> で絞り込み中</Text>
          </Text>
          <IconButton aria-label={'絞り込みを解除'}
                      icon={<SmallCloseIcon />}
                      size={'sm'}
                      variant={'ghost'}
                      color={colors.text}
                      minW={'auto'}
                      h={'auto'}
                      p={'0.5'}
                      _hover={{bg: colors.hoverBg}}
                      />
        </HStack>
      </Container>
    </Box>
  );
}
