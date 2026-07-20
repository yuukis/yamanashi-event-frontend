import { useParams, useSearchParams } from 'react-router-dom';
import { WidgetEventsPanel } from '../components/WidgetEventsPanel';
import { WidgetEventError } from '../components/WidgetEventItem';
import { fetchGroupEvents } from '../utils/api';
import { useWidgetEvents } from '../utils/widgetEvents';
import { parseWidgetLimit } from '../utils/widgetLimit';
import { WIDGET_EVENT_ITEM_FIELDS } from '../utils/widgetFields';

function WidgetGroupEvents() {
  const { groupKey } = useParams<{ groupKey: string }>();
  const [searchParams] = useSearchParams();
  const limit = parseWidgetLimit(searchParams.get('limit'));
  const data = useWidgetEvents(() => (
    groupKey
      ? fetchGroupEvents(groupKey, { fields: WIDGET_EVENT_ITEM_FIELDS })
      : Promise.resolve({ events: [] })
  ), [groupKey]);

  document.title = 'Yamanashi Developer Hub - コミュニティイベント一覧ウィジェット';

  if (!groupKey) {
    return <WidgetEventError message={'コミュニティが指定されていません'} />;
  }

  const heading = data.futureEvents[0]?.group_name ?? data.pastEvents[0]?.group_name ?? undefined;

  return <WidgetEventsPanel {...data} limit={limit} heading={heading} />;
}

export default WidgetGroupEvents;
