import { useEffect, useRef, useState } from 'react';
import { Box, Flex, Button, useMediaQuery } from '@chakra-ui/react';

export type ChipItem = {
  value: string;
  label: string;
  disabled?: boolean;
};

type ChipBarProps = {
  items: ChipItem[];
  selected: string | null;
  onSelect: (value: string | null) => void;
};

export function ChipBar({ items, selected, onSelect }: ChipBarProps) {
  const chips = [...items];
  if (selected && !chips.some((item) => item.value === selected)) {
    chips.push({ value: selected, label: selected });
  }

  const [isDesktopScreenSize] = useMediaQuery("(min-width: 768px)");
  const [hasOverflow, setHasOverflow] = useState(false);
  const [isScrolledToStart, setIsScrolledToStart] = useState(true);
  const [isScrolledToEnd, setIsScrolledToEnd] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);

  const chipsKey = chips.map((item) => item.value).join('|');

  // 非表示のタブパネルで幅0のまま実測した後、表示に戻って幅が確定した
  // 際にも再計算されるよう ResizeObserver で監視する(window の resize
  // だけではタブ切り替えを検知できない)。
  useEffect(() => {
    if (isDesktopScreenSize) {
      return;
    }
    const el = rowRef.current;
    if (!el) {
      return;
    }
    const check = () => {
      setHasOverflow(el.scrollWidth > el.clientWidth + 1);
      setIsScrolledToStart(el.scrollLeft <= 0);
      setIsScrolledToEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 1);
    };
    check();
    const observer = new ResizeObserver(check);
    observer.observe(el);
    return () => observer.disconnect();
  }, [chipsKey, isDesktopScreenSize]);

  if (chips.length === 0) {
    return null;
  }

  const chipButtons = chips.map((item) => (
    <Button key={item.value}
            size={'xs'}
            h={'7'}
            px={'3'}
            rounded={'full'}
            fontWeight={'normal'}
            flexShrink={0}
            isDisabled={item.disabled}
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
           mb={'2'}
           >
        <Flex ref={rowRef}
              className={'scroll-row-bg-pattern'}
              gap={'2'}
              pl={'4'} pr={'4'}
              pt={'5'} pb={'5'}
              overflowX={'auto'}
              onScroll={(e) => {
                const el = e.currentTarget;
                setIsScrolledToStart(el.scrollLeft <= 0);
                setIsScrolledToEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 1);
              }}
              >
          {chipButtons}
        </Flex>
        {hasOverflow && !isScrolledToStart && (
          <Box position={'absolute'}
               top={'0'} bottom={'0'} left={'0'}
               w={'10'}
               pointerEvents={'none'}
               bgGradient={'linear(to-l, rgba(255, 255, 255, 0), #ffffff)'}
               />
        )}
        {hasOverflow && !isScrolledToEnd && (
          <Box position={'absolute'}
               top={'0'} bottom={'0'} right={'0'}
               w={'10'}
               pointerEvents={'none'}
               bgGradient={'linear(to-r, rgba(255, 255, 255, 0), #ffffff)'}
               />
        )}
      </Box>
    );
  }

  return (
    <Flex className={'chip-bar'}
          mb={'2'} gap={'2'}
          wrap={'wrap'}
          >
      {chipButtons}
    </Flex>
  );
}
