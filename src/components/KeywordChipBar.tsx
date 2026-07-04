import { useEffect, useRef, useState } from 'react';
import { Box, Flex, Button, IconButton, useMediaQuery } from '@chakra-ui/react';
import { ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons';

type KeywordChipBarProps = {
  keywords: [string, number][];
  selected: string | null;
  onSelect: (keyword: string | null) => void;
};

// size=xs のボタン高 (1.5rem) に合わせて、折りたたみ時は1行分だけ見せる
const COLLAPSED_ROW_HEIGHT = '1.5rem';

export function KeywordChipBar({ keywords, selected, onSelect }: KeywordChipBarProps) {
  const chips = keywords.map(([keyword]) => keyword);
  if (selected && !chips.includes(selected)) {
    chips.push(selected);
  }

  const [isDesktopScreenSize] = useMediaQuery("(min-width: 768px)");
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasOverflow, setHasOverflow] = useState(false);
  const [isScrolledToEnd, setIsScrolledToEnd] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);

  const chipsKey = chips.join('|');

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

  const chipButtons = chips.map((keyword) => (
    <Button key={keyword}
            size={'xs'}
            rounded={'full'}
            fontWeight={'normal'}
            flexShrink={0}
            {...(selected === keyword ? {
              bg: 'gray.600',
              color: 'white',
              _hover: { bg: 'gray.700' },
            } : {
              variant: 'outline',
              bg: 'white',
              color: 'gray.600',
              borderColor: 'gray.300',
            })}
            onClick={() => onSelect(selected === keyword ? null : keyword)}
            >
      {keyword}
    </Button>
  ));

  if (!isDesktopScreenSize) {
    return (
      <Box className={'keyword-chip-bar'}
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
    <Flex className={'keyword-chip-bar'}
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
        <IconButton aria-label={isExpanded ? 'キーワードを折りたたむ' : 'すべてのキーワードを表示'}
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
