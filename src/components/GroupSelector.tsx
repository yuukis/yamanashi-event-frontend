import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Box, Flex, Grid, Button, Image, Text, Skeleton, Tooltip, Badge, useMediaQuery } from '@chakra-ui/react';
import { People } from '@chakra-icons/bootstrap';
import { formatEventDateKey } from '../utils/eventAnchors';
import { subscribeNow, getNow } from '../utils/nowTicker';
import { isEventNew, type NewEventTrackingData } from '../utils/newEventTracking';
import { subscribeTrackingData, getTrackingDataSnapshot } from '../utils/newEventTrackingStore';

export type GroupSelectorEvent = {
  uid: string;
  started_at: string;
  ended_at: string;
  updated_at: string;
};

export type GroupSelectorItem = {
  key: string;
  name: string;
  imageUrl?: string | null;
  events: GroupSelectorEvent[];
};

type GroupSelectorProps = {
  groups: GroupSelectorItem[];
  selected: string | null;
  onSelect: (key: string | null) => void;
  isLoading: boolean;
  // 「開催中」等のバッジを表示し、該当コミュニティを先頭に寄せるか。
  // モバイルの横スクロール一覧はファーストビューに収まらないと意味が
  // ないため、バッジを使うページ(Root)ではここで最優先表示に寄せる。
  showBadges: boolean;
};

type GroupBadgeType = 'ongoing' | 'today' | 'new';

// モバイルは固定幅の横スクロール。デスクトップは768px幅で1行5個に収まる
// 値を下限として列数を実測算出し、各列を 1fr で均等ストレッチしてメイン
// エリア幅を余白なく埋める(モバイルの固定幅もこの下限値を流用する)。
const DESKTOP_GRID_GAP_PX = 8;
const DESKTOP_BLOCK_MIN_WIDTH_PX = 140;
const MOBILE_BLOCK_WIDTH = `${DESKTOP_BLOCK_MIN_WIDTH_PX}px`;
const BLOCK_HEIGHT = { base: '56px', md: '64px' };
const IMAGE_SIZE = { base: '40px', md: '48px' };
const SKELETON_COUNT = 8;
// バッジの上半分がブロック上端からはみ出す分の余白。
const BADGE_OVERLAP = '10px';

// コミュニティが持つイベントの中に「開催中」「本日開催」「新着あり」に
// 該当するものがあるかどうかを判定する。優先順位は ongoing > today > new。
function getGroupBadge(
  events: GroupSelectorEvent[],
  now: Date,
  trackingData: NewEventTrackingData,
): GroupBadgeType | null {
  let type: GroupBadgeType | null = null;
  let hasNew = false;
  const todayKey = formatEventDateKey(now);

  for (const event of events) {
    const start = new Date(event.started_at);
    const end = new Date(event.ended_at);

    if (isEventNew(trackingData, event, now)) {
      hasNew = true;
    }

    const hasEnded = now.getTime() > end.getTime();
    if (hasEnded) {
      continue;
    }

    const isOngoing = now.getTime() >= start.getTime();
    const isToday = formatEventDateKey(start) === todayKey;
    if (!isOngoing && !isToday) {
      continue;
    }

    if (isOngoing) {
      type = 'ongoing';
    } else if (type !== 'ongoing') {
      type = 'today';
    }
  }

  if (type) {
    return type;
  }
  if (hasNew) {
    return 'new';
  }
  return null;
}

type GroupBlockProps = {
  group: GroupSelectorItem;
  badge: GroupBadgeType | null;
  isSelected: boolean;
  onSelect: () => void;
  width: string;
};

function GroupBlock({ group, badge, isSelected, onSelect, width }: GroupBlockProps) {
  return (
    <Tooltip label={group.name} hasArrow fontSize={'xs'}>
      <Button variant={'unstyled'}
              position={'relative'}
              w={width}
              h={BLOCK_HEIGHT}
              flexShrink={0}
              display={'flex'}
              flexDirection={'row'}
              alignItems={'center'}
              justifyContent={'flex-start'}
              gap={'2'}
              px={'2'}
              borderRadius={'md'}
              border={'1px solid'}
              borderColor={isSelected ? 'gray.600' : 'gray.300'}
              bg={isSelected ? 'gray.600' : 'white'}
              _hover={{ bg: isSelected ? 'gray.700' : 'gray.50' }}
              onClick={onSelect}
              >
        {badge && (
          <Badge position={'absolute'}
                 top={'0'}
                 left={'2'}
                 transform={'translate(0, -50%)'}
                 bg={badge === 'new' ? '#f3e8fb' : '#f9f1e8'}
                 color={badge === 'new' ? 'purple.700' : 'impact.700'}
                 border={'1px solid'}
                 borderColor={badge === 'new' ? 'purple.500' : 'impact.500'}
                 fontSize={'xs'}
                 fontWeight={'bold'}
                 whiteSpace={'nowrap'}
                 zIndex={'1'}
                 >
            {badge === 'ongoing' ? '開催中' : badge === 'today' ? '本日開催' : '新着あり'}
          </Badge>
        )}
        <Box boxSize={IMAGE_SIZE}
             bg={'#ffffff'}
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
              textAlign={'left'}
              whiteSpace={'normal'}
              noOfLines={2}
              flex={'1'}
              minW={0}
              wordBreak={'break-word'}
              color={isSelected ? 'white' : 'gray.600'}
              >
          {group.name}
        </Text>
      </Button>
    </Tooltip>
  );
}

