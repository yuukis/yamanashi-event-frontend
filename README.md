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
- **Embeddable widgets (ブログパーツ)** - Chrome-free pages (event lists and a mini calendar) meant to be embedded on external blogs via `<iframe>`. See [docs/WIDGETS.md](docs/WIDGETS.md) for embed tags and options.

Event data is sourced from [connpass](https://connpass.com) and community-provided event calendars/archives.

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
