import { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Flex, Button, Image, Text, Skeleton, Tooltip, useMediaQuery } from '@chakra-ui/react';
import { ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons';
import { People } from '@chakra-icons/bootstrap';

export type GroupSelectorItem = {
  key: string;
  name: string;
  imageUrl?: string | null;
};

type GroupSelectorProps = {
  groups: GroupSelectorItem[];
  selected: string | null;
  onSelect: (key: string | null) => void;
  isLoading: boolean;
};

const BLOCK_WIDTH = { base: '84px', md: '104px' };
// 画像(IMAGE_SIZE) + gap + 2行分のコミュニティ名 + 上下padding を積み上げた高さ。
// 1行のコミュニティ名でも2行のものと枠の高さが揃うよう、名前欄は常にこの高さを確保する。
const BLOCK_HEIGHT = { base: '92px', md: '104px' };
const EXPAND_BUTTON_WIDTH = { base: '36px', md: '44px' };
const IMAGE_SIZE = { base: '44px', md: '56px' };
const NAME_HEIGHT = '2.4em';
const SKELETON_COUNT = 8;

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

type GroupBlockProps = {
  group: GroupSelectorItem;
  isSelected: boolean;
  onSelect: () => void;
};

function GroupBlock({ group, isSelected, onSelect }: GroupBlockProps) {
  return (
    <Tooltip label={group.name} hasArrow fontSize={'xs'}>
      <Button variant={'unstyled'}
              w={BLOCK_WIDTH}
              h={BLOCK_HEIGHT}
              flexShrink={0}
              display={'flex'}
              flexDirection={'column'}
              alignItems={'center'}
              justifyContent={'flex-start'}
              gap={'1'}
              p={'2'}
              borderRadius={'md'}
              border={'1px solid'}
              borderColor={isSelected ? 'gray.600' : 'gray.200'}
              bg={isSelected ? 'gray.100' : 'white'}
              _hover={{ bg: isSelected ? 'gray.100' : 'gray.50' }}
              onClick={onSelect}
              >
        <Box boxSize={IMAGE_SIZE}
             bg={'gray.100'}
             borderRadius={'md'}
             display={'flex'}
             alignItems={'center'}
             justifyContent={'center'}
             flexShrink={0}
             >
          {group.imageUrl ? (
            <Image src={group.imageUrl} boxSize={'100%'} fit={'contain'} alt={group.name} />
          ) : (
            <People color={'gray.400'} />
          )}
        </Box>
        <Text fontSize={'xs'}
              fontWeight={'normal'}
              lineHeight={'1.2'}
              textAlign={'center'}
              whiteSpace={'normal'}
              noOfLines={2}
              w={'100%'}
              h={NAME_HEIGHT}
              wordBreak={'break-word'}
              color={isSelected ? 'gray.700' : 'gray.600'}
              >
          {group.name}
        </Text>
      </Button>
    </Tooltip>
  );
}

export function GroupSelector({ groups, selected, onSelect, isLoading }: GroupSelectorProps) {
  const groupsKey = groups.map((group) => group.key).sort().join('|');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const shuffledGroups = useMemo(() => shuffle(groups), [groupsKey]);

  const [isDesktopScreenSize] = useMediaQuery("(min-width: 768px)");
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasOverflow, setHasOverflow] = useState(false);
  const [isScrolledToEnd, setIsScrolledToEnd] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);

  // モバイル: 横スクロール行自体のオーバーフロー判定(フェード表示・展開ボタンとは無関係)
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
      setIsScrolledToEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 1);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [groupsKey, isDesktopScreenSize, isLoading]);

  // デスクトップ: 「もっとみる」ボタンの有無で行の幅が変わってしまうと、
  // ボタン表示の要否がボタン自身の表示状態に依存する堂々巡りになるため、
  // ボタンを含めない全幅の非表示コピーで折り返しの要否だけを判定する。
  useEffect(() => {
    if (!isDesktopScreenSize) {
      return;
    }
    const el = measureRef.current;
    if (!el) {
      return;
    }
    const check = () => setHasOverflow(el.scrollHeight > el.clientHeight + 1);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [groupsKey, isDesktopScreenSize, isLoading]);

  if (!isLoading && groups.length === 0) {
    return null;
  }

  const blockCount = isLoading ? SKELETON_COUNT : shuffledGroups.length;

  const blocks = isLoading
    ? Array.from({length: SKELETON_COUNT}).map((_, i) => (
        <Box key={i}
             w={BLOCK_WIDTH}
             h={BLOCK_HEIGHT}
             flexShrink={0}
             display={'flex'}
             flexDirection={'column'}
             alignItems={'center'}
             gap={'1'}
             p={'2'}
             borderRadius={'md'}
             border={'1px solid'}
             borderColor={'gray.100'}
             >
          <Skeleton boxSize={IMAGE_SIZE} />
          <Skeleton h={'0.75rem'} w={'90%'} />
          <Skeleton h={'0.75rem'} w={'60%'} />
        </Box>
      ))
    : shuffledGroups.map((group) => (
        <GroupBlock key={group.key}
                    group={group}
                    isSelected={selected === group.key}
                    onSelect={() => onSelect(selected === group.key ? null : group.key)}
                    />
      ));

  if (!isDesktopScreenSize) {
    return (
      <Box className={'group-selector'}
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
          {blocks}
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
    <Box className={'group-selector'} position={'relative'} mb={'2'}>
      <Flex ref={measureRef}
            position={'absolute'}
            left={'0'} right={'0'} top={'0'}
            visibility={'hidden'}
            pointerEvents={'none'}
            aria-hidden={'true'}
            gap={'2'}
            wrap={'wrap'}
            maxH={BLOCK_HEIGHT}
            overflow={'hidden'}
            >
        {Array.from({length: blockCount}).map((_, i) => (
          <Box key={i} w={BLOCK_WIDTH} h={BLOCK_HEIGHT} flexShrink={0} />
        ))}
      </Flex>
      <Flex gap={'2'} alignItems={'flex-start'}>
        <Flex gap={'2'}
              wrap={'wrap'}
              flex={'1'} minW={'0'}
              maxH={isExpanded ? undefined : BLOCK_HEIGHT}
              overflow={'hidden'}
              >
          {blocks}
        </Flex>
        {(hasOverflow || isExpanded) && (
          <Button variant={'unstyled'}
                  aria-label={isExpanded ? '閉じる' : 'もっとみる'}
                  w={EXPAND_BUTTON_WIDTH}
                  h={BLOCK_HEIGHT}
                  flexShrink={0}
                  display={'flex'}
                  alignItems={'center'}
                  justifyContent={'center'}
                  borderRadius={'md'}
                  border={'1px solid'}
                  borderColor={'gray.200'}
                  bg={'white'}
                  _hover={{ bg: 'gray.50' }}
                  onClick={() => setIsExpanded(!isExpanded)}
                  >
            {isExpanded ? <ChevronUpIcon boxSize={5} color={'gray.600'} /> : <ChevronDownIcon boxSize={5} color={'gray.600'} />}
          </Button>
        )}
      </Flex>
    </Box>
  );
}