export function GroupSelector({ groups, selected, onSelect, isLoading, showBadges }: GroupSelectorProps) {
  const groupsKey = groups.map((group) => group.key).sort().join('|');

  const now = useSyncExternalStore(subscribeNow, getNow);
  const trackingData = useSyncExternalStore(subscribeTrackingData, getTrackingDataSnapshot);

  const [isDesktopScreenSize] = useMediaQuery("(min-width: 768px)");
  const [hasOverflow, setHasOverflow] = useState(false);
  const [isScrolledToStart, setIsScrolledToStart] = useState(true);
  const [isScrolledToEnd, setIsScrolledToEnd] = useState(false);
  const [desktopColumnCount, setDesktopColumnCount] = useState(1);
  const rowRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // モバイル: 横スクロール行自体のオーバーフロー判定(フェード表示の要否)
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
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [groupsKey, isDesktopScreenSize, isLoading]);

  // デスクトップ: メインエリア幅いっぱいに均一サイズでストレッチさせる
  // ため列数を実測して repeat(N, minmax(...)) に反映する。CSS の
  // auto-fill は minmax の上限が固定値だと列数の算出にも上限値を使って
  // しまい、下限(768px 幅で5列)通りの列数にならないため使えない。
  useLayoutEffect(() => {
    if (!isDesktopScreenSize) {
      return;
    }
    const el = gridRef.current;
    if (!el) {
      return;
    }
    const check = () => {
      const count = Math.floor((el.clientWidth + DESKTOP_GRID_GAP_PX) / (DESKTOP_BLOCK_MIN_WIDTH_PX + DESKTOP_GRID_GAP_PX));
      setDesktopColumnCount(Math.max(1, count));
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [groupsKey, isDesktopScreenSize, isLoading]);

  if (!isLoading && groups.length === 0) {
    return null;
  }

  const badgeByKey = showBadges
    ? new Map(groups.map((group) => [group.key, getGroupBadge(group.events, now, trackingData)]))
    : new Map<string, GroupBadgeType | null>();

  // バッジ対象のコミュニティを先頭に寄せる。各グループ内の相対順は
  // 呼び出し側が渡した順序(例: Root は直近開催日時順)をそのまま保つ。
  const orderedGroups = showBadges
    ? [
        ...groups.filter((group) => badgeByKey.get(group.key)),
        ...groups.filter((group) => !badgeByKey.get(group.key)),
      ]
    : groups;

  // デスクトップは Grid の auto-fill が列幅を均一にストレッチするため
  // '100%' で列いっぱいに広げる。モバイルは横スクロール行なので固定幅。
  const cardWidth = isDesktopScreenSize ? '100%' : MOBILE_BLOCK_WIDTH;

  const blocks = isLoading
    ? Array.from({length: SKELETON_COUNT}).map((_, i) => (
        <Box key={i}
             w={cardWidth}
             h={BLOCK_HEIGHT}
             flexShrink={0}
             display={'flex'}
             flexDirection={'row'}
             alignItems={'center'}
             gap={'2'}
             px={'2'}
             borderRadius={'md'}
             border={'1px solid'}
             borderColor={'gray.100'}
             >
          <Skeleton boxSize={IMAGE_SIZE} flexShrink={0} />
          <Box flex={'1'}>
            <Skeleton h={'0.75rem'} w={'90%'} mb={'1'} />
            <Skeleton h={'0.75rem'} w={'60%'} />
          </Box>
        </Box>
      ))
    : orderedGroups.map((group) => (
        <GroupBlock key={group.key}
                    group={group}
                    badge={badgeByKey.get(group.key) ?? null}
                    isSelected={selected === group.key}
                    onSelect={() => onSelect(selected === group.key ? null : group.key)}
                    width={cardWidth}
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
              pt={BADGE_OVERLAP}
              overflowX={'auto'}
              onScroll={(e) => {
                const el = e.currentTarget;
                setIsScrolledToStart(el.scrollLeft <= 0);
                setIsScrolledToEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 1);
              }}
              sx={{
                scrollbarWidth: 'none',
                '::-webkit-scrollbar': { display: 'none' },
              }}
              >
          {blocks}
        </Flex>
        {hasOverflow && !isScrolledToStart && (
          <Box position={'absolute'}
               top={'0'} bottom={'0'} left={'0'}
               w={'10'}
               pointerEvents={'none'}
               bgGradient={'linear(to-l, rgba(237, 242, 247, 0), gray.100)'}
               />
        )}
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
      <Grid ref={gridRef}
            gap={'2'}
            pt={BADGE_OVERLAP}
            templateColumns={`repeat(${desktopColumnCount}, 1fr)`}
            >
        {blocks}
      </Grid>
    </Box>
  );
}
