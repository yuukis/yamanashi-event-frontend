import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { StructuredData } from './StructuredData';

describe('StructuredData', () => {
  it('injects a <script type="application/ld+json"> with the given id and data into <head>', () => {
    render(<StructuredData id={'test-jsonld'} data={{ '@type': 'Event', name: 'Test' }} />);

    const script = document.getElementById('test-jsonld');
    expect(script).not.toBeNull();
    expect(script?.getAttribute('type')).toBe('application/ld+json');
    expect(JSON.parse(script?.textContent ?? '')).toEqual({ '@type': 'Event', name: 'Test' });
  });

  it('renders no script when data is null', () => {
    render(<StructuredData id={'test-jsonld-null'} data={null} />);

    expect(document.getElementById('test-jsonld-null')).toBeNull();
  });

  it('removes the script on unmount', () => {
    const { unmount } = render(<StructuredData id={'test-jsonld-unmount'} data={{ '@type': 'Event' }} />);
    expect(document.getElementById('test-jsonld-unmount')).not.toBeNull();

    unmount();

    expect(document.getElementById('test-jsonld-unmount')).toBeNull();
  });

  it('replaces script content when data changes', () => {
    const { rerender } = render(<StructuredData id={'test-jsonld-update'} data={{ name: 'A' }} />);

    rerender(<StructuredData id={'test-jsonld-update'} data={{ name: 'B' }} />);

    const scripts = document.querySelectorAll('#test-jsonld-update');
    expect(scripts.length).toBe(1);
    expect(JSON.parse(scripts[0].textContent ?? '')).toEqual({ name: 'B' });
  });

  afterEach(() => {
    cleanup();
  });
});
