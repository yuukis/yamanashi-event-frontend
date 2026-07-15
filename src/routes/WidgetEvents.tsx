import { useSearchParams } from 'react-router-dom';
import { WidgetEventsPanel } from '../components/WidgetEventsPanel';
import { fetchEvents } from '../utils/api';
import { useWidgetEvents } from '../utils/widgetEvents';
import { parseWidgetLimit } from '../utils/widgetLimit';
import { WIDGET_EVENT_ITEM_FIELDS } from '../utils/widgetFields';

function WidgetEvents() {
  const [searchParams] = useSearchParams();
  const limit = parseWidgetLimit(searchParams.get('limit'));
  const data = useWidgetEvents(() => fetchEvents(WIDGET_EVENT_ITEM_FIELDS), []);

  document.title = 'Yamanashi Developer Hub - イベント一覧ウィジェット';

  return <WidgetEventsPanel {...data} limit={limit} />;
}

export default WidgetEvents;
