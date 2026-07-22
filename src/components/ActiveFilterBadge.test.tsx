import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithChakra } from '../test/test-utils';
import { ActiveFilterBadge } from './ActiveFilterBadge';

function getByBadgeText(text: string) {
  return screen.getByText((_, element) => element?.tagName === 'P' && element.textContent === text);
}

describe('ActiveFilterBadge', () => {
  it('renders nothing when no keyword or group is selected', () => {
    renderWithChakra(
      <ActiveFilterBadge selectedKeyword={null}
                          selectedGroupName={null}
                          onClearKeyword={() => {}}
                          onClearGroup={() => {}}
                          />,
    );

    expect(screen.queryByRole('button', { name: '絞り込みを解除' })).not.toBeInTheDocument();
  });

  it('shows the keyword filter label when a keyword is selected', () => {
    renderWithChakra(
      <ActiveFilterBadge selectedKeyword={'React'}
                          selectedGroupName={null}
                          onClearKeyword={() => {}}
                          onClearGroup={() => {}}
                          />,
    );

    expect(getByBadgeText('React で絞り込み中')).toBeInTheDocument();
  });

  it('shows the group filter label when a group is selected', () => {
    renderWithChakra(
      <ActiveFilterBadge selectedKeyword={null}
                          selectedGroupName={'甲府もくもく会'}
                          onClearKeyword={() => {}}
                          onClearGroup={() => {}}
                          />,
    );

    expect(getByBadgeText('甲府もくもく会 で絞り込み中')).toBeInTheDocument();
  });

  it('prefers the group label and clear handler when both are provided', () => {
    const onClearGroup = vi.fn();
    const onClearKeyword = vi.fn();
    renderWithChakra(
      <ActiveFilterBadge selectedKeyword={'React'}
                          selectedGroupName={'甲府もくもく会'}
                          onClearKeyword={onClearKeyword}
                          onClearGroup={onClearGroup}
                          />,
    );

    expect(getByBadgeText('甲府もくもく会 で絞り込み中')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '絞り込みを解除' }));

    return waitFor(() => {
      expect(onClearGroup).toHaveBeenCalledTimes(1);
      expect(onClearKeyword).not.toHaveBeenCalled();
    });
  });

  it('calls onClearKeyword when clearing a keyword-only filter', () => {
    const onClearKeyword = vi.fn();
    renderWithChakra(
      <ActiveFilterBadge selectedKeyword={'React'}
                          selectedGroupName={null}
                          onClearKeyword={onClearKeyword}
                          onClearGroup={() => {}}
                          />,
    );

    fireEvent.click(screen.getByRole('button', { name: '絞り込みを解除' }));

    return waitFor(() => expect(onClearKeyword).toHaveBeenCalledTimes(1));
  });
});
