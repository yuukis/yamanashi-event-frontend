import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { NextEventBanner } from '../components/NextEventBanner';
import { WidgetEventError } from '../components/WidgetEventItem';
import { fetchGroup, fetchGroupEvents } from '../utils/api';
import { extractErrorMessage } from '../utils/widgetEvents';
import { isFutureEvent } from '../utils/eventGroups';
import { sortByStartedAtAsc } from '../utils/eventSort';
import { WIDGET_NEXT_EVENT_FIELDS, WIDGET_GROUP_FIELDS } from '../utils/widgetFields';
import type { ApiEvent, ApiGroupDetail } from '../types/events';

type NextEventState = {
  isLoading: boolean;
  group: ApiGroupDetail | null;
  nextEvent: ApiEvent | null;
  errorMessage: string;
};

function WidgetNextEvent() {
  const { groupKey } = useParams<{ groupKey: string }>();
  const [data, setData] = useState<NextEventState>({
    isLoading: true,
    group: null,
    nextEvent: null,
    errorMessage: '',
  });

  useEffect(() => {
    if (!groupKey) {
      return;
    }
    let cancelled = false;
    setData({ isLoading: true, group: null, nextEvent: null, errorMessage: '' });
    (async () => {
      try {
        const [group, eventsPage] = await Promise.all([
          fetchGroup(groupKey, WIDGET_GROUP_FIELDS),
          fetchGroupEvents(groupKey, { fields: WIDGET_NEXT_EVENT_FIELDS }),
        ]);
        if (cancelled) {
          return;
        }
        const nextEvent = eventsPage.events.filter(isFutureEvent).sort(sortByStartedAtAsc)[0] ?? null;
        setData({ isLoading: false, group, nextEvent, errorMessage: '' });
      } catch (err) {
        if (cancelled) {
          return;
        }
        setData({ isLoading: false, group: null, nextEvent: null, errorMessage: extractErrorMessage(err) });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [groupKey]);

  document.title = 'Yamanashi Developer Hub - 次回イベント予定ウィジェット';

  if (!groupKey) {
    return <WidgetEventError message={'コミュニティが指定されていません'} />;
  }

  return <NextEventBanner {...data} />;
}

export default WidgetNextEvent;
