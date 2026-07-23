import { useState } from 'react';
import { HStack, IconButton, Text } from '@chakra-ui/react';
import { SmallCloseIcon } from '@chakra-ui/icons';
import '../style.css';

const PULSE_ANIMATION_MS = 220;

type ActiveFilterBadgeProps = {
  selectedKeyword: string | null;
  selectedGroupName: string | null;
  selectedAreaName: string | null;
  onClearKeyword: () => void;
  onClearGroup: () => void;
  onClearArea: () => void;
};

export function ActiveFilterBadge({
  selectedKeyword,
  selectedGroupName,
  selectedAreaName,
  onClearKeyword,
  onClearGroup,
  onClearArea,
}: ActiveFilterBadgeProps) {
  const [isPressed, setIsPressed] = useState(false);

  if (!selectedKeyword && !selectedGroupName && !selectedAreaName) {
    return null;
  }

  const highlightedText = selectedGroupName ?? selectedAreaName ?? selectedKeyword;
  const onClear = selectedGroupName ? onClearGroup : selectedAreaName ? onClearArea : onClearKeyword;
  const colors = selectedGroupName
    ? { bg: '#f9f1e8', border: 'impact.500', text: 'impact.700', hoverBg: 'impact.100' }
    : selectedAreaName
    ? { bg: '#eefaea', border: 'secondary.700', text: 'secondary.900', hoverBg: 'secondary.100' }
    : { bg: '#eaf6fb', border: 'primary.500', text: 'primary.800', hoverBg: 'primary.100' };

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
    <HStack maxW={{base: '40%', md: '260px'}}
            flexShrink={1}
            minW={0}
            px={'3'} py={'1'}
            spacing={'1'}
            bg={colors.bg}
            border={'1px solid'}
            borderColor={colors.border}
            borderRadius={'full'}
            cursor={'pointer'}
            transition={'box-shadow 100ms ease-out'}
            _hover={{boxShadow: 'sm'}}
            className={isPressed ? 'active-filter-badge-pulse' : undefined}
            onAnimationEnd={() => setIsPressed(false)}
            onClick={handlePress}
            >
      <Text fontSize={'xs'}
            color={colors.text}
            noOfLines={1}
            minW={0}
            >
        <Text as={'span'} fontWeight={'bold'}>{highlightedText}</Text>
        <Text as={'span'} fontWeight={'normal'}> で絞り込み中</Text>
      </Text>
      <IconButton aria-label={'絞り込みを解除'}
                  icon={<SmallCloseIcon />}
                  size={'xs'}
                  variant={'ghost'}
                  color={colors.text}
                  minW={'auto'}
                  h={'auto'}
                  p={'0.5'}
                  flexShrink={0}
                  _hover={{bg: colors.hoverBg}}
                  />
    </HStack>
  );
}
