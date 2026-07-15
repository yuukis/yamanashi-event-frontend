import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Box, Heading, Stack, Text, Link } from '@chakra-ui/react';
import {
  WidgetEventItem,
  WidgetEventSkeleton,
  WidgetEventEmpty,
  WidgetEventError,
} from '../components/WidgetEventItem';
import { fetchEvents } from '../utils/api';
import { isFutureEvent, isPastEvent } from '../utils/eventGroups';
import { sortByStartedAtAsc, sortByStartedAtDesc } from '../utils/eventSort';
import { subscribeNow, getNow } from '../utils/nowTicker';
import { mergeTrackingData } from '../utils/newEventTracking';
import { isLocalStorageAvailable, updateTrackingData } from '../utils/newEventTrackingStore';
import { parseWidgetLimit } from '../utils/widgetLimit';
import { useReportWidgetHeight } from '../utils/widgetResize';
import type { ApiEvent } from '../types/events';

// WidgetEventItem が実際に描画するフィールドのみ要求する(グループの
// 画像/アーカイブ情報や description、keywords 等は不要なため /groups への
// 問い合わせ自体も行わない)。
const WIDGET_EVENTS_FIELDS = [
  'uid',
  'title',
  'event_url',
  'started_at',
  'ended_at',
  'updated_at',
  'open_status',
  'owner_name',
  'place',
  'address',
  'group_name',
].join(',');

type WidgetEventsState = {
  isLoading: boolean;
  pastEvents: ApiEvent[];
  futureEvents: ApiEvent[];
  errorMessage: string;
};

function WidgetEvents() {
  const [searchParams] = useSearchParams();
  const limit = parseWidgetLimit(searchParams.get('limit'));
  const [data, setData] = useState<WidgetEventsState>({
    isLoading: true,
    pastEvents: [],
    futureEvents: [],
    errorMessage: '',
  });
  const now = useSyncExternalStore(subscribeNow, getNow);
  const containerRef = useRef<HTMLDivElement>(null);
  useReportWidgetHeight(containerRef);

  document.title = 'Yamanashi Developer Hub - イベント一覧ウィジェット';

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const eventsResponse = await fetchEvents(WIDGET_EVENTS_FIELDS);
        if (cancelled) {
          return;
        }
        const events = eventsResponse.events;
        setData({
          isLoading: false,
          pastEvents: events.filter(isPastEvent).sort(sortByStartedAtDesc),
          futureEvents: events.filter(isFutureEvent).sort(sortByStartedAtAsc),
          errorMessage: '',
        });
      } catch (err: any) {
        if (cancelled) {
          return;
        }
        setData({ isLoading: false, pastEvents: [], futureEvents: [], errorMessage: err.message });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isLocalStorageAvailable() || data.futureEvents.length === 0) {
      return;
    }
    // NEWバッジ判定用のfirstSeenAt記録。60秒ごとのnowティックでは書き込みが
    // 走らないよう、依存配列にnowを含めない(Notification.tsxと同じ方針)。
    updateTrackingData((previous) => mergeTrackingData(previous, data.futureEvents, now));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.futureEvents]);

  const futureEvents = useMemo(() => data.futureEvents.slice(0, limit), [data.futureEvents, limit]);
  const pastEvents = useMemo(() => data.pastEvents.slice(0, limit), [data.pastEvents, limit]);

  const renderList = (events: ApiEvent[]) => {
    if (data.isLoading) {
      return <WidgetEventSkeleton />;
    }
    if (data.errorMessage) {
      return <WidgetEventError message={data.errorMessage} />;
    }
    if (events.length === 0) {
      return <WidgetEventEmpty />;
    }
    return events.map((event) => <WidgetEventItem key={event.uid} event={event} />);
  };

  return (
    <Box ref={containerRef} bg={'white'} p={'4'}>
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

export default WidgetEvents;
