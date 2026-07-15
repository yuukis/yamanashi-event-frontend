import { useParams, useSearchParams } from 'react-router-dom';
import { WidgetEventsPanel } from '../components/WidgetEventsPanel';
import { WidgetEventError } from '../components/WidgetEventItem';
import { fetchGroupEvents } from '../utils/api';
import { useWidgetEvents } from '../utils/widgetEvents';
import { parseWidgetLimit } from '../utils/widgetLimit';

const WIDGET_GROUP_EVENTS_FIELDS = [
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

function WidgetGroupEvents() {
  const { groupKey } = useParams<{ groupKey: string }>();
  const [searchParams] = useSearchParams();
  const limit = parseWidgetLimit(searchParams.get('limit'));
  const data = useWidgetEvents(() => (
    groupKey
      ? fetchGroupEvents(groupKey, WIDGET_GROUP_EVENTS_FIELDS)
      : Promise.resolve({ events: [] })
  ));

  document.title = 'Yamanashi Developer Hub - コミュニティイベント一覧ウィジェット';

  if (!groupKey) {
    return <WidgetEventError message={'コミュニティが指定されていません'} />;
  }

  const heading = data.futureEvents[0]?.group_name ?? data.pastEvents[0]?.group_name ?? undefined;

  return <WidgetEventsPanel {...data} limit={limit} heading={heading} />;
}

export default WidgetGroupEvents;
