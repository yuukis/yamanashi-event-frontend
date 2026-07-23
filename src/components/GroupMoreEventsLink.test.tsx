import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithChakra } from '../test/test-utils';
import { GroupMoreEventsLink } from './GroupMoreEventsLink';

describe('GroupMoreEventsLink', () => {
  it('renders a link to the group page with the group name in the label', () => {
    renderWithChakra(<GroupMoreEventsLink groupKey={'aibase'} groupName={'AI BASE'} />);

    const link = screen.getByRole('link', { name: 'AI BASE 全イベントを見る' });
    expect(link).toHaveAttribute('href', '/groups/aibase');
  });

  it('renders the group avatar image when imageUrl is given', () => {
    renderWithChakra(
      <GroupMoreEventsLink groupKey={'aibase'} groupName={'AI BASE'} imageUrl={'https://example.com/aibase.png'} />,
    );

    expect(screen.getByRole('img', { name: 'AI BASE' })).toHaveAttribute('src', 'https://example.com/aibase.png');
  });

  it('falls back to a placeholder icon when imageUrl is not given', () => {
    renderWithChakra(<GroupMoreEventsLink groupKey={'aibase'} groupName={'AI BASE'} />);

    expect(screen.queryByRole('img')).toBeNull();
  });
});
