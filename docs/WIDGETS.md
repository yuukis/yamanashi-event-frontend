# Embeddable widgets (ブログパーツ)

Chrome-free pages listing upcoming and past events, meant to be embedded on external blogs via `<iframe>`.

`/guide` on the live site has a "ブログパーツ" section with a live preview and a one-click copy button for each widget below.

## All events

The `/widget/events` page can be embedded on any external site with an `<iframe>`:

```html
<iframe id="yamanashi-hub-widget-events"
        src="https://hub.yamanashi.dev/widget/events?limit=5"
        style="width:100%;border:0;"
        scrolling="no"
        title="山梨イベント情報"></iframe>
<script>
  (function () {
    var iframe = document.getElementById('yamanashi-hub-widget-events');
    if (!iframe) return;
    window.addEventListener('message', function (event) {
      if (event.source !== iframe.contentWindow) return;
      if (!event.data || event.data.type !== 'yamanashi-hub:widget-resize') return;
      var height = event.data.height;
      if (typeof height !== 'number' || !isFinite(height) || height < 0) return;
      iframe.style.height = height + 'px';
    });
  })();
</script>
```

- `limit` (optional) - number of events shown per list (直近開催イベント / 終了したイベント). Default `5`, clamped to `1`–`20`.
- The widget posts its content height to the parent window via `postMessage` whenever it changes; the script above listens for it and resizes the iframe. It matches on `event.source` (the iframe's own window), so it stays correct even if multiple widgets are embedded on the same page.

## A single community's events

The `/widget/groups/:groupKey/events` page shows the same two lists (直近開催イベント / 終了したイベント) scoped to one community. `groupKey` is the community's `key` as returned by the `/groups` API endpoint (e.g. `techmujin`):

```html
<iframe id="yamanashi-hub-widget-events-techmujin"
        src="https://hub.yamanashi.dev/widget/groups/techmujin/events?limit=5"
        style="width:100%;border:0;"
        scrolling="no"
        title="テック無尽 イベント情報"></iframe>
<script>
  (function () {
    var iframe = document.getElementById('yamanashi-hub-widget-events-techmujin');
    if (!iframe) return;
    window.addEventListener('message', function (event) {
      if (event.source !== iframe.contentWindow) return;
      if (!event.data || event.data.type !== 'yamanashi-hub:widget-resize') return;
      var height = event.data.height;
      if (typeof height !== 'number' || !isFinite(height) || height < 0) return;
      iframe.style.height = height + 'px';
    });
  })();
</script>
```

It supports the same `limit` parameter. Give each embedded widget's `<iframe>` its own unique `id` (as above) so its receiver script only ever resizes that one iframe.

## Mini calendar

The `/widget/calendar` page shows a one-month calendar grid with event days highlighted; hovering/focusing a highlighted day shows that day's events in a tooltip, and clicking a highlighted day opens a dialog listing that day's events with links to their primary source. It has its own month navigation (◀/▶, limited to 4 months before/after the current month) and does not take a `limit` parameter:

```html
<iframe id="yamanashi-hub-widget-calendar"
        src="https://hub.yamanashi.dev/widget/calendar"
        style="width:100%;border:0;"
        scrolling="no"
        title="山梨イベントカレンダー"></iframe>
<script>
  (function () {
    var iframe = document.getElementById('yamanashi-hub-widget-calendar');
    if (!iframe) return;
    window.addEventListener('message', function (event) {
      if (event.source !== iframe.contentWindow) return;
      if (!event.data || event.data.type !== 'yamanashi-hub:widget-resize') return;
      var height = event.data.height;
      if (typeof height !== 'number' || !isFinite(height) || height < 0) return;
      iframe.style.height = height + 'px';
    });
  })();
</script>
```

It uses the same height-resize `postMessage` mechanism as the other widgets.
