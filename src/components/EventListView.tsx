import { Stack, SimpleGrid } from '@chakra-ui/react';
import { AnimatePresence } from 'framer-motion';
import { AnimatedEventItem, EVENT_LIST_SPACING, EVENT_LIST_SPACING_COMPACT } from './AnimatedEventItem';
import { EventBody, SkeletonEventBody } from './EventBody';
import { EventBodyCompact, SkeletonEventBodyCompact } from './EventBodyCompact';
import { EventCard, SkeletonEventCard } from './EventCard';
import type { ViewMode } from '../utils/viewMode';
import type { EventWithGroup } from '../types/events';

const GRID_SKELETON_COUNT = 6;

export type EventListItem = {
  event: EventWithGroup;
  anchorId?: string;
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
      <SimpleGrid columns={{ base: 2, md: 3 }}
                  spacingX={{ base: '2', md: '4' }}
                  spacingY={{ base: '6', md: '8' }}
                  px={{ base: '4', md: '0' }}
                  pt={'5'}
                  >
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

export function SkeletonEventListView({ viewMode }: { viewMode: ViewMode }) {
  if (viewMode === 'grid') {
    return (
      <SimpleGrid columns={{ base: 2, md: 3 }}
                  spacingX={{ base: '2', md: '4' }}
                  spacingY={{ base: '6', md: '8' }}
                  px={{ base: '4', md: '0' }}
                  pt={'5'}
                  >
        {Array.from({ length: GRID_SKELETON_COUNT }).map((_, i) => (
          <SkeletonEventCard key={i} />
        ))}
      </SimpleGrid>
    );
  }

  if (viewMode === 'compact') {
    return <SkeletonEventBodyCompact />;
  }

  return <SkeletonEventBody />;
}
