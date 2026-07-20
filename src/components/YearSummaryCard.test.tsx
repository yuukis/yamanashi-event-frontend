import { describe, it, expect } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithChakra } from '../test/test-utils';
import { YearSummaryCard } from './YearSummaryCard';
import type { ApiGroupActivity, ApiHeatmapBucket, ApiYearSummary } from '../types/events';

function makeYearSummary(overrides: Partial<ApiYearSummary> = {}): ApiYearSummary {
  return { year: 2020, event_count: 0, groups: [], ...overrides };
}

function makeGroupActivity(overrides: Partial<ApiGroupActivity> = {}): ApiGroupActivity {
  return { key: 'group-1', name: 'Group 1', event_count: 1, ...overrides };
}

function makeMonths(counts: number[]): ApiHeatmapBucket[] {
  return counts.map((count, i) => ({ period: `2020-${String(i + 1).padStart(2, '0')}`, count }));
}

describe('YearSummaryCard', () => {
  it('links the year to its /events/:year page', () => {
    renderWithChakra(
      <YearSummaryCard summary={makeYearSummary({ year: 2019 })} months={makeMonths(Array(12).fill(0))} maxMonthCount={0} />,
    );

    expect(screen.getByRole('link', { name: '2019' })).toHaveAttribute('href', '/events/2019');
  });

  it('shows "活動記録なし" when the year has no groups', () => {
    renderWithChakra(
      <YearSummaryCard summary={makeYearSummary({ groups: [] })} months={makeMonths(Array(12).fill(0))} maxMonthCount={0} />,
    );

    expect(screen.getByText('活動記録なし')).toBeInTheDocument();
  });

  it('does not show the empty state when the year has groups', () => {
    renderWithChakra(
      <YearSummaryCard summary={makeYearSummary({ groups: [makeGroupActivity()] })}
                       months={makeMonths(Array(12).fill(0))}
                       maxMonthCount={0}
                       />,
    );

    expect(screen.queryByText('活動記録なし')).not.toBeInTheDocument();
  });

  it('renders every group as an avatar, with no cap or overflow indicator', () => {
    const groups = Array.from({length: 9}).map((_, i) => makeGroupActivity({ key: `g${i}`, name: `Group ${i}` }));
    const { container } = renderWithChakra(
      <YearSummaryCard summary={makeYearSummary({ groups })} months={makeMonths(Array(12).fill(0))} maxMonthCount={0} />,
    );

    expect(container.querySelectorAll('[data-avatar]')).toHaveLength(9);
    expect(screen.queryByText(/^\+\d+$/)).not.toBeInTheDocument();
  });

  it('renders one bar per month bucket', () => {
    const { container } = renderWithChakra(
      <YearSummaryCard summary={makeYearSummary()} months={makeMonths(Array(12).fill(0))} maxMonthCount={0} />,
    );

    expect(container.querySelectorAll('[data-month-bar]')).toHaveLength(12);
  });

  it('reveals a month bar tooltip on hover', async () => {
    const months = makeMonths([0, 0, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    const { container } = renderWithChakra(
      <YearSummaryCard summary={makeYearSummary()} months={months} maxMonthCount={5} />,
    );

    const bar = container.querySelector('[data-month-bar="2020-03"]') as HTMLElement;
    fireEvent.pointerEnter(bar);

    expect(await screen.findByText('3月: 5件')).toBeInTheDocument();
  });

  it('reveals a month bar tooltip on keyboard focus, not only on hover', async () => {
    const months = makeMonths([0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0]);
    const { container } = renderWithChakra(
      <YearSummaryCard summary={makeYearSummary()} months={months} maxMonthCount={2} />,
    );

    const bar = container.querySelector('[data-month-bar="2020-08"]') as HTMLElement;
    expect(bar).toHaveAttribute('tabindex', '0');

    fireEvent.focus(bar);

    expect(await screen.findByText('8月: 2件')).toBeInTheDocument();
  });

  it('links each group avatar to its /groups/:key community page', () => {
    renderWithChakra(
      <YearSummaryCard summary={makeYearSummary({ groups: [makeGroupActivity({ key: 'aibase', name: 'AI BASE' })] })}
                       months={makeMonths(Array(12).fill(0))}
                       maxMonthCount={0}
                       />,
    );

    expect(screen.getByRole('link', { name: 'AI BASEのページを見る' })).toHaveAttribute('href', '/groups/aibase');
  });

  it('reveals a community avatar tooltip on keyboard focus, not only on hover', async () => {
    const { container } = renderWithChakra(
      <YearSummaryCard summary={makeYearSummary({ groups: [makeGroupActivity({ key: 'g1', name: 'shingen.py' })] })}
                       months={makeMonths(Array(12).fill(0))}
                       maxMonthCount={0}
                       />,
    );

    const avatar = container.querySelector('[data-avatar="g1"]') as HTMLElement;
    expect(avatar).toHaveAttribute('tabindex', '0');

    fireEvent.focus(avatar);

    expect(await screen.findByText('shingen.py')).toBeInTheDocument();
  });
});
