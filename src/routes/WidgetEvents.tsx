import { useSearchParams } from 'react-router-dom';
import { WidgetEventsPanel } from '../components/WidgetEventsPanel';
import { fetchEvents } from '../utils/api';
import { useWidgetEvents } from '../utils/widgetEvents';
import { parseWidgetLimit } from '../utils/widgetLimit';

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

function WidgetEvents() {
  const [searchParams] = useSearchParams();
  const limit = parseWidgetLimit(searchParams.get('limit'));
  const data = useWidgetEvents(() => fetchEvents(WIDGET_EVENTS_FIELDS));

  document.title = 'Yamanashi Developer Hub - イベント一覧ウィジェット';

  return <WidgetEventsPanel {...data} limit={limit} />;
}

export default WidgetEvents;
