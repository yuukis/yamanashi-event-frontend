# Yamanashi Developer Hub

![top](https://github.com/user-attachments/assets/7afcccb5-56b9-49dd-bece-a0e12d932649)

## About the project

This project is a web application that displays tech events in Yamanashi prefecture.

This application is available at the following URL.

https://hub.yamanashi.dev

## Features

- **Event listing** - Browse upcoming and past tech events in Yamanashi, grouped by year, with today's/ongoing events highlighted.
- **Filter by keyword or community** - Narrow down events by keyword tag or by the community (group) hosting them.
- **Event calendar** - View a monthly mini calendar of events from the header, with a shareable iCalendar URL to subscribe from external calendar apps.
- **New event indicators** - Newly added events are marked with a "NEW"/"新着あり" badge and an unread dot on the notification bell.
- **Push notifications** - Opt in to browser push notifications so you don't miss newly added events.
- **Guide page** - A `/guide` page introducing the site and how to get started attending community events.
- **Embeddable widgets (ブログパーツ)** - Chrome-free pages listing upcoming and past events, meant to be embedded on external blogs via `<iframe>`: `/widget/events` for all events, `/widget/groups/:groupKey/events` for a single community's events.

Event data is sourced from [connpass](https://connpass.com) and community-provided event calendars/archives.

## Embedding the events widget

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

### A single community's events

The `/widget/groups/:groupKey/events` page shows the same two lists (直近開催イベント / 終了したイベント) scoped to one community. `groupKey` is the community's `key` as returned by the `/groups` API endpoint (e.g. `techmujin`):

```html
<iframe src="https://hub.yamanashi.dev/widget/groups/techmujin/events?limit=5"
        style="width:100%;border:0;"
        scrolling="no"
        title="テック無尽 イベント情報"></iframe>
```

It supports the same `limit` parameter and height-resize `postMessage` mechanism (match the receiver script's selector to the embedded iframe's `src`, or use a selector that matches both widgets, e.g. `iframe[src*="hub.yamanashi.dev/widget/"]`).

## Getting Started

### Prerequisites

- Node.js 21.4.0
- Yarn 1.22.21

### Installation

1. Clone the repo
   ```sh
   $ git clone
    ```
2. Install packages
    ```sh
    $ yarn install
    ```
3. Run the app
    ```sh
    $ yarn dev
    ```
4. Open http://localhost:5173

### Running tests

This project uses [Vitest](https://vitest.dev) and [React Testing Library](https://testing-library.com/react).

```sh
$ yarn test        # watch mode
$ yarn test:run     # run once (CI)
```

## License

Distributed under the Apache License, Version 2.0. See `LICENSE` for more information.

## Contact

Yuuki Shimizu - [@yuuki_maxio](https://x.com/yuuki_maxio) 

## Acknowledgements

* [shingen.py](https://shingenpy.connpass.com)
  - python user community in Yamanashi, Japan
* [Connpass](https://connpass.com)
