import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithChakra } from '../test/test-utils';
import { WidgetEventsPanel } from './WidgetEventsPanel';
import { makeEvent } from '../test/fixtures';

const FIXED_NOW = new Date('2026-01-10T12:00:00+09:00');

vi.mock('../utils/nowTicker', () => ({
  subscribeNow: () => () => {},
  getNow: () => FIXED_NOW,
}));

describe('WidgetEventsPanel', () => {
  it('shows both section headings and the attribution link', () => {
    renderWithChakra(
      <WidgetEventsPanel isLoading={false}
                          futureEvents={[]}
                          pastEvents={[]}
                          errorMessage={''}
                          limit={5}
                          />,
    );

    expect(screen.getByText('直近開催イベント')).toBeInTheDocument();
    expect(screen.getByText('終了したイベント')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Yamanashi Developer Hub' })).toHaveAttribute('href', 'https://hub.yamanashi.dev');
  });

  it('renders an optional heading when provided', () => {
    renderWithChakra(
      <WidgetEventsPanel isLoading={false}
                          futureEvents={[]}
                          pastEvents={[]}
                          errorMessage={''}
                          limit={5}
                          heading={'テック無尽'}
                          />,
    );

    expect(screen.getByText('テック無尽')).toBeInTheDocument();
  });

  it('omits the heading element when not provided', () => {
    const { container } = renderWithChakra(
      <WidgetEventsPanel isLoading={false}
                          futureEvents={[]}
                          pastEvents={[]}
                          errorMessage={''}
                          limit={5}
                          />,
    );

    expect(container.querySelectorAll('h2, h3').length).toBe(2);
  });

  it('clamps each list to the given limit', () => {
    const futureEvents = Array.from({ length: 5 }, (_, i) => makeEvent({ uid: `future-${i}`, title: `Future ${i}` }));

    renderWithChakra(
      <WidgetEventsPanel isLoading={false}
                          futureEvents={futureEvents}
                          pastEvents={[]}
                          errorMessage={''}
                          limit={2}
                          />,
    );

    expect(screen.getAllByRole('link', { name: /^Future \d$/ })).toHaveLength(2);
  });

  it('shows the empty state when a list has no events', () => {
    renderWithChakra(
      <WidgetEventsPanel isLoading={false}
                          futureEvents={[]}
                          pastEvents={[]}
                          errorMessage={''}
                          limit={5}
                          />,
    );

    expect(screen.getAllByText('イベントはありません')).toHaveLength(2);
  });

  it('shows the error state instead of the list when errorMessage is set', () => {
    renderWithChakra(
      <WidgetEventsPanel isLoading={false}
                          futureEvents={[]}
                          pastEvents={[]}
                          errorMessage={'Network Error'}
                          limit={5}
                          />,
    );

    expect(screen.getAllByText('イベント情報の取得に失敗しました')).toHaveLength(2);
    expect(screen.getAllByText('Network Error')).toHaveLength(2);
  });
});
