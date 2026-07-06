import { useEffect, useRef, useState } from 'react';
import { Box, Flex, Button, IconButton, useMediaQuery } from '@chakra-ui/react';
import { ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons';

export type ChipItem = {
  value: string;
  label: string;
};

type ChipBarProps = {
  items: ChipItem[];
  selected: string | null;
  onSelect: (value: string | null) => void;
  expandAriaLabel: string;
  collapseAriaLabel: string;
};

// size=xs のボタン高 (1.5rem) に合わせて、折りたたみ時は1行分だけ見せる
const COLLAPSED_ROW_HEIGHT = '1.5rem';

export function ChipBar({ items, selected, onSelect, expandAriaLabel, collapseAriaLabel }: ChipBarProps) {
  const chips = [...items];
  if (selected && !chips.some((item) => item.value === selected)) {
    chips.push({ value: selected, label: selected });
  }

  const [isDesktopScreenSize] = useMediaQuery("(min-width: 768px)");
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasOverflow, setHasOverflow] = useState(false);
  const [isScrolledToEnd, setIsScrolledToEnd] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);

  const chipsKey = chips.map((item) => item.value).join('|');

  useEffect(() => {
    const el = rowRef.current;
    if (!el) {
      return;
    }
    const check = () => {
      setHasOverflow(
        isDesktopScreenSize
          ? el.scrollHeight > el.clientHeight + 1
          : el.scrollWidth > el.clientWidth + 1
      );
      setIsScrolledToEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 1);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [chipsKey, isDesktopScreenSize, isExpanded]);

  if (chips.length === 0) {
    return null;
  }

  const chipButtons = chips.map((item) => (
    <Button key={item.value}
            size={'xs'}
            rounded={'full'}
            fontWeight={'normal'}
            flexShrink={0}
            {...(selected === item.value ? {
              bg: 'gray.600',
              color: 'white',
              _hover: { bg: 'gray.700' },
            } : {
              variant: 'outline',
              bg: 'white',
              color: 'gray.600',
              borderColor: 'gray.300',
            })}
            onClick={() => onSelect(selected === item.value ? null : item.value)}
            >
      {item.label}
    </Button>
  ));

  if (!isDesktopScreenSize) {
    return (
      <Box className={'chip-bar'}
           position={'relative'}
           ml={'4'} mr={'4'} mb={'2'}
           >
        <Flex ref={rowRef}
              gap={'2'}
              overflowX={'auto'}
              onScroll={(e) => {
                const el = e.currentTarget;
                setIsScrolledToEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 1);
              }}
              sx={{
                scrollbarWidth: 'none',
                '::-webkit-scrollbar': { display: 'none' },
              }}
              >
          {chipButtons}
        </Flex>
        {hasOverflow && !isScrolledToEnd && (
          <Box position={'absolute'}
               top={'0'} bottom={'0'} right={'0'}
               w={'10'}
               pointerEvents={'none'}
               bgGradient={'linear(to-r, rgba(237, 242, 247, 0), gray.100)'}
               />
        )}
      </Box>
    );
  }

  return (
    <Flex className={'chip-bar'}
          mb={'2'} gap={'2'}
          alignItems={'flex-start'}
          >
      <Flex ref={rowRef}
            gap={'2'}
            wrap={'wrap'}
            flex={'1'} minW={'0'}
            maxH={isExpanded ? undefined : COLLAPSED_ROW_HEIGHT}
            overflow={'hidden'}
            >
        {chipButtons}
      </Flex>
      {(hasOverflow || isExpanded) && (
        <IconButton aria-label={isExpanded ? collapseAriaLabel : expandAriaLabel}
                    icon={isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
                    size={'xs'}
                    rounded={'full'}
                    variant={'ghost'}
                    color={'gray.600'}
                    flexShrink={0}
                    onClick={() => setIsExpanded(!isExpanded)}
                    />
      )}
    </Flex>
  );
}
