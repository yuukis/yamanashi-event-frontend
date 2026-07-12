import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithChakra, mockMatchMedia } from '../test/test-utils';
import { fetchEventDescription } from '../utils/api';
import { EventDescriptionSummary } from './EventDescriptionSummary';

vi.mock('../utils/api', () => ({
  fetchEventDescription: vi.fn(),
}));

function renderSummary(props?: Partial<Parameters<typeof EventDescriptionSummary>[0]>) {
  return renderWithChakra(
    <EventDescriptionSummary eventUid={'event-1'}
                             eventTitle={'React入門'}
                             eventUrl={'https://example.com/event/1'}
                             enabled
                             {...props}
                             />,
  );
}

describe('EventDescriptionSummary', () => {
  beforeEach(() => {
    vi.mocked(fetchEventDescription).mockReset();
  });

  afterEach(() => {
    Reflect.deleteProperty(window, 'Summarizer');
  });

  it('does not show the summary button unless summarizer UI is enabled', () => {
    mockMatchMedia(true);
    renderSummary({ enabled: false });

    expect(screen.queryByRole('button', { name: 'どんなイベント？（AI要約）' })).not.toBeInTheDocument();
  });

  it('does not show the summary button on mobile even when summarizer UI is enabled', async () => {
    mockMatchMedia(false);
    const availability = vi.fn().mockResolvedValue('available');
    Object.defineProperty(window, 'Summarizer', {
      value: { availability, create: vi.fn() },
      configurable: true,
    });

    renderSummary();

    await waitFor(() => {
      expect(availability).not.toHaveBeenCalled();
    });
    expect(screen.queryByRole('button', { name: 'どんなイベント？（AI要約）' })).not.toBeInTheDocument();
    expect(fetchEventDescription).not.toHaveBeenCalled();
  });

  it('streams the event description summary with Chrome Summarizer API', async () => {
    mockMatchMedia(true);
    let resolveDescription: (description: string) => void;
    vi.mocked(fetchEventDescription).mockReturnValue(
      new Promise((resolve) => {
        resolveDescription = resolve;
      }),
    );
    let resolveStream: () => void;
    let resolveSecondChunk: () => void;
    async function* streamSummary() {
      await new Promise<void>((resolve) => {
        resolveStream = resolve;
      });
      yield '- 初心者向けのReact勉強会です。';
      await new Promise<void>((resolve) => {
        resolveSecondChunk = resolve;
      });
      yield '\n- ハンズオンで基礎を学べます。';
    }
    const downloadMonitor = new EventTarget();
    const summarizeStreaming = vi.fn().mockReturnValue(streamSummary());
    const destroy = vi.fn();
    const availability = vi.fn().mockResolvedValue('downloadable');
    const create = vi.fn().mockImplementation((options) => {
      options.monitor?.(downloadMonitor);
      const progressEvent = new Event('downloadprogress') as ProgressEvent;
      Object.defineProperty(progressEvent, 'loaded', { value: 0.42 });
      downloadMonitor.dispatchEvent(progressEvent);
      return Promise.resolve({ summarizeStreaming, destroy });
    });
    Object.defineProperty(window, 'Summarizer', {
      value: { availability, create },
      configurable: true,
    });

    renderSummary();

    fireEvent.click(await screen.findByRole('button', { name: 'どんなイベント？（AI要約）' }));

    expect(await screen.findByText(/^確認中/)).toBeInTheDocument();
    resolveDescription!('Reactの基礎をハンズオンで学ぶイベントです。');
    expect(await screen.findByText(/^AIモデルをダウンロード中... 42%/)).toBeInTheDocument();
    resolveStream!();

    expect((await screen.findByText('初心者向けのReact勉強会です。')).tagName).toBe('LI');
    expect(screen.getByTestId('summary-terminal-cursor')).toBeInTheDocument();
    resolveSecondChunk!();

    expect((await screen.findByText('ハンズオンで基礎を学べます。')).tagName).toBe('LI');
    await waitFor(() => {
      expect(screen.queryByTestId('summary-terminal-cursor')).not.toBeInTheDocument();
    });
    expect(fetchEventDescription).toHaveBeenCalledWith('event-1');
    expect(availability).toHaveBeenCalled();
    expect(summarizeStreaming).toHaveBeenCalledWith('Reactの基礎をハンズオンで学ぶイベントです。', {
      context: '要約対象は技術イベントの説明文です。イベント名は「React入門」ですが、要約文には原則として含めないでください。',
    });
    expect(destroy).toHaveBeenCalled();
  });

  it('renders summary markdown beyond bullet lists', async () => {
    mockMatchMedia(true);
    vi.mocked(fetchEventDescription).mockResolvedValue('Reactの基礎をハンズオンで学ぶイベントです。');
    async function* streamSummary() {
      yield [
        '## 内容',
        '初心者が基礎を確認できます。',
        '',
        '1. **ハンズオン**で学べます。',
        '2. 詳細は[公式ページ](https://example.com)を確認できます。',
        '',
        '> 持ち物を確認してください。',
      ].join('\n');
    }
    Object.defineProperty(window, 'Summarizer', {
      value: {
        availability: vi.fn().mockResolvedValue('available'),
        create: vi.fn().mockResolvedValue({
          summarizeStreaming: vi.fn().mockReturnValue(streamSummary()),
          destroy: vi.fn(),
        }),
      },
      configurable: true,
    });

    renderSummary();

    fireEvent.click(await screen.findByRole('button', { name: 'どんなイベント？（AI要約）' }));

    expect(await screen.findByText('[ Built-in AI ]')).toBeInTheDocument();
    expect(screen.getByText('$ summarize https://example.com/event/1')).toBeInTheDocument();
    expect((await screen.findByRole('heading', { name: '内容' })).tagName).toBe('H3');
    expect(screen.getByText('初心者が基礎を確認できます。').tagName).toBe('P');
    expect(screen.getByText('ハンズオン').tagName).toBe('STRONG');
    expect(screen.getByRole('link', { name: '公式ページ' })).toHaveAttribute('href', 'https://example.com');
    expect(screen.getByText('持ち物を確認してください。')).toBeInTheDocument();
  });

  it('does not show model preparation progress when the Summarizer model is already available', async () => {
    mockMatchMedia(true);
    vi.mocked(fetchEventDescription).mockResolvedValue('Reactの基礎をハンズオンで学ぶイベントです。');
    let resolveStream: () => void;
    async function* streamSummary() {
      await new Promise<void>((resolve) => {
        resolveStream = resolve;
      });
      yield '- 初心者向けのReact勉強会です。';
    }
    const summarizeStreaming = vi.fn().mockReturnValue(streamSummary());
    const destroy = vi.fn();
    const create = vi.fn().mockResolvedValue({ summarizeStreaming, destroy });
    Object.defineProperty(window, 'Summarizer', {
      value: {
        availability: vi.fn().mockResolvedValue('available'),
        create,
      },
      configurable: true,
    });

    renderSummary();

    fireEvent.click(await screen.findByRole('button', { name: 'どんなイベント？（AI要約）' }));

    expect(await screen.findByText(/^確認中/)).toBeInTheDocument();
    expect(screen.queryByText(/^AIモデルをダウンロード中/)).not.toBeInTheDocument();
    await waitFor(() => {
      expect(create).toHaveBeenCalledWith(expect.not.objectContaining({
        monitor: expect.any(Function),
      }));
    });
    resolveStream!();

    expect((await screen.findByText('初心者向けのReact勉強会です。')).tagName).toBe('LI');
  });

  it('fetches the description from the year-scoped source when descriptionYear is provided', async () => {
    mockMatchMedia(true);
    vi.mocked(fetchEventDescription).mockResolvedValue('Reactの基礎をハンズオンで学ぶイベントです。');
    async function* streamSummary() {
      yield '- 初心者向けのReact勉強会です。';
    }
    Object.defineProperty(window, 'Summarizer', {
      value: {
        availability: vi.fn().mockResolvedValue('available'),
        create: vi.fn().mockResolvedValue({
          summarizeStreaming: vi.fn().mockReturnValue(streamSummary()),
          destroy: vi.fn(),
        }),
      },
      configurable: true,
    });

    renderSummary({ descriptionYear: 2026 });

    fireEvent.click(await screen.findByRole('button', { name: 'どんなイベント？（AI要約）' }));

    expect((await screen.findByText('初心者向けのReact勉強会です。')).tagName).toBe('LI');
    expect(fetchEventDescription).toHaveBeenCalledWith('event-1', { year: 2026 });
  });

  it('toggles the generated summary open and closed without fetching it again', async () => {
    mockMatchMedia(true);
    vi.mocked(fetchEventDescription).mockResolvedValue('Reactの基礎をハンズオンで学ぶイベントです。');
    async function* streamSummary() {
      yield '- 初心者向けのReact勉強会です。';
    }
    Object.defineProperty(window, 'Summarizer', {
      value: {
        availability: vi.fn().mockResolvedValue('available'),
        create: vi.fn().mockResolvedValue({
          summarizeStreaming: vi.fn().mockReturnValue(streamSummary()),
          destroy: vi.fn(),
        }),
      },
      configurable: true,
    });

    renderSummary();

    const summaryButton = await screen.findByRole('button', { name: 'どんなイベント？（AI要約）' });
    fireEvent.click(summaryButton);
    expect((await screen.findByText('初心者向けのReact勉強会です。')).tagName).toBe('LI');

    fireEvent.click(summaryButton);
    expect(screen.queryByText('初心者向けのReact勉強会です。')).not.toBeInTheDocument();

    fireEvent.click(summaryButton);
    expect(screen.getByText('初心者向けのReact勉強会です。').tagName).toBe('LI');
    expect(fetchEventDescription).toHaveBeenCalledTimes(1);
  });

  it('does not show the summary button when Chrome Summarizer API is missing', async () => {
    mockMatchMedia(true);
    vi.mocked(fetchEventDescription).mockResolvedValue('イベント説明文');
    Reflect.deleteProperty(window, 'Summarizer');

    renderSummary();

    expect(screen.queryByRole('button', { name: 'どんなイベント？（AI要約）' })).not.toBeInTheDocument();
    expect(fetchEventDescription).not.toHaveBeenCalled();
  });

  it('renders summary errors as terminal output', async () => {
    mockMatchMedia(true);
    vi.mocked(fetchEventDescription).mockResolvedValue('');
    Object.defineProperty(window, 'Summarizer', {
      value: {
        availability: vi.fn().mockResolvedValue('available'),
        create: vi.fn(),
      },
      configurable: true,
    });

    renderSummary();

    fireEvent.click(await screen.findByRole('button', { name: 'どんなイベント？（AI要約）' }));

    expect(await screen.findByText('error: 要約できる説明文がありません')).toBeInTheDocument();
  });
});
