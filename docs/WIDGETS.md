# Embeddable widgets (ブログパーツ)

Chrome-free pages listing upcoming and past events, meant to be embedded on external blogs via `<iframe>`.

## All events

The `/widget/events` page can be embedded on any external site with an `<iframe>`:

```html
<iframe src="https://hub.yamanashi.dev/widget/events?limit=5"
        style="width:100%;border:0;"
        scrolling="no"
        title="山梨イベント情報"></iframe>
```

- `limit` (optional) - number of events shown per list (直近開催イベント / 終了したイベント). Default `5`, clamped to `1`–`20`.
- The widget posts its content height to the parent window via `postMessage` whenever it changes, so the embedding page can auto-resize the iframe. Add a small receiver script next to the iframe tag:

```html
<script>
  window.addEventListener('message', function (event) {
    if (event.origin !== 'https://hub.yamanashi.dev') return;
    if (!event.data || event.data.type !== 'yamanashi-hub:widget-resize') return;
    var iframe = document.querySelector('iframe[src*="hub.yamanashi.dev/widget/events"]');
    if (iframe) iframe.style.height = event.data.height + 'px';
  });
</script>
```

## A single community's events

The `/widget/groups/:groupKey/events` page shows the same two lists (直近開催イベント / 終了したイベント) scoped to one community. `groupKey` is the community's `key` as returned by the `/groups` API endpoint (e.g. `techmujin`):

```html
<iframe src="https://hub.yamanashi.dev/widget/groups/techmujin/events?limit=5"
        style="width:100%;border:0;"
        scrolling="no"
        title="テック無尽 イベント情報"></iframe>
```

It supports the same `limit` parameter and height-resize `postMessage` mechanism (match the receiver script's selector to the embedded iframe's `src`, or use a selector that matches both widgets, e.g. `iframe[src*="hub.yamanashi.dev/widget/"]`).

## Mini calendar

The `/widget/calendar` page shows a one-month calendar grid with event days highlighted; hovering/focusing a highlighted day shows that day's events in a tooltip. It has its own month navigation (◀/▶) and does not take a `limit` parameter:

```html
<iframe src="https://hub.yamanashi.dev/widget/calendar"
        style="width:100%;border:0;"
        scrolling="no"
        title="山梨イベントカレンダー"></iframe>
```

It uses the same height-resize `postMessage` mechanism as the other widgets, so the same receiver script works for all three (match its selector against `iframe[src*="hub.yamanashi.dev/widget/"]` to cover them all).
