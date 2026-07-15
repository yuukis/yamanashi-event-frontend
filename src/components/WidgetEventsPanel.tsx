import { useRef } from 'react';
import { Box, Heading, Stack, Text, Link } from '@chakra-ui/react';
import {
  WidgetEventItem,
  WidgetEventSkeleton,
  WidgetEventEmpty,
  WidgetEventError,
} from './WidgetEventItem';
import { useReportWidgetHeight } from '../utils/widgetResize';
import type { ApiEvent } from '../types/events';

type WidgetEventsPanelProps = {
  isLoading: boolean;
  futureEvents: ApiEvent[];
  pastEvents: ApiEvent[];
  errorMessage: string;
  limit: number;
  heading?: string;
};

export function WidgetEventsPanel({ isLoading, futureEvents, pastEvents, errorMessage, limit, heading }: WidgetEventsPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  useReportWidgetHeight(containerRef);

  const renderList = (events: ApiEvent[]) => {
    if (isLoading) {
      return <WidgetEventSkeleton />;
    }
    if (errorMessage) {
      return <WidgetEventError message={errorMessage} />;
    }
    if (events.length === 0) {
      return <WidgetEventEmpty />;
    }
    return events.slice(0, limit).map((event) => <WidgetEventItem key={event.uid} event={event} />);
  };

  return (
    <Box ref={containerRef} bg={'white'} p={'4'}>
      {heading && (
        <Heading size={'md'} mb={'4'}>{ heading }</Heading>
      )}

      <Heading size={'sm'} mb={'2'} color={'gray.600'}>直近開催イベント</Heading>
      <Stack spacing={'1'} mb={'6'} divider={<Box borderBottomWidth={'1px'} borderColor={'gray.100'} />}>
        { renderList(futureEvents) }
      </Stack>

      <Heading size={'sm'} mb={'2'} color={'gray.600'}>終了したイベント</Heading>
      <Stack spacing={'1'} mb={'4'} divider={<Box borderBottomWidth={'1px'} borderColor={'gray.100'} />}>
        { renderList(pastEvents) }
      </Stack>

      <Text fontSize={'xs'} color={'gray.400'} textAlign={'right'}>
        Powered by{' '}
        <Link href={'https://hub.yamanashi.dev'} isExternal color={'primary.700'}>
          Yamanashi Developer Hub
        </Link>
      </Text>
    </Box>
  );
}
