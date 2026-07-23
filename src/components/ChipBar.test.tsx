import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithChakra } from '../test/test-utils';
import { ChipBar } from './ChipBar';

describe('ChipBar', () => {
  it('renders a chip button for each item', () => {
    renderWithChakra(
      <ChipBar items={[{ value: 'react', label: 'React' }, { value: 'vue', label: 'Vue' }]}
               selected={null}
               onSelect={() => {}}
               />,
    );

    expect(screen.getByRole('button', { name: 'React' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Vue' })).toBeInTheDocument();
  });

  it('calls onSelect with the item value when an unselected chip is clicked', () => {
    const onSelect = vi.fn();
    renderWithChakra(
      <ChipBar items={[{ value: 'react', label: 'React' }]}
               selected={null}
               onSelect={onSelect}
               />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'React' }));

    expect(onSelect).toHaveBeenCalledWith('react');
  });

  it('calls onSelect with null when the already-selected chip is clicked', () => {
    const onSelect = vi.fn();
    renderWithChakra(
      <ChipBar items={[{ value: 'react', label: 'React' }]}
               selected={'react'}
               onSelect={onSelect}
               />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'React' }));

    expect(onSelect).toHaveBeenCalledWith(null);
  });

  it('appends the selected value as an extra chip when it is missing from items', () => {
    renderWithChakra(
      <ChipBar items={[{ value: 'react', label: 'React' }]}
               selected={'vue'}
               onSelect={() => {}}
               />,
    );

    expect(screen.getByRole('button', { name: 'React' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'vue' })).toBeInTheDocument();
  });

  it('renders nothing when there are no items and nothing selected', () => {
    const { container } = renderWithChakra(
      <ChipBar items={[]} selected={null} onSelect={() => {}} />,
    );

    expect(container.querySelector('.chip-bar')).toBeNull();
  });

  it('still renders a single chip for the selected value when items is empty', () => {
    renderWithChakra(
      <ChipBar items={[]} selected={'react'} onSelect={() => {}} />,
    );

    expect(screen.getByRole('button', { name: 'react' })).toBeInTheDocument();
  });
});
