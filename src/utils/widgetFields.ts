// WidgetEventItem が描画に使うフィールドの一覧。/events系APIの
// fields クエリに渡す値として、各ウィジェットルートから再利用する。
export const WIDGET_EVENT_ITEM_FIELDS = [
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
