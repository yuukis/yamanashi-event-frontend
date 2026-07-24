import { Stack, SimpleGrid } from '@chakra-ui/react';
import { AnimatePresence } from 'framer-motion';
import { AnimatedEventItem, EVENT_LIST_SPACING, EVENT_LIST_SPACING_COMPACT } from './AnimatedEventItem';
import { EventBody } from './EventBody';
import { EventBodyCompact } from './EventBodyCompact';
import { EventCard } from './EventCard';
import type { ViewMode } from '../utils/viewMode';
import type { EventWithGroup } from '../types/events';

export type EventListItem = {
  event: EventWithGroup;
  anchorId?: string;
  // 個々のイベントの開催年でAI要約キャッシュを分ける必要がある場合
  // (例: コミュニティページの過去イベントは年をまたぐ)に指定する。
  // 省略時は summaryDescriptionYear (呼び出し元全体の既定値) を使う。
  summaryDescriptionYear?: number;
};

type EventListViewProps = {
  items: EventListItem[];
  viewMode: ViewMode;
  section?: string;
  selectedKeyword?: string | null;
  onKeywordClick?: (keyword: string) => void;
  enableSummarizer?: boolean;
  summaryDescriptionYear?: number;
};

export function EventListView({
  items,
  viewMode,
  section,
  selectedKeyword,
  onKeywordClick,
  enableSummarizer,
  summaryDescriptionYear,
}: EventListViewProps) {
  if (viewMode === 'grid') {
    return (
      <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} spacing={{ base: '3', md: '4' }}>
        <AnimatePresence initial={false}>
          {items.map(({ event, anchorId }) => (
            <AnimatedEventItem key={event.uid} date={event.started_at} section={section} variant={'grid'}>
              <EventCard event={event} anchorId={anchorId} />
            </AnimatedEventItem>
          ))}
        </AnimatePresence>
      </SimpleGrid>
    );
  }

  const compact = viewMode === 'compact';
  const EventBodyComponent = compact ? EventBodyCompact : EventBody;

  return (
    <Stack spacing={compact ? EVENT_LIST_SPACING_COMPACT : EVENT_LIST_SPACING}
           // コンパクト表示は行間が詰まっているぶん、CardBodyの固定padding
           // (デスクトップのみ)が先頭行の上・末尾行の下だけ相対的に広く
           // 見えてしまう。行間と揃うよう見た目上の余白を打ち消す。
           mt={compact ? { base: '0', md: '-14px' } : '0'}
           mb={compact ? { base: '0', md: '-14px' } : '0'}
           >
      <AnimatePresence initial={false}>
        {items.map(({ event, anchorId, summaryDescriptionYear: itemSummaryDescriptionYear }) => (
          <AnimatedEventItem key={event.uid} date={event.started_at} section={section} variant={compact ? 'compact' : 'list'}>
            <EventBodyComponent event={event}
                                anchorId={anchorId}
                                selectedKeyword={selectedKeyword}
                                onKeywordClick={onKeywordClick}
                                enableSummarizer={enableSummarizer}
                                summaryDescriptionYear={itemSummaryDescriptionYear ?? summaryDescriptionYear}
                                />
          </AnimatedEventItem>
        ))}
      </AnimatePresence>
    </Stack>
  );
}
