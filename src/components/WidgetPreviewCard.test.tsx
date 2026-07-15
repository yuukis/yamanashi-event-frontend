import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithChakra } from '../test/test-utils';
import { WidgetPreviewCard } from './WidgetPreviewCard';

describe('WidgetPreviewCard', () => {
  it('renders the preview iframe with the given preview path and title', () => {
    renderWithChakra(
      <WidgetPreviewCard title={'イベント一覧'}
                          description={'説明'}
                          previewPath={'/widget/events?limit=5'}
                          embedPath={'/widget/events?limit=5'}
                          iframeTitle={'山梨イベント情報'}
                          elementId={'yamanashi-hub-widget-events'}
                          />,
    );

    const iframe = screen.getByTitle('山梨イベント情報');
    expect(iframe).toHaveAttribute('src', '/widget/events?limit=5');
    expect(iframe).toHaveAttribute('loading', 'lazy');
  });

  it('gives the copyable snippet textarea an accessible name derived from the card title', () => {
    renderWithChakra(
      <WidgetPreviewCard title={'イベント一覧'}
                          description={'説明'}
                          previewPath={'/widget/events?limit=5'}
                          embedPath={'/widget/events?limit=5'}
                          iframeTitle={'山梨イベント情報'}
                          elementId={'yamanashi-hub-widget-events'}
                          />,
    );

    expect(screen.getByRole('textbox', { name: 'イベント一覧の埋め込みスニペット' })).toBeInTheDocument();
  });

  it('includes the absolute embed URL and element id in the copyable snippet', () => {
    renderWithChakra(
      <WidgetPreviewCard title={'イベント一覧'}
                          description={'説明'}
                          previewPath={'/widget/events?limit=5'}
                          embedPath={'/widget/events?limit=5'}
                          iframeTitle={'山梨イベント情報'}
                          elementId={'yamanashi-hub-widget-events'}
                          />,
    );

    const snippet = (screen.getByRole('textbox') as HTMLTextAreaElement).value;
    expect(snippet).toContain('id="yamanashi-hub-widget-events"');
    expect(snippet).toContain('src="https://hub.yamanashi.dev/widget/events?limit=5"');
    expect(snippet).toContain("document.getElementById('yamanashi-hub-widget-events')");
    expect(snippet).toContain('title="山梨イベント情報"');
  });

  it('escapes quotes in the iframe title and element id within the snippet', () => {
    renderWithChakra(
      <WidgetPreviewCard title={'イベント一覧'}
                          description={'説明'}
                          previewPath={'/widget/groups/evil/events?limit=5'}
                          embedPath={'/widget/groups/evil/events?limit=5'}
                          iframeTitle={'"><script>alert(1)</script> イベント情報'}
                          elementId={"evil'id"}
                          />,
    );

    const snippet = (screen.getByRole('textbox') as HTMLTextAreaElement).value;
    expect(snippet).not.toContain('"><script>alert(1)</script>');
    expect(snippet).toContain('&quot;&gt;&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(snippet).not.toContain("getElementById('evil'id')");
    expect(snippet).toContain("getElementById('evil\\'id')");
  });

  it('guards against a missing iframe and a non-numeric height in the generated receiver script', () => {
    renderWithChakra(
      <WidgetPreviewCard title={'イベント一覧'}
                          description={'説明'}
                          previewPath={'/widget/events?limit=5'}
                          embedPath={'/widget/events?limit=5'}
                          iframeTitle={'山梨イベント情報'}
                          elementId={'yamanashi-hub-widget-events'}
                          />,
    );

    const snippet = (screen.getByRole('textbox') as HTMLTextAreaElement).value;
    expect(snippet).toContain('if (!iframe) return;');
    expect(snippet).toContain("typeof height !== 'number' || !isFinite(height) || height < 0");
  });

  it('renders the controls slot above the preview', () => {
    renderWithChakra(
      <WidgetPreviewCard title={'イベント一覧'}
                          description={'説明'}
                          previewPath={'/widget/events?limit=5'}
                          embedPath={'/widget/events?limit=5'}
                          iframeTitle={'山梨イベント情報'}
                          elementId={'yamanashi-hub-widget-events'}
                          controls={<div data-testid={'custom-controls'}>controls</div>}
                          />,
    );

    expect(screen.getByTestId('custom-controls')).toBeInTheDocument();
  });
});
