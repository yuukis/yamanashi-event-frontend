import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithChakra } from '../test/test-utils';
import { CopySnippetBlock } from './CopySnippetBlock';

describe('CopySnippetBlock', () => {
  it('shows the code in a read-only textarea', () => {
    renderWithChakra(<CopySnippetBlock code={'<iframe></iframe>'} />);

    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveValue('<iframe></iframe>');
    expect(textarea).toHaveAttribute('readonly');
  });

  it('copies the code to the clipboard and shows a success toast', async () => {
    const writeTextSpy = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();
    renderWithChakra(<CopySnippetBlock code={'snippet-code'} />);

    fireEvent.click(screen.getByRole('button', { name: 'コピー' }));

    expect(writeTextSpy).toHaveBeenCalledWith('snippet-code');
    await screen.findByText('コピーしました');

    writeTextSpy.mockRestore();
  });

  it('shows an error toast when the Clipboard API is unavailable', async () => {
    const originalClipboard = navigator.clipboard;
    Reflect.deleteProperty(navigator, 'clipboard');
    renderWithChakra(<CopySnippetBlock code={'snippet-code'} />);

    fireEvent.click(screen.getByRole('button', { name: 'コピー' }));

    await screen.findByText('コピーに失敗しました');

    Object.defineProperty(navigator, 'clipboard', { value: originalClipboard, configurable: true });
  });
});
