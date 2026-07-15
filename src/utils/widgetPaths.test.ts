import { describe, it, expect } from 'vitest';
import { buildListWidgetPath } from './widgetPaths';

describe('buildListWidgetPath', () => {
  it('builds the all-events widget path when no group key is given', () => {
    expect(buildListWidgetPath('')).toBe('/widget/events?limit=5');
  });

  it('builds the community-scoped widget path when a group key is given', () => {
    expect(buildListWidgetPath('techmujin')).toBe('/widget/groups/techmujin/events?limit=5');
  });
});
