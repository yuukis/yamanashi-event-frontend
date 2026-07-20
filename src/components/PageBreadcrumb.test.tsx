import { describe, it, expect, afterEach } from 'vitest';
import { cleanup, screen } from '@testing-library/react';
import { renderWithChakra } from '../test/test-utils';
import { PageBreadcrumb } from './PageBreadcrumb';
import { SITE_URL } from '../utils/site';

describe('PageBreadcrumb', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders a home item followed by each given item, as links except the current (last) page', () => {
    renderWithChakra(
      <PageBreadcrumb items={[
        { label: 'コミュニティ一覧', href: '/groups' },
        { label: 'Kofu.rb', href: '/groups/kofurb' },
      ]}
      />,
    );

    const home = screen.getByRole('link', { name: 'トップ' });
    expect(home).toHaveAttribute('href', '/');

    const groups = screen.getByRole('link', { name: 'コミュニティ一覧' });
    expect(groups).toHaveAttribute('href', '/groups');

    expect(screen.queryByRole('link', { name: 'Kofu.rb' })).toBeNull();
    const current = screen.getByText('Kofu.rb');
    expect(current).toHaveAttribute('aria-current', 'page');
  });

  it('injects a BreadcrumbList JSON-LD script including the home item and every given item', () => {
    renderWithChakra(
      <PageBreadcrumb items={[{ label: 'イベントアーカイブ', href: '/events' }]} />,
    );

    const script = document.getElementById('structured-data-breadcrumb');
    expect(script).not.toBeNull();
    const data = JSON.parse(script?.textContent ?? '');
    expect(data).toMatchObject({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'トップ', item: `${SITE_URL}/` },
        { '@type': 'ListItem', position: 2, name: 'イベントアーカイブ', item: `${SITE_URL}/events` },
      ],
    });
  });
});
