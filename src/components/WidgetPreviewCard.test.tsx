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

    expect(screen.getByTitle('山梨イベント情報')).toHaveAttribute('src', '/widget/events?limit=5');
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
